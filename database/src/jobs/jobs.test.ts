import { describe, it, before, after, beforeEach } from "node:test";
import assert from "node:assert";
import { pino } from "pino";
import { testConnect } from "../drizzle/testConnect.js";
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

async function wipeJobsDb(drizzle: DrizzleClient) {
  // Delete jobs (cascade deletes jobLogs), then jobSchedules
  await drizzle.delete(schema.jobs);
  await drizzle.delete(schema.jobSchedules);
}

void describe("Jobs", async () => {
  let drizzle: DrizzleClient;
  let close: () => Promise<void>;
  const logger = pino({ level: "silent" });
  let deps: DbDeps;

  before(async () => {
    ({ drizzle, close } = testConnect("jobs-test"));
    deps = { drizzle, logger };
  });

  after(async () => {
    await close();
  });

  void describe("createJob", async () => {
    beforeEach(async () => {
      await wipeJobsDb(drizzle);
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

      assert.ok(job.id);
      assert.strictEqual(job.jobName, "send_email");
      assert.strictEqual(job.status, "pending");
      assert.strictEqual(job.type, "immediate");
      assert.strictEqual(job.priority, "normal");
      assert.deepStrictEqual(job.payload, { customData: "test" });
      assert.strictEqual(job.maxRetries, 3);
    });
  });

  void describe("getJobById", async () => {
    let testJob: typeof schema.jobs.$inferSelect;

    beforeEach(async () => {
      await wipeJobsDb(drizzle);

      testJob = await createJob(deps, {
        jobName: "send_email" as const,
        type: "immediate" as const,
        priority: "high" as const,
        maxRetries: 3,
      });
    });

    void it("retrieves job by ID", async () => {
      const retrievedJob = await getJobById(deps, testJob.id);

      assert.ok(retrievedJob);
      assert.strictEqual(retrievedJob.id, testJob.id);
      assert.strictEqual(retrievedJob.jobName, "send_email");
    });

    void it("returns undefined for non-existent job", async () => {
      const job = await getJobById(deps, "nonexistent-id");
      assert.strictEqual(job, undefined);
    });
  });

  void describe("job status updates", async () => {
    let testJob: typeof schema.jobs.$inferSelect;

    beforeEach(async () => {
      await wipeJobsDb(drizzle);

      testJob = await createJob(deps, {
        jobName: "send_email" as const,
        type: "immediate" as const,
        priority: "normal" as const,
        maxRetries: 3,
      });
    });

    void it("starts job correctly", async () => {
      const startedJob = await startJob(deps, testJob.id);

      assert.strictEqual(startedJob.status, "running");
      assert.strictEqual(startedJob.attempts, 1);
      assert.ok(startedJob.startedAt);
    });

    void it("completes job with result", async () => {
      await startJob(deps, testJob.id);
      const result = { output: "success", processed: 100 };

      const completedJob = await completeJob(deps, testJob.id, result);

      assert.strictEqual(completedJob.status, "completed");
      assert.deepStrictEqual(completedJob.result, result);
      assert.ok(completedJob.completedAt);
    });

    void it("fails job without retry", async () => {
      await startJob(deps, testJob.id);

      const failedJob = await failJob(deps, testJob.id, "Processing failed", false);

      assert.strictEqual(failedJob.status, "failed");
      assert.strictEqual(failedJob.error, "Processing failed");
      assert.ok(failedJob.completedAt);
    });

    void it("fails job with retry", async () => {
      await startJob(deps, testJob.id);

      const retryJob = await failJob(deps, testJob.id, "Temporary failure", true);

      assert.strictEqual(retryJob.status, "retrying");
      assert.strictEqual(retryJob.error, "Temporary failure");
      assert.strictEqual(retryJob.completedAt, null);
    });

    void it("cancels job", async () => {
      const cancelledJob = await cancelJob(deps, testJob.id);

      assert.strictEqual(cancelledJob.status, "cancelled");
      assert.ok(cancelledJob.completedAt);
    });

    void it("throws error when updating non-existent job", async () => {
      await assert.rejects(
        async () => await updateJobStatus(deps, "nonexistent-id", "running"),
        /Job with ID 'nonexistent-id' not found/,
      );
    });
  });

  void describe("getPendingJobs", async () => {
    beforeEach(async () => {
      await wipeJobsDb(drizzle);

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

      assert.ok(pendingJobs.length >= 2);
      const priorities = pendingJobs.map((job) => job.priority);
      assert.strictEqual(priorities[0], "high");
    });

    void it("respects limit parameter", async () => {
      const pendingJobs = await getPendingJobs(deps, 1);
      assert.strictEqual(pendingJobs.length, 1);
    });

    void it("only returns jobs scheduled for now or past", async () => {
      const pendingJobs = await getPendingJobs(deps, 10);
      const now = new Date();

      for (const job of pendingJobs) {
        if (job.scheduledFor) {
          assert.ok(job.scheduledFor.getTime() <= now.getTime());
        }
      }
    });
  });

  void describe("getRetryableJobs", async () => {
    beforeEach(async () => {
      await wipeJobsDb(drizzle);
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

      assert.ok(testJob);
      assert.strictEqual(testJob.status, "failed");
      assert.ok(testJob.attempts < testJob.maxRetries);
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

      assert.strictEqual(testJob, undefined);
    });
  });

  void describe("getJobStats", async () => {
    beforeEach(async () => {
      await wipeJobsDb(drizzle);

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

      assert.ok(stats.total >= 2);
      assert.ok(stats.byStatus.completed >= 1);
      assert.ok(stats.byStatus.failed >= 1);
      assert.ok(stats.byType.immediate >= 1);
      assert.ok(stats.byType.cron >= 1);
      assert.ok(stats.byPriority.high >= 1);
      assert.ok(stats.byPriority.normal >= 1);
    });

    void it("returns empty stats for empty database", async () => {
      await wipeJobsDb(drizzle);

      const stats = await getJobStats(deps);

      assert.strictEqual(stats.total, 0);
      assert.deepStrictEqual(stats.byStatus, {});
      assert.deepStrictEqual(stats.byType, {});
      assert.deepStrictEqual(stats.byPriority, {});
    });
  });
});
