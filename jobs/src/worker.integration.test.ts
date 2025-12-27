import { describe, it, beforeAll, afterAll, beforeEach, expect } from "vitest";
import { Queue, Worker } from "bullmq";
import { Redis } from "ioredis";
import { pino } from "pino";
import { connectTest, nukeDatabase } from "@safee/database/test-helpers";
import { createJob, getJobById, startJob, completeJob, failJob } from "@safee/database";
import type { DrizzleClient, DbDeps } from "@safee/database";
import { z } from "zod";
import { cleanAllQueues } from "./test-helpers/cleanQueues.js";

describe.sequential("Worker End-to-End Integration Tests", () => {
  let drizzle: DrizzleClient;
  let closeDb: () => Promise<void>;
  let redis: Redis;
  let deps: DbDeps;
  const logger = pino({ level: "silent" });

  beforeAll(async () => {
    ({ drizzle, close: closeDb } = await connectTest({ appName: "worker-e2e-test" }));
    deps = { drizzle, logger };

    redis = new Redis(process.env.REDIS_URL ?? "redis://localhost:6379", {
      maxRetriesPerRequest: null,
      enableReadyCheck: false,
    });
  });

  afterAll(async () => {
    await redis.quit();
    await closeDb();
  });

  beforeEach(async () => {
    await nukeDatabase(drizzle);
    await cleanAllQueues(redis);
    // Give extra time for any previous workers to fully close
    await new Promise((resolve) => setTimeout(resolve, 500));
  });

  describe("BullMQ Queue Processing", () => {
    it("processes job from email-jobs queue end-to-end", async () => {
      const testQueue = new Queue("email-jobs", { connection: redis });

      // Track processed jobs
      const processedJobs: any[] = [];

      // Create a test worker
      const worker = new Worker(
        "email-jobs",
        async (job) => {
          processedJobs.push(job.data);

          // Simulate the actual processor logic
          const JobDataSchema = z.object({ type: z.string() }).catchall(z.unknown());
          const jobData = JobDataSchema.parse(job.data);

          await startJob(deps, job.id!);

          // Simple validation that job data is correct
          expect(jobData.type).toBe("send_email");

          await completeJob(deps, job.id!, {
            completedAt: new Date().toISOString(),
            jobType: jobData.type,
          });
        },
        {
          connection: redis,
          concurrency: 1,
        },
      );

      // Create job in PostgreSQL
      const pgJob = await createJob(deps, {
        jobName: "send_email",
        type: "immediate",
        priority: "normal",
        payload: {
          type: "send_email",
          to: [{ email: "test@example.com" }],
          subject: "Test",
          html: "Test content",
        },
      });

      // Add to BullMQ queue
      await testQueue.add(
        "email-jobs",
        {
          type: "send_email",
          to: [{ email: "test@example.com" }],
          subject: "Test",
          html: "Test content",
        },
        {
          jobId: pgJob.id,
        },
      );

      // Wait for processing
      await new Promise((resolve) => setTimeout(resolve, 2000));

      // Verify job was processed
      expect(processedJobs.length).toBe(1);
      expect(processedJobs[0].type).toBe("send_email");

      // Verify PostgreSQL job status
      const updatedJob = await getJobById(deps, pgJob.id);
      expect(updatedJob).toBeTruthy();
      expect(updatedJob!.status).toBe("completed");

      // Cleanup
      await worker.close();
      await testQueue.close();
    }, 10000);

    it("handles job failure and updates PostgreSQL", async () => {
      const testQueue = new Queue("email-jobs", { connection: redis });

      // Create a worker that throws an error
      const worker = new Worker(
        "email-jobs",
        async (job) => {
          await startJob(deps, job.id!);

          // Simulate a failure
          const error = new Error("Simulated processing error");
          await failJob(deps, job.id!, error.message, false);

          throw error;
        },
        {
          connection: redis,
          concurrency: 1,
        },
      );

      // Create job
      const pgJob = await createJob(deps, {
        jobName: "send_email",
        type: "immediate",
        priority: "normal",
        payload: { type: "send_email", to: [] },
      });

      // Add to queue
      await testQueue.add("email-jobs", { type: "send_email", to: [] }, { jobId: pgJob.id, attempts: 1 });

      // Wait for processing
      await new Promise((resolve) => setTimeout(resolve, 3000));

      // Verify job failed
      const updatedJob = await getJobById(deps, pgJob.id);
      expect(updatedJob).toBeTruthy();
      expect(updatedJob!.status).toBe("failed");
      expect(updatedJob!.error).toContain("Simulated processing error");

      // Cleanup
      await worker.close();
      await testQueue.close();
    }, 10000);

    it("processes multiple jobs from different queues concurrently", async () => {
      const analyticsQueue = new Queue("analytics", { connection: redis });
      const emailQueue = new Queue("email-jobs", { connection: redis });

      const processedJobs: string[] = [];

      // Create workers for both queues
      const analyticsWorker = new Worker(
        "analytics",
        async (job) => {
          processedJobs.push("analytics");
          await startJob(deps, job.id!);
          await completeJob(deps, job.id!, { completedAt: new Date().toISOString(), jobType: "analytics" });
        },
        { connection: redis, concurrency: 2 },
      );

      const emailWorker = new Worker(
        "email-jobs",
        async (job) => {
          processedJobs.push("email");
          await startJob(deps, job.id!);
          await completeJob(deps, job.id!, { completedAt: new Date().toISOString(), jobType: "email" });
        },
        { connection: redis, concurrency: 2 },
      );

      // Create and enqueue jobs
      const analyticsJob = await createJob(deps, {
        jobName: "calculate_analytics",
        type: "immediate",
        priority: "normal",
        payload: { type: "calculate_dashboard_metrics" },
      });

      const emailJob = await createJob(deps, {
        jobName: "send_email",
        type: "immediate",
        priority: "normal",
        payload: { type: "send_email" },
      });

      await analyticsQueue.add("analytics", { type: "calculate_dashboard_metrics" }, { jobId: analyticsJob.id });

      await emailQueue.add("email-jobs", { type: "send_email" }, { jobId: emailJob.id });

      // Wait for processing
      await new Promise((resolve) => setTimeout(resolve, 3000));

      // Verify both jobs were processed
      expect(processedJobs).toContain("analytics");
      expect(processedJobs).toContain("email");

      // Verify both jobs completed
      const analyticsResult = await getJobById(deps, analyticsJob.id);
      const emailResult = await getJobById(deps, emailJob.id);

      expect(analyticsResult!.status).toBe("completed");
      expect(emailResult!.status).toBe("completed");

      // Cleanup
      await analyticsWorker.close();
      await emailWorker.close();
      await analyticsQueue.close();
      await emailQueue.close();
    }, 10000);
  });

  describe("Job Priority Handling", () => {
    it("processes high priority jobs before normal priority", async () => {
      const testQueue = new Queue("email-jobs", { connection: redis });
      const processOrder: string[] = [];

      // Create normal priority job first
      const normalJob = await createJob(deps, {
        jobName: "send_email",
        type: "immediate",
        priority: "normal",
        payload: { type: "send_email", priority: "normal" },
      });

      // Create high priority job second
      const highJob = await createJob(deps, {
        jobName: "send_email",
        type: "immediate",
        priority: "high",
        payload: { type: "send_email", priority: "high" },
      });

      // Add normal priority job first
      await testQueue.add("email-jobs", { type: "send_email", priority: "normal" }, { jobId: normalJob.id, priority: 5 });

      // Add high priority job second (should be processed first)
      await testQueue.add("email-jobs", { type: "send_email", priority: "high" }, { jobId: highJob.id, priority: 3 });

      // Now create worker - it will process high priority first
      const worker = new Worker(
        "email-jobs",
        async (job) => {
          processOrder.push(job.data.priority);
          await startJob(deps, job.id!);
          await completeJob(deps, job.id!, { completedAt: new Date().toISOString(), jobType: "email" });
          // Add small delay to ensure sequential processing
          await new Promise((resolve) => setTimeout(resolve, 100));
        },
        {
          connection: redis,
          concurrency: 1, // Process one at a time to see order
        },
      );

      // Wait for processing
      await new Promise((resolve) => setTimeout(resolve, 3000));

      // Verify high priority was processed first
      expect(processOrder[0]).toBe("high");
      expect(processOrder[1]).toBe("normal");

      // Cleanup
      await worker.close();
      await testQueue.close();
    }, 10000);
  });

  describe("Job Retry Logic", () => {
    it("retries failed jobs with exponential backoff", async () => {
      const testQueue = new Queue("email-jobs", { connection: redis });
      let attemptCount = 0;

      const worker = new Worker(
        "email-jobs",
        async (job) => {
          attemptCount++;
          await startJob(deps, job.id!);

          // Fail first 2 attempts, succeed on 3rd
          if (attemptCount < 3) {
            await failJob(deps, job.id!, `Attempt ${attemptCount} failed`, true);
            throw new Error(`Attempt ${attemptCount} failed`);
          }

          await completeJob(deps, job.id!, { completedAt: new Date().toISOString(), jobType: "email" });
        },
        {
          connection: redis,
          concurrency: 1,
        },
      );

      const pgJob = await createJob(deps, {
        jobName: "send_email",
        type: "immediate",
        priority: "normal",
        payload: { type: "send_email" },
        maxRetries: 3,
      });

      await testQueue.add(
        "email-jobs",
        { type: "send_email" },
        {
          jobId: pgJob.id,
          attempts: 3,
          backoff: { type: "exponential", delay: 500 },
        },
      );

      // Wait for all retry attempts (exponential backoff: 500ms, 1000ms, 2000ms)
      await new Promise((resolve) => setTimeout(resolve, 6000));

      // Verify job eventually succeeded
      expect(attemptCount).toBe(3);

      const finalJob = await getJobById(deps, pgJob.id);
      expect(finalJob!.status).toBe("completed");

      // Cleanup
      await worker.close();
      await testQueue.close();
    }, 10000);
  });

  describe("Queue Isolation", () => {
    it("ensures jobs in one queue don't affect another queue", async () => {
      const queue1 = new Queue("email-jobs", { connection: redis });
      const queue2 = new Queue("analytics", { connection: redis });

      const queue1Jobs: string[] = [];
      const queue2Jobs: string[] = [];

      const worker1 = new Worker(
        "email-jobs",
        async (job) => {
          queue1Jobs.push(job.data.type);
          await startJob(deps, job.id!);
          await completeJob(deps, job.id!, { completedAt: new Date().toISOString(), jobType: "email" });
        },
        { connection: redis },
      );

      const worker2 = new Worker(
        "analytics",
        async (job) => {
          queue2Jobs.push(job.data.type);
          await startJob(deps, job.id!);
          await completeJob(deps, job.id!, { completedAt: new Date().toISOString(), jobType: "analytics" });
        },
        { connection: redis },
      );

      // Add jobs to both queues
      const job1 = await createJob(deps, {
        jobName: "send_email",
        type: "immediate",
        priority: "normal",
        payload: { type: "send_email" },
      });

      const job2 = await createJob(deps, {
        jobName: "calculate_analytics",
        type: "immediate",
        priority: "normal",
        payload: { type: "calculate_analytics" },
      });

      await queue1.add("email-jobs", { type: "send_email" }, { jobId: job1.id });
      await queue2.add("analytics", { type: "calculate_analytics" }, { jobId: job2.id });

      // Wait for processing
      await new Promise((resolve) => setTimeout(resolve, 3000));

      // Verify each queue only processed its own jobs
      expect(queue1Jobs).toEqual(["send_email"]);
      expect(queue2Jobs).toEqual(["calculate_analytics"]);

      // Cleanup
      await worker1.close();
      await worker2.close();
      await queue1.close();
      await queue2.close();
    }, 10000);
  });
});
