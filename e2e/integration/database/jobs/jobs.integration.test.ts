import { describe, it, expect, beforeAll, afterAll, beforeEach } from "vitest";
import {
  connectTest,
  createTestDeps,
  createJob,
  getJobById,
  getJobsByStatus,
  getPendingJobs,
  getRetryableJobs,
  updateJobStatus,
  startJob,
  completeJob,
  failJob,
  cancelJob,
  getJobStats,
  schema,
  type DrizzleClient,
} from "@safee/database";

const { organizations } = schema;

describe("Jobs Integration Tests", () => {
  let db: DrizzleClient;
  let close: () => Promise<void>;
  let testOrgId: string;

  beforeAll(async () => {
    const connection = await connectTest();
    db = connection.drizzle;
    close = connection.close;
  });

  afterAll(async () => {
    await close();
  });

  beforeEach(async () => {
    // With CASCADE, we only need to delete organizations
    await db.delete(organizations);

    // Create test organization
    const [org] = await db
      .insert(organizations)
      .values({ name: "Test Org", slug: "test-org-jobs" })
      .returning();
    testOrgId = org.id;
  });

  describe("createJob", () => {
    it("should create a job in the database", async () => {
      const deps = createTestDeps(db);

      const jobData = {
        jobName: "send_email" as const,
        type: "immediate" as const,
        priority: "normal" as const,
        status: "pending" as const,
        organizationId: testOrgId,
        payload: { test: "data" },
        maxRetries: 3,
      };

      const job = await createJob(deps, jobData);

      expect(job).toBeDefined();
      expect(job.jobName).toBe("send_email");
      expect(job.type).toBe("immediate");
      expect(job.status).toBe("pending");
      expect(job.organizationId).toBe(testOrgId);
    });
  });

  describe("getJobById", () => {
    it("should retrieve job by ID with relations", async () => {
      const deps = createTestDeps(db);

      const created = await createJob(deps, {
        jobName: "send_email",
        type: "immediate" as const,
        priority: "normal" as const,
        status: "pending" as const,
        organizationId: testOrgId,
        payload: {},
        maxRetries: 3,
      });

      const job = await getJobById(deps, created.id);

      expect(job).toBeDefined();
      expect(job?.id).toBe(created.id);
      expect(job?.organizationId).toBe(testOrgId);
    });

    it("should return undefined for non-existent job", async () => {
      const deps = createTestDeps(db);

      const job = await getJobById(deps, "00000000-0000-0000-0000-000000000000");

      expect(job).toBeUndefined();
    });
  });

  describe("getJobsByStatus", () => {
    it("should get jobs by single status", async () => {
      const deps = createTestDeps(db);

      await createJob(deps, {
        jobName: "send_email",
        type: "immediate" as const,
        priority: "normal" as const,
        status: "pending" as const,
        organizationId: testOrgId,
        payload: {},
        maxRetries: 3,
      });

      await createJob(deps, {
        jobName: "send_email",
        type: "immediate" as const,
        priority: "normal" as const,
        status: "running" as const,
        organizationId: testOrgId,
        payload: {},
        maxRetries: 3,
      });

      const pendingJobs = await getJobsByStatus(deps, "pending");

      expect(pendingJobs).toHaveLength(1);
      expect(pendingJobs[0].jobName).toBe("send_email");
    });

    it("should get jobs by multiple statuses", async () => {
      const deps = createTestDeps(db);

      await createJob(deps, {
        jobName: "send_email",
        type: "immediate" as const,
        priority: "normal" as const,
        status: "pending" as const,
        organizationId: testOrgId,
        payload: {},
        maxRetries: 3,
      });

      await createJob(deps, {
        jobName: "send_email",
        type: "immediate" as const,
        priority: "normal" as const,
        status: "completed" as const,
        organizationId: testOrgId,
        payload: {},
        maxRetries: 3,
      });

      const jobsResult = await getJobsByStatus(deps, ["pending", "completed"]);

      expect(jobsResult).toHaveLength(2);
    });
  });

  describe("getPendingJobs", () => {
    it("should get pending jobs due for execution", async () => {
      const deps = createTestDeps(db);

      const pastDate = new Date(Date.now() - 1000 * 60 * 60); // 1 hour ago

      await createJob(deps, {
        jobName: "send_email",
        type: "scheduled" as const,
        priority: "normal" as const,
        status: "pending" as const,
        organizationId: testOrgId,
        scheduledFor: pastDate,
        payload: {},
        maxRetries: 3,
      });

      await createJob(deps, {
        jobName: "send_email",
        type: "scheduled" as const,
        priority: "normal" as const,
        status: "pending" as const,
        organizationId: testOrgId,
        scheduledFor: new Date(Date.now() + 1000 * 60 * 60), // 1 hour from now
        payload: {},
        maxRetries: 3,
      });

      const pendingJobs = await getPendingJobs(deps);

      expect(pendingJobs).toHaveLength(1);
      expect(pendingJobs[0].jobName).toBe("send_email");
    });

    it("should filter pending jobs by organization", async () => {
      const deps = createTestDeps(db);

      const [org2] = await db
        .insert(organizations)
        .values({ name: "Test Org 2", slug: "test-org-2-jobs" })
        .returning();

      await createJob(deps, {
        jobName: "send_email",
        type: "immediate" as const,
        priority: "normal" as const,
        status: "pending" as const,
        organizationId: testOrgId,
        payload: {},
        maxRetries: 3,
      });

      await createJob(deps, {
        jobName: "send_email",
        type: "immediate" as const,
        priority: "normal" as const,
        status: "pending" as const,
        organizationId: org2.id,
        payload: {},
        maxRetries: 3,
      });

      const org1Jobs = await getPendingJobs(deps, 10, testOrgId);

      expect(org1Jobs).toHaveLength(1);
      expect(org1Jobs[0].organizationId).toBe(testOrgId);
    });
  });

  describe("getRetryableJobs", () => {
    it("should get failed jobs that can be retried", async () => {
      const deps = createTestDeps(db);

      const job = await createJob(deps, {
        jobName: "send_email",
        type: "immediate" as const,
        priority: "normal" as const,
        status: "pending" as const,
        organizationId: testOrgId,
        payload: {},
        maxRetries: 3,
      });

      await updateJobStatus(deps, job.id, "failed", {
        error: "Test error",
        attempts: 1,
      });

      const retryableJobs = await getRetryableJobs(deps);

      expect(retryableJobs).toHaveLength(1);
      expect(retryableJobs[0].id).toBe(job.id);
      expect(retryableJobs[0].attempts).toBeLessThan(retryableJobs[0].maxRetries);
    });

    it("should not return jobs that exceeded max retries", async () => {
      const deps = createTestDeps(db);

      const job = await createJob(deps, {
        jobName: "send_email",
        type: "immediate" as const,
        priority: "normal" as const,
        status: "pending" as const,
        organizationId: testOrgId,
        payload: {},
        maxRetries: 3,
      });

      await updateJobStatus(deps, job.id, "failed", {
        error: "Test error",
        attempts: 3,
      });

      const retryableJobs = await getRetryableJobs(deps);

      expect(retryableJobs).toHaveLength(0);
    });
  });

  describe("updateJobStatus", () => {
    it("should update job status and metadata", async () => {
      const deps = createTestDeps(db);

      const job = await createJob(deps, {
        jobName: "send_email",
        type: "immediate" as const,
        priority: "normal" as const,
        status: "pending" as const,
        organizationId: testOrgId,
        payload: {},
        maxRetries: 3,
      });

      const updated = await updateJobStatus(deps, job.id, "running", {
        startedAt: new Date(),
      });

      expect(updated.status).toBe("running");
      expect(updated.startedAt).toBeDefined();
    });

    it("should throw error for non-existent job", async () => {
      const deps = createTestDeps(db);

      await expect(
        updateJobStatus(deps, "00000000-0000-0000-0000-000000000000", "completed"),
      ).rejects.toThrow("Job with ID");
    });
  });

  describe("startJob", () => {
    it("should start job execution", async () => {
      const deps = createTestDeps(db);

      const job = await createJob(deps, {
        jobName: "send_email",
        type: "immediate" as const,
        priority: "normal" as const,
        status: "pending" as const,
        organizationId: testOrgId,
        payload: {},
        maxRetries: 3,
      });

      const started = await startJob(deps, job.id);

      expect(started.status).toBe("running");
      expect(started.startedAt).toBeDefined();
      expect(started.attempts).toBe(1);
    });
  });

  describe("completeJob", () => {
    it("should complete job with result", async () => {
      const deps = createTestDeps(db);

      const job = await createJob(deps, {
        jobName: "send_email",
        type: "immediate" as const,
        priority: "normal" as const,
        status: "pending" as const,
        organizationId: testOrgId,
        payload: {},
        maxRetries: 3,
      });

      await startJob(deps, job.id);
      const completed = await completeJob(deps, job.id, { success: true });

      expect(completed.status).toBe("completed");
      expect(completed.completedAt).toBeDefined();
      expect(completed.result).toEqual({ success: true });
    });
  });

  describe("failJob", () => {
    it("should fail job with error message", async () => {
      const deps = createTestDeps(db);

      const job = await createJob(deps, {
        jobName: "send_email",
        type: "immediate" as const,
        priority: "normal" as const,
        status: "pending" as const,
        organizationId: testOrgId,
        payload: {},
        maxRetries: 3,
      });

      await startJob(deps, job.id);
      const failed = await failJob(deps, job.id, "Test error");

      expect(failed.status).toBe("failed");
      expect(failed.error).toBe("Test error");
      expect(failed.completedAt).toBeDefined();
    });

    it("should set retrying status when retry is requested", async () => {
      const deps = createTestDeps(db);

      const job = await createJob(deps, {
        jobName: "send_email",
        type: "immediate" as const,
        priority: "normal" as const,
        status: "pending" as const,
        organizationId: testOrgId,
        payload: {},
        maxRetries: 3,
      });

      await startJob(deps, job.id);
      const retrying = await failJob(deps, job.id, "Test error", true);

      expect(retrying.status).toBe("retrying");
      expect(retrying.error).toBe("Test error");
    });
  });

  describe("cancelJob", () => {
    it("should cancel pending job", async () => {
      const deps = createTestDeps(db);

      const job = await createJob(deps, {
        jobName: "send_email",
        type: "immediate" as const,
        priority: "normal" as const,
        status: "pending" as const,
        organizationId: testOrgId,
        payload: {},
        maxRetries: 3,
      });

      const cancelled = await cancelJob(deps, job.id);

      expect(cancelled.status).toBe("cancelled");
      expect(cancelled.completedAt).toBeDefined();
    });
  });

  describe("getJobStats", () => {
    it("should get job statistics", async () => {
      const deps = createTestDeps(db);

      await createJob(deps, {
        jobName: "send_email",
        type: "immediate" as const,
        priority: "normal" as const,
        status: "pending" as const,
        organizationId: testOrgId,
        payload: {},
        maxRetries: 3,
      });

      await createJob(deps, {
        jobName: "send_email",
        type: "scheduled" as const,
        priority: "high" as const,
        status: "completed" as const,
        organizationId: testOrgId,
        payload: {},
        maxRetries: 3,
      });

      const stats = await getJobStats(deps);

      expect(stats.total).toBe(2);
      expect(stats.byStatus.pending).toBe(1);
      expect(stats.byStatus.completed).toBe(1);
      expect(stats.byType.immediate).toBe(1);
      expect(stats.byType.scheduled).toBe(1);
      expect(stats.byPriority.normal).toBe(1);
      expect(stats.byPriority.high).toBe(1);
    });

    it("should filter stats by organization", async () => {
      const deps = createTestDeps(db);

      const [org2] = await db
        .insert(organizations)
        .values({ name: "Test Org 2", slug: "test-org-2-stats" })
        .returning();

      await createJob(deps, {
        jobName: "send_email",
        type: "immediate" as const,
        priority: "normal" as const,
        status: "pending" as const,
        organizationId: testOrgId,
        payload: {},
        maxRetries: 3,
      });

      await createJob(deps, {
        jobName: "send_email",
        type: "immediate" as const,
        priority: "normal" as const,
        status: "pending" as const,
        organizationId: org2.id,
        payload: {},
        maxRetries: 3,
      });

      const stats = await getJobStats(deps, testOrgId);

      expect(stats.total).toBe(1);
    });
  });
});
