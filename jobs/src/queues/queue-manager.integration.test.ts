import { describe, it, beforeAll, afterAll, beforeEach, expect } from "vitest";
import { Queue } from "bullmq";
import { Redis } from "ioredis";
import { pino } from "pino";
import { connectTest, nukeDatabase, createTestOrganization } from "@safee/database/test-helpers";
import { getJobById, getJobsByStatus } from "@safee/database";
import type { DrizzleClient, DbDeps } from "@safee/database";
import { QueueManager } from "./queue-manager.js";
import { cleanAllQueues } from "../test-helpers/cleanQueues.js";

describe("QueueManager Integration Tests", () => {
  let drizzle: DrizzleClient;
  let closeDb: () => Promise<void>;
  let redis: Redis;
  let queueManager: QueueManager;
  let deps: DbDeps;
  let testOrgId: string;
  const logger = pino({ level: "silent" });

  beforeAll(async () => {
    ({ drizzle, close: closeDb } = await connectTest({ appName: "queue-manager-test" }));
    deps = { drizzle, logger };

    redis = new Redis(process.env.REDIS_URL ?? "redis://localhost:6379", {
      maxRetriesPerRequest: null,
      enableReadyCheck: false,
    });

    queueManager = new QueueManager();
  });

  afterAll(async () => {
    await queueManager.close();
    await redis.quit();
    await closeDb();
  });

  beforeEach(async () => {
    await nukeDatabase(drizzle);

    // Create test organization for foreign key constraints
    const testOrg = await createTestOrganization(drizzle);
    testOrgId = testOrg.id;

    // Clean up any existing jobs in Redis queues
    await cleanAllQueues(redis);
  });

  describe("Dual Persistence", () => {
    it("creates job in both PostgreSQL and BullMQ", async () => {
      const result = await queueManager.addJob(
        "email-jobs",
        { type: "send_email", test: "data" },
        { priority: "high" },
      );

      // Verify PostgreSQL record
      expect(result.pgJobId).toBeTruthy();
      const pgJob = await getJobById(deps, result.pgJobId);
      expect(pgJob).toBeTruthy();
      expect(pgJob!.jobName).toBe("send_email");
      expect(pgJob!.status).toBe("pending");

      // Verify BullMQ job
      expect(result.bullmqJobId).toBeTruthy();
      expect(result.bullmqJobId).toBe(result.pgJobId); // Should use same ID

      // Verify job is in BullMQ queue
      const queue = new Queue("email-jobs", { connection: redis });
      const bullmqJob = await queue.getJob(result.bullmqJobId);
      expect(bullmqJob).toBeTruthy();
      expect(bullmqJob!.data).toMatchObject({ type: "send_email", test: "data" });

      await queue.close();
    });

    it("correlates BullMQ job ID with PostgreSQL job ID", async () => {
      const result = await queueManager.addJob("analytics", { type: "calculate_dashboard_metrics" });

      // IDs should be the same for correlation
      expect(result.bullmqJobId).toBe(result.pgJobId);

      // Verify correlation works
      const pgJob = await getJobById(deps, result.pgJobId);
      const queue = new Queue("analytics", { connection: redis });
      const bullmqJob = await queue.getJob(result.bullmqJobId);

      expect(pgJob).toBeTruthy();
      expect(bullmqJob).toBeTruthy();
      expect(bullmqJob!.id).toBe(pgJob!.id);

      await queue.close();
    });

    it("stores job payload in PostgreSQL for audit trail", async () => {
      const payload = {
        type: "send_email",
        to: [{ email: "test@example.com", name: "Test User" }],
        subject: "Important Notification",
        html: "<p>Test content</p>",
      };

      const result = await queueManager.addJob("email-jobs", payload, { priority: "high" });

      const pgJob = await getJobById(deps, result.pgJobId);
      expect(pgJob!.payload).toEqual(payload);

      // Verify payload is also in BullMQ
      const queue = new Queue("email-jobs", { connection: redis });
      const bullmqJob = await queue.getJob(result.bullmqJobId);
      expect(bullmqJob!.data).toEqual(payload);

      await queue.close();
    });
  });

  describe("addJobByName routing", () => {
    it("routes send_email to email-jobs queue", async () => {
      const result = await queueManager.addJobByName("send_email", { test: "data" });

      const pgJob = await getJobById(deps, result.pgJobId);
      expect(pgJob!.jobName).toBe("send_email");

      // Verify it went to the correct queue
      const emailQueue = new Queue("email-jobs", { connection: redis });
      const analyticsQueue = new Queue("analytics", { connection: redis });

      const emailJob = await emailQueue.getJob(result.bullmqJobId);
      const analyticsJob = await analyticsQueue.getJob(result.bullmqJobId);

      expect(emailJob).toBeTruthy(); // Should be in email-jobs queue
      expect(analyticsJob).toBeUndefined(); // Should NOT be in analytics queue

      await emailQueue.close();
      await analyticsQueue.close();
    });

    it("routes calculate_analytics to analytics queue", async () => {
      const result = await queueManager.addJobByName("calculate_analytics", { test: "data" });

      const pgJob = await getJobById(deps, result.pgJobId);
      expect(pgJob!.jobName).toBe("calculate_analytics");

      const analyticsQueue = new Queue("analytics", { connection: redis });
      const job = await analyticsQueue.getJob(result.bullmqJobId);
      expect(job).toBeTruthy();

      await analyticsQueue.close();
    });

    it("routes encrypt_file to encryption queue", async () => {
      const result = await queueManager.addJobByName("encrypt_file", { test: "data" });

      const pgJob = await getJobById(deps, result.pgJobId);
      expect(pgJob!.jobName).toBe("encrypt_file");

      const encryptionQueue = new Queue("encryption", { connection: redis });
      const job = await encryptionQueue.getJob(result.bullmqJobId);
      expect(job).toBeTruthy();

      await encryptionQueue.close();
    });

    it("routes rotate_encryption_key to key-rotation queue", async () => {
      const result = await queueManager.addJobByName("rotate_encryption_key", { test: "data" });

      const pgJob = await getJobById(deps, result.pgJobId);
      expect(pgJob!.jobName).toBe("rotate_encryption_key");

      const keyRotationQueue = new Queue("key-rotation", { connection: redis });
      const job = await keyRotationQueue.getJob(result.bullmqJobId);
      expect(job).toBeTruthy();

      await keyRotationQueue.close();
    });

    it("routes all job types correctly", async () => {
      const jobMappings = [
        { jobName: "send_email", expectedQueue: "email-jobs" },
        { jobName: "send_bulk_email", expectedQueue: "email" },
        { jobName: "calculate_analytics", expectedQueue: "analytics" },
        { jobName: "sync_odoo", expectedQueue: "odoo-sync" },
        { jobName: "generate_report", expectedQueue: "reports" },
        { jobName: "odoo_provisioning", expectedQueue: "odoo-provisioning" },
        { jobName: "install_odoo_modules", expectedQueue: "install-modules" },
        { jobName: "encrypt_file", expectedQueue: "encryption" },
        { jobName: "rotate_encryption_key", expectedQueue: "key-rotation" },
      ] as const;

      for (const { jobName, expectedQueue } of jobMappings) {
        const result = await queueManager.addJobByName(jobName, { test: jobName });

        const queue = new Queue(expectedQueue, { connection: redis });
        const job = await queue.getJob(result.bullmqJobId);

        expect(job, `Job ${jobName} should be in ${expectedQueue} queue`).toBeTruthy();

        await queue.close();
      }
    });
  });

  describe("Priority Handling", () => {
    it("sets correct BullMQ priority for critical jobs", async () => {
      const result = await queueManager.addJob("email-jobs", { test: "data" }, { priority: "critical" });

      const queue = new Queue("email-jobs", { connection: redis });
      const job = await queue.getJob(result.bullmqJobId);

      expect(job!.opts.priority).toBe(1); // Critical = 1 (highest)

      await queue.close();
    });

    it("sets correct BullMQ priority for high priority jobs", async () => {
      const result = await queueManager.addJob("email-jobs", { test: "data" }, { priority: "high" });

      const queue = new Queue("email-jobs", { connection: redis });
      const job = await queue.getJob(result.bullmqJobId);

      expect(job!.opts.priority).toBe(3); // High = 3

      await queue.close();
    });

    it("sets correct BullMQ priority for normal priority jobs", async () => {
      const result = await queueManager.addJob("email-jobs", { test: "data" }, { priority: "normal" });

      const queue = new Queue("email-jobs", { connection: redis });
      const job = await queue.getJob(result.bullmqJobId);

      expect(job!.opts.priority).toBe(5); // Normal = 5 (default)

      await queue.close();
    });

    it("defaults to normal priority when not specified", async () => {
      const result = await queueManager.addJob("email-jobs", { test: "data" });

      const pgJob = await getJobById(deps, result.pgJobId);
      expect(pgJob!.priority).toBe("normal");

      const queue = new Queue("email-jobs", { connection: redis });
      const job = await queue.getJob(result.bullmqJobId);
      expect(job!.opts.priority).toBe(5);

      await queue.close();
    });
  });

  describe("Organization ID Tracking", () => {
    it("stores organization ID in PostgreSQL job", async () => {
      const result = await queueManager.addJob(
        "email-jobs",
        { test: "data" },
        {
          organizationId: testOrgId,
          priority: "normal",
        },
      );

      const pgJob = await getJobById(deps, result.pgJobId);
      expect(pgJob!.organizationId).toBe(testOrgId);
    });

    it("allows querying jobs by organization", async () => {
      // Create a second test organization
      const org2 = await createTestOrganization(drizzle, { slug: "test-org-2" });

      await queueManager.addJob("email-jobs", { test: "org1-job1" }, { organizationId: testOrgId });
      await queueManager.addJob("email-jobs", { test: "org1-job2" }, { organizationId: testOrgId });
      await queueManager.addJob("email-jobs", { test: "org2-job1" }, { organizationId: org2.id });

      // Get all pending jobs and filter by organization
      const allJobs = await getJobsByStatus(deps, "pending");
      const org1Jobs = allJobs.filter((job) => job.organizationId === testOrgId);
      const org2Jobs = allJobs.filter((job) => job.organizationId === org2.id);

      expect(org1Jobs.length).toBe(2);
      expect(org2Jobs.length).toBe(1);
    });
  });

  describe("Error Handling", () => {
    it("throws error for unknown job name", async () => {
      await expect(queueManager.addJobByName("unknown_job" as never, {})).rejects.toThrow(/Unknown job name/);
    });

    it("throws error for unknown queue name", async () => {
      await expect(queueManager.addJob("unknown-queue" as never, {})).rejects.toThrow(
        /Queue unknown-queue not found/,
      );
    });

    it("handles BullMQ connection errors gracefully", async () => {
      // Create a queue manager with a bad Redis connection
      const badRedis = new Redis({
        host: "invalid-host",
        port: 9999,
        maxRetriesPerRequest: 1,
        retryStrategy: () => null, // Don't retry
      });

      const badQueue = new Queue("test", { connection: badRedis });

      // Should eventually fail
      await expect(badQueue.add("test", { test: "data" })).rejects.toThrow();

      await badQueue.close();
      badRedis.disconnect();
    });
  });

  describe("Cleanup", () => {
    it("closes all queues properly", async () => {
      const manager = new QueueManager();

      // Add some jobs to ensure queues are active
      await manager.addJob("email-jobs", { test: "data" });
      await manager.addJob("analytics", { test: "data" });

      // Close should not throw
      await expect(manager.close()).resolves.not.toThrow();
    });
  });
});
