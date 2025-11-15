import { describe, it, beforeAll, afterAll, beforeEach, expect } from "vitest";
import { pino } from "pino";
import { testConnect } from "../drizzle/testConnect.js";
import { nukeDatabase } from "../test-helpers/test-fixtures.js";
import type { DrizzleClient } from "../drizzle.js";
import {
  createJob,
  getJobById,
  getPendingJobs,
  getRetryableJobs,
  updateJobStatus,
  startJob,
  completeJob,
  failJob,
  cancelJob,
  getJobStats,
} from "./jobs.js";
import * as schema from "../drizzle/index.js";
import type { DbDeps } from "../deps.js";

void describe("Jobs", async () => {
  let drizzle: DrizzleClient;
  let close: () => Promise<void>;
  const logger = pino({ level: "silent" });
  let deps: DbDeps;

  beforeAll(async () => {
    ({ drizzle, close } = testConnect("jobs-test"));
    deps = { drizzle, logger };
  });

  afterAll(async () => {
    await close();
  });

  void describe("createJob", async () => {
    beforeEach(async () => {
      await nukeDatabase(drizzle);
    });

    void it("creates job successfully", async () => {
      const jobData = {
        jobName: "send_email" as const,
        type: "immediate" as const,
        priority: "normal" as const,
        payload: { customData: "test" },
        maxRetries: 3,
      };

      const job = await createJob(deps, jobData);

      expect(job.id).toBeTruthy();
      expect(job.jobName).toBe("send_email");
      expect(job.status).toBe("pending");
      expect(job.type).toBe("immediate");
      expect(job.priority).toBe("normal");
      expect(job.payload).toEqual({ customData: "test" });
      expect(job.maxRetries).toBe(3);
    });
  });

  void describe("getJobById", async () => {
    let testJob: typeof schema.jobs.$inferSelect;

    beforeEach(async () => {
      await nukeDatabase(drizzle);

      testJob = await createJob(deps, {
        jobName: "send_email" as const,
        type: "immediate" as const,
        priority: "high" as const,
        maxRetries: 3,
      });
    });

    void it("retrieves job by ID", async () => {
      const retrievedJob = await getJobById(deps, testJob.id);

      expect(retrievedJob).toBeTruthy();
      expect(retrievedJob!.id).toBe(testJob.id);
      expect(retrievedJob!.jobName).toBe("send_email");
    });

    void it("returns undefined for non-existent job", async () => {
      const job = await getJobById(deps, "00000000-0000-0000-0000-000000000000");
      expect(job).toBe(undefined);
    });
  });

  void describe("job status updates", async () => {
    let testJob: typeof schema.jobs.$inferSelect;

    beforeEach(async () => {
      await nukeDatabase(drizzle);

      testJob = await createJob(deps, {
        jobName: "send_email" as const,
        type: "immediate" as const,
        priority: "normal" as const,
        maxRetries: 3,
      });
    });

    void it("starts job correctly", async () => {
      const startedJob = await startJob(deps, testJob.id);

      expect(startedJob.status).toBe("running");
      expect(startedJob.attempts).toBe(1);
      expect(startedJob.startedAt).toBeTruthy();
    });

    void it("completes job with result", async () => {
      await startJob(deps, testJob.id);
      const result = { output: "success", processed: 100 };

      const completedJob = await completeJob(deps, testJob.id, result);

      expect(completedJob.status).toBe("completed");
      expect(completedJob.result).toEqual(result);
      expect(completedJob.completedAt).toBeTruthy();
    });

    void it("fails job without retry", async () => {
      await startJob(deps, testJob.id);

      const failedJob = await failJob(deps, testJob.id, "Processing failed", false);

      expect(failedJob.status).toBe("failed");
      expect(failedJob.error).toBe("Processing failed");
      expect(failedJob.completedAt).toBeTruthy();
    });

    void it("fails job with retry", async () => {
      await startJob(deps, testJob.id);

      const retryJob = await failJob(deps, testJob.id, "Temporary failure", true);

      expect(retryJob.status).toBe("retrying");
      expect(retryJob.error).toBe("Temporary failure");
      expect(retryJob.completedAt).toBe(null);
    });

    void it("cancels job", async () => {
      const cancelledJob = await cancelJob(deps, testJob.id);

      expect(cancelledJob.status).toBe("cancelled");
      expect(cancelledJob.completedAt).toBeTruthy();
    });

    void it("throws error when updating non-existent job", async () => {
      await expect(updateJobStatus(deps, "00000000-0000-0000-0000-000000000000", "running")).rejects.toThrow(
        /Job with ID '00000000-0000-0000-0000-000000000000' not found/,
      );
    });
  });

  void describe("getPendingJobs", async () => {
    beforeEach(async () => {
      await nukeDatabase(drizzle);

      await createJob(deps, {
        jobName: "send_email" as const,
        type: "immediate" as const,
        priority: "high" as const,
        maxRetries: 3,
      });

      await createJob(deps, {
        jobName: "send_email" as const,
        type: "immediate" as const,
        priority: "low" as const,
        maxRetries: 3,
      });

      await createJob(deps, {
        jobName: "send_email" as const,
        type: "immediate" as const,
        priority: "normal" as const,
        scheduledFor: new Date(Date.now() + 60000), // Future
        maxRetries: 3,
      });
    });

    void it("returns pending jobs ordered by priority", async () => {
      const pendingJobs = await getPendingJobs(deps, 10);

      expect(pendingJobs.length >= 2).toBeTruthy();
      const priorities = pendingJobs.map((job) => job.priority);
      expect(priorities[0]).toBe("high");
    });

    void it("respects limit parameter", async () => {
      const pendingJobs = await getPendingJobs(deps, 1);
      expect(pendingJobs.length).toBe(1);
    });

    void it("only returns jobs scheduled for now or past", async () => {
      const pendingJobs = await getPendingJobs(deps, 10);
      const now = new Date();

      for (const job of pendingJobs) {
        if (job.scheduledFor) {
          expect(job.scheduledFor.getTime() <= now.getTime()).toBeTruthy();
        }
      }
    });
  });

  void describe("getRetryableJobs", async () => {
    beforeEach(async () => {
      await nukeDatabase(drizzle);
    });

    void it("finds failed jobs with remaining retries", async () => {
      const job = await createJob(deps, {
        jobName: "send_email" as const,
        type: "immediate" as const,
        priority: "normal" as const,
        maxRetries: 3,
      });

      // Fail the job with retry available
      await updateJobStatus(deps, job.id, "failed", { attempts: 1, error: "Test failure" });

      const retryableJobs = await getRetryableJobs(deps, 10);
      const testJob = retryableJobs.find((j) => j.id === job.id);

      expect(testJob).toBeTruthy();
      expect(testJob!.status).toBe("failed");
      expect(testJob!.attempts < testJob!.maxRetries).toBeTruthy();
    });

    void it("excludes jobs that have exhausted retries", async () => {
      const job = await createJob(deps, {
        jobName: "send_email" as const,
        type: "immediate" as const,
        priority: "normal" as const,
        maxRetries: 3,
      });

      // Fail the job with max retries reached
      await updateJobStatus(deps, job.id, "failed", { attempts: 3, error: "Max retries reached" });

      const retryableJobs = await getRetryableJobs(deps, 10);
      const testJob = retryableJobs.find((j) => j.id === job.id);

      expect(testJob).toBe(undefined);
    });
  });

  void describe("getJobStats", async () => {
    beforeEach(async () => {
      await nukeDatabase(drizzle);

      const job1 = await createJob(deps, {
        jobName: "send_email" as const,
        type: "immediate" as const,
        priority: "high" as const,
        maxRetries: 3,
      });

      const job2 = await createJob(deps, {
        jobName: "send_email" as const,
        type: "cron" as const,
        priority: "normal" as const,
        maxRetries: 3,
      });

      await completeJob(deps, job1.id);
      await failJob(deps, job2.id, "Test error", false);
    });

    void it("aggregates job statistics correctly", async () => {
      const stats = await getJobStats(deps);

      expect(stats.total >= 2).toBeTruthy();
      expect(stats.byStatus.completed >= 1).toBeTruthy();
      expect(stats.byStatus.failed >= 1).toBeTruthy();
      expect(stats.byType.immediate >= 1).toBeTruthy();
      expect(stats.byType.cron >= 1).toBeTruthy();
      expect(stats.byPriority.high >= 1).toBeTruthy();
      expect(stats.byPriority.normal >= 1).toBeTruthy();
    });

    void it("returns empty stats for empty database", async () => {
      await nukeDatabase(drizzle);

      const stats = await getJobStats(deps);

      expect(stats.total).toBe(0);
      // Empty database still returns structure with zero counts
      expect(stats.byStatus).toEqual({
        pending: 0,
        running: 0,
        completed: 0,
        failed: 0,
        cancelled: 0,
        retrying: 0,
      });
      expect(stats.byType).toEqual({ cron: 0, immediate: 0, scheduled: 0, recurring: 0 });
      expect(stats.byPriority).toEqual({ low: 0, normal: 0, high: 0, critical: 0 });
    });
  });
});
