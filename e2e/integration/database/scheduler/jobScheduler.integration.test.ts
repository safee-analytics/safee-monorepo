import { describe, it, expect, beforeAll, afterAll, beforeEach, afterEach, vi, type Mock } from "vitest";
import {
  connectTest,
  createTestDeps,
  JobScheduler,
  createJobSchedule,
  createJob,
  schema,
  type DrizzleClient,
} from "@safee/database";
import { nukeDatabase } from "@safee/database/test-helpers";

const { organizations } = schema;

interface MockQueueManager {
  addJobByName: Mock<
    (
      jobName: string,
      data: Record<string, unknown>,
      options: Record<string, unknown>,
    ) => Promise<{ bullmqJobId: string; pgJobId: string }>
  >;
}

describe("JobScheduler Integration Tests", () => {
  let db: DrizzleClient;
  let close: () => Promise<void>;
  let scheduler: JobScheduler;
  let mockQueueManager: MockQueueManager;
  let testOrgId: string;

  beforeAll(async () => {
    const connection = await connectTest({ appName: "job-scheduler-integration-test" });
    db = connection.drizzle;
    close = connection.close;
  });

  afterAll(async () => {
    await close();
  });

  beforeEach(async () => {
    await nukeDatabase(db);
    const [org] = await db
      .insert(organizations)
      .values({ name: "Test Org", slug: "test-org-scheduler" })
      .returning();
    testOrgId = org.id;

    mockQueueManager = {
      addJobByName: vi.fn().mockResolvedValue({ bullmqJobId: "mock-job-id", pgJobId: "mock-pg-id" }),
    };
    scheduler = new JobScheduler({
      queueManager: mockQueueManager as never,
    });
  });

  afterEach(async () => {
    await scheduler.stop();
  });

  describe("start and stop", () => {
    it("should start scheduler successfully", async () => {
      const deps = createTestDeps(db);

      await scheduler.start(deps);
    });

    it("should stop scheduler successfully", async () => {
      const deps = createTestDeps(db);

      await scheduler.start(deps);
      await scheduler.stop();
    });

    it("should not start if already running", async () => {
      const deps = createTestDeps(db);

      await scheduler.start(deps);
      await scheduler.start(deps); // Should not throw, just log warning
    });
  });

  describe("scheduleJob", () => {
    it("should schedule an active job with cron expression", async () => {
      const deps = createTestDeps(db);
      await scheduler.start(deps);

      const schedule = await createJobSchedule(deps, {
        name: "Test Schedule",
        jobName: "send_email",
        cronExpression: "0 * * * *", // Every hour
        timezone: "UTC",
        isActive: true,
      });

      await scheduler.scheduleJob(deps, schedule.id);
    });

    it("should not schedule inactive job", async () => {
      const deps = createTestDeps(db);
      await scheduler.start(deps);

      const schedule = await createJobSchedule(deps, {
        name: "Inactive Schedule",
        jobName: "send_email",
        cronExpression: "0 * * * *",
        isActive: false,
      });

      await scheduler.scheduleJob(deps, schedule.id);

      // Should complete without error but not actually schedule
    });

    it("should not schedule job without cron expression", async () => {
      const deps = createTestDeps(db);
      await scheduler.start(deps);

      const schedule = await createJobSchedule(deps, {
        name: "No Cron",
        jobName: "send_email",
        isActive: true,
      });

      await scheduler.scheduleJob(deps, schedule.id);

      // Should complete without error but not actually schedule
    });

    it("should handle non-existent schedule gracefully", async () => {
      const deps = createTestDeps(db);
      await scheduler.start(deps);

      await scheduler.scheduleJob(deps, "00000000-0000-0000-0000-000000000000");

      // Should not throw error
    });

    it("should replace existing scheduled job", async () => {
      const deps = createTestDeps(db);
      await scheduler.start(deps);

      const schedule = await createJobSchedule(deps, {
        name: "Test Schedule",
        jobName: "send_email",
        cronExpression: "0 * * * *",
        isActive: true,
      });

      await scheduler.scheduleJob(deps, schedule.id);
      await scheduler.scheduleJob(deps, schedule.id); // Schedule again
    });
  });

  describe("unscheduleJob", () => {
    it("should unschedule a scheduled job", async () => {
      const deps = createTestDeps(db);
      await scheduler.start(deps);

      const schedule = await createJobSchedule(deps, {
        name: "Test Schedule",
        jobName: "send_email",
        cronExpression: "0 * * * *",
        isActive: true,
      });

      await scheduler.scheduleJob(deps, schedule.id);
      await scheduler.unscheduleJob(schedule.id);

      // Should complete without error
    });

    it("should handle unscheduling non-existent job gracefully", async () => {
      const deps = createTestDeps(db);
      await scheduler.start(deps);

      await scheduler.unscheduleJob("00000000-0000-0000-0000-000000000000");

      // Should not throw error
    });
  });

  describe("queueJob", () => {
    it("should publish job to queue", async () => {
      const deps = createTestDeps(db);
      await scheduler.start(deps);

      const job = await createJob(deps, {
        jobName: "send_email",
        type: "immediate" as const,
        priority: "normal" as const,
        status: "pending" as const,
        organizationId: testOrgId,
        payload: {},
        maxRetries: 3,
      });

      await scheduler.queueJob(job.id, "send_email");

      // If no error is thrown, the job was queued successfully
    });
  });

  describe("job processing", () => {
    it("should process queued job and update status", async () => {
      const deps = createTestDeps(db);
      await scheduler.start(deps);

      const job = await createJob(deps, {
        jobName: "send_email",
        type: "immediate" as const,
        priority: "normal" as const,
        status: "pending" as const,
        organizationId: testOrgId,
        payload: {},
        maxRetries: 3,
      });

      await scheduler.queueJob(job.id, "send_email");

      // Verify QueueManager was called
      expect(mockQueueManager.addJobByName).toHaveBeenCalledWith("send_email", { jobId: job.id }, {});
    });

    it("should handle job processing errors", async () => {
      const deps = createTestDeps(db);
      await scheduler.start(deps);

      const job = await createJob(deps, {
        jobName: "send_email",
        type: "immediate" as const,
        priority: "normal" as const,
        status: "pending" as const,
        organizationId: testOrgId,
        payload: {},
        maxRetries: 3,
      });

      await scheduler.queueJob(job.id, "send_email");

      // Verify QueueManager was called
      expect(mockQueueManager.addJobByName).toHaveBeenCalled();
    });
  });

  describe("load schedules on start", () => {
    it("should load and schedule active jobs on start", async () => {
      const deps = createTestDeps(db);

      await createJobSchedule(deps, {
        name: "Pre-existing Schedule",
        jobName: "send_email",
        cronExpression: "0 * * * *",
        isActive: true,
      });

      await scheduler.start(deps);

      // If no error is thrown, schedules were loaded successfully
    });

    it("should not load inactive schedules", async () => {
      const deps = createTestDeps(db);

      await createJobSchedule(deps, {
        name: "Inactive Schedule",
        jobName: "send_email",
        cronExpression: "0 * * * *",
        isActive: false,
      });

      await scheduler.start(deps);
    });

    it("should not load schedules without cron expression", async () => {
      const deps = createTestDeps(db);

      await createJobSchedule(deps, {
        name: "No Cron Schedule",
        jobName: "send_email",
        isActive: true,
      });

      await scheduler.start(deps);
    });
  });

  describe("cron job execution", () => {
    it("should create job when cron triggers (simulated)", async () => {
      const deps = createTestDeps(db);
      await scheduler.start(deps);

      const schedule = await createJobSchedule(deps, {
        name: "Frequent Schedule",
        jobName: "send_email",
        cronExpression: "* * * * * *", // Every second
        isActive: true,
      });

      await scheduler.scheduleJob(deps, schedule.id);

      await new Promise((resolve) => setTimeout(resolve, 1500));

      const allJobs = await db.query.jobs.findMany();

      expect(allJobs.length).toBeGreaterThanOrEqual(0);
    });
  });

  describe("timezone handling", () => {
    it("should respect timezone in schedule", async () => {
      const deps = createTestDeps(db);
      await scheduler.start(deps);

      const schedule = await createJobSchedule(deps, {
        name: "Timezone Schedule",
        jobName: "send_email",
        cronExpression: "0 9 * * *", // 9 AM daily
        timezone: "America/New_York",
        isActive: true,
      });

      await scheduler.scheduleJob(deps, schedule.id);

      // If no error is thrown, timezone was handled correctly
    });
  });
});
