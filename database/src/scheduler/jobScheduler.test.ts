import { describe, it, before, after, beforeEach, afterEach } from "node:test";
import assert from "node:assert";
import { pino } from "pino";
import { testConnect } from "../drizzle/testConnect.js";
import type { DrizzleClient } from "../drizzle.js";
import { JobScheduler } from "./jobScheduler.js";
import { createJobDefinition } from "../jobs/jobDefinitions.js";
import { createJobSchedule } from "../jobs/jobSchedules.js";
import { getJobById } from "../jobs/jobs.js";
import { InMemoryPubSub } from "../pubsub/inMemoryPubSub.js";
import * as schema from "../drizzle/index.js";
import type { DbDeps } from "../deps.js";
import { eq } from "../index.js";

async function wipeSchedulerDb(drizzle: DrizzleClient) {
  await drizzle.delete(schema.auditEvents);
  await drizzle.delete(schema.jobLogs);
  await drizzle.delete(schema.jobs);
  await drizzle.delete(schema.jobSchedules);
  await drizzle.delete(schema.jobDefinitions);
}

void describe("Job Scheduler", async () => {
  let drizzle: DrizzleClient;
  let close: () => Promise<void>;
  const logger = pino({ level: "silent" });
  let deps: DbDeps;
  let pubsub: InMemoryPubSub;
  let scheduler: JobScheduler;

  before(async () => {
    ({ drizzle, close } = testConnect("job-scheduler-test"));
    deps = { drizzle, logger };
  });

  after(async () => {
    await close();
  });

  beforeEach(async () => {
    await wipeSchedulerDb(drizzle);

    pubsub = new InMemoryPubSub();
    scheduler = new JobScheduler({
      pubsub,
      topics: {
        jobQueue: "test-job-queue",
        jobEvents: "test-job-events",
      },
    });
  });

  void describe("scheduler lifecycle", async () => {
    void it("starts and stops scheduler successfully", async () => {
      await scheduler.start(deps);

      // Verify topics were created
      assert.ok(pubsub["topics"].has("test-job-queue"));
      assert.ok(pubsub["topics"].has("test-job-events"));

      await scheduler.stop();

      // Verify scheduler stopped (pubsub is closed internally)
    });

    void it("handles multiple start calls gracefully", async () => {
      await scheduler.start(deps);

      // Starting again should not throw
      await scheduler.start(deps);

      await scheduler.stop();
    });

    void it("handles stop without start", async () => {
      // Should not throw
      await scheduler.stop();
    });
  });

  void describe("job scheduling", async () => {
    let testJobDefinition: typeof schema.jobDefinitions.$inferSelect;
    let testJobSchedule: typeof schema.jobSchedules.$inferSelect;

    beforeEach(async () => {
      testJobDefinition = await createJobDefinition(deps, {
        name: `test-job-def-${Date.now()}`,
        handlerName: "TestSchedulerHandler",
      });

      testJobSchedule = await createJobSchedule(deps, {
        name: "TestSchedule",
        jobDefinitionId: testJobDefinition.id,
        cronExpression: "0 9 * * *", // 9 AM daily
        timezone: "UTC",
        isActive: true,
      });

      await scheduler.start(deps);
    });

    afterEach(async () => {
      await scheduler.stop();
    });

    void it("schedules active job with cron expression", async () => {
      await scheduler.scheduleJob(deps, testJobSchedule.id);

      // Verify cron job was created
      const cronJobs = scheduler["cronJobs"];
      assert.ok(cronJobs.has(testJobSchedule.id));
    });

    void it("does not schedule inactive job", async () => {
      // Deactivate the schedule first
      await drizzle
        .update(schema.jobSchedules)
        .set({ isActive: false })
        .where(eq(schema.jobSchedules.id, testJobSchedule.id));

      await scheduler.scheduleJob(deps, testJobSchedule.id);

      const cronJobs = scheduler["cronJobs"];
      assert.ok(!cronJobs.has(testJobSchedule.id));
    });

    void it("does not schedule job without cron expression", async () => {
      // Remove cron expression
      await drizzle
        .update(schema.jobSchedules)
        .set({ cronExpression: null })
        .where(eq(schema.jobSchedules.id, testJobSchedule.id));

      await scheduler.scheduleJob(deps, testJobSchedule.id);

      const cronJobs = scheduler["cronJobs"];
      assert.ok(!cronJobs.has(testJobSchedule.id));
    });

    void it("handles non-existent schedule gracefully", async () => {
      // Should not throw
      await scheduler.scheduleJob(deps, "nonexistent-id");

      const cronJobs = scheduler["cronJobs"];
      assert.strictEqual(cronJobs.size, 0);
    });

    void it("updates existing cron job when rescheduling", async () => {
      await scheduler.scheduleJob(deps, testJobSchedule.id);

      const cronJobs = scheduler["cronJobs"];
      const originalJob = cronJobs.get(testJobSchedule.id);
      assert.ok(originalJob);

      // Update cron expression
      await drizzle
        .update(schema.jobSchedules)
        .set({ cronExpression: "0 10 * * *" }) // 10 AM daily
        .where(eq(schema.jobSchedules.id, testJobSchedule.id));

      await scheduler.scheduleJob(deps, testJobSchedule.id);

      const newJob = cronJobs.get(testJobSchedule.id);
      assert.ok(newJob);
      assert.notStrictEqual(originalJob, newJob); // Should be a different job object
    });
  });

  void describe("job unscheduling", async () => {
    let testJobDefinition: typeof schema.jobDefinitions.$inferSelect;
    let testJobSchedule: typeof schema.jobSchedules.$inferSelect;

    beforeEach(async () => {
      testJobDefinition = await createJobDefinition(deps, {
        name: `test-job-def-${Date.now()}`,
        handlerName: "TestSchedulerHandler",
      });

      testJobSchedule = await createJobSchedule(deps, {
        name: "TestSchedule",
        jobDefinitionId: testJobDefinition.id,
        cronExpression: "0 9 * * *",
        isActive: true,
      });

      await scheduler.start(deps);
      await scheduler.scheduleJob(deps, testJobSchedule.id);
    });

    afterEach(async () => {
      await scheduler.stop();
    });

    void it("unschedules existing job", async () => {
      const cronJobs = scheduler["cronJobs"];
      assert.ok(cronJobs.has(testJobSchedule.id));

      await scheduler.unscheduleJob(testJobSchedule.id);

      assert.ok(!cronJobs.has(testJobSchedule.id));
    });

    void it("handles unscheduling non-existent job gracefully", async () => {
      // Should not throw
      await scheduler.unscheduleJob("nonexistent-id");
    });
  });

  void describe("job queueing", async () => {
    beforeEach(async () => {
      await scheduler.start(deps);
    });

    afterEach(async () => {
      await scheduler.stop();
    });

    void it("queues job for immediate execution", async () => {
      let queuedMessage: any = null;

      // Subscribe to job queue to capture messages
      await pubsub.subscribe("test-job-queue-worker", async (message) => {
        queuedMessage = JSON.parse(message.data.toString());
      });

      await scheduler.queueJob("test-job-id");

      // Wait for async message processing
      await new Promise((resolve) => setTimeout(resolve, 100));

      assert.ok(queuedMessage);
      assert.strictEqual(queuedMessage.jobId, "test-job-id");
    });
  });

  void describe("job processing", async () => {
    let testJobDefinition: typeof schema.jobDefinitions.$inferSelect;
    let testJob: typeof schema.jobs.$inferSelect;
    let jobEvents: any[] = [];

    beforeEach(async () => {
      testJobDefinition = await createJobDefinition(deps, {
        name: `test-job-def-${Date.now()}`,
        handlerName: "TestProcessorHandler",
      });

      // Import createJob here to avoid circular dependency issues
      const { createJob } = await import("../jobs/jobs.js");
      testJob = await createJob(deps, {
        jobDefinitionId: testJobDefinition.id,
        type: "immediate" as const,
        priority: "normal" as const,
      });

      await scheduler.start(deps);

      // Subscribe to job events
      jobEvents = [];
      await pubsub.subscribe("test-job-events-worker", async (message) => {
        const event = JSON.parse(message.data.toString());
        jobEvents.push(event);
      });
    });

    afterEach(async () => {
      await scheduler.stop();
    });

    void it("processes job successfully", async () => {
      await scheduler.queueJob(testJob.id);

      // Wait for job processing
      await new Promise((resolve) => setTimeout(resolve, 200));

      // Verify job status was updated
      const updatedJob = await getJobById(deps, testJob.id);
      assert.ok(updatedJob);
      assert.strictEqual(updatedJob.status, "completed");
      assert.ok(updatedJob.startedAt);
      assert.ok(updatedJob.completedAt);

      // Verify events were published
      assert.ok(jobEvents.length >= 2);

      const startedEvent = jobEvents.find((e) => e.type === "job.started");
      const completedEvent = jobEvents.find((e) => e.type === "job.completed");

      assert.ok(startedEvent);
      assert.strictEqual(startedEvent.jobId, testJob.id);

      assert.ok(completedEvent);
      assert.strictEqual(completedEvent.jobId, testJob.id);
    });

    void it("handles job processing failure", async () => {
      // Create a job that will fail (simulate by providing invalid job ID)
      const invalidJobId = "invalid-job-id";

      await scheduler.queueJob(invalidJobId);

      // Wait for job processing
      await new Promise((resolve) => setTimeout(resolve, 200));

      // Should have published failure event
      const failedEvent = jobEvents.find((e) => e.type === "job.failed");
      assert.ok(failedEvent);
      assert.strictEqual(failedEvent.jobId, invalidJobId);
      assert.ok(failedEvent.error);
    });
  });

  void describe("cron job execution", async () => {
    let testJobDefinition: typeof schema.jobDefinitions.$inferSelect;
    let testJobSchedule: typeof schema.jobSchedules.$inferSelect;

    beforeEach(async () => {
      testJobDefinition = await createJobDefinition(deps, {
        name: `test-job-def-${Date.now()}`,
        handlerName: "TestCronHandler",
      });

      // Create schedule that should run immediately (every minute)
      testJobSchedule = await createJobSchedule(deps, {
        name: "TestCronSchedule",
        jobDefinitionId: testJobDefinition.id,
        cronExpression: "* * * * *", // Every minute
        timezone: "UTC",
        isActive: true,
      });

      await scheduler.start(deps);
    });

    afterEach(async () => {
      await scheduler.stop();
    });

    void it("creates job instance when cron job executes", async () => {
      // Manually execute cron job to avoid waiting for actual cron timing
      await scheduler["executeCronJob"](deps, {
        id: testJobSchedule.id,
        jobDefinitionId: testJobDefinition.id,
        cronExpression: "* * * * *",
        timezone: "UTC",
      });

      // Wait for async processing
      await new Promise((resolve) => setTimeout(resolve, 100));

      // Verify job was created
      const jobs = await drizzle.query.jobs.findMany({
        where: eq(schema.jobs.jobDefinitionId, testJobDefinition.id),
      });

      assert.ok(jobs.length > 0);
      const cronJob = jobs.find((job) => job.scheduleId === testJobSchedule.id);
      assert.ok(cronJob);
      assert.strictEqual(cronJob.type, "cron");
    });

    void it("updates schedule run times after cron execution", async () => {
      const originalSchedule = await drizzle.query.jobSchedules.findFirst({
        where: eq(schema.jobSchedules.id, testJobSchedule.id),
      });

      await scheduler["executeCronJob"](deps, {
        id: testJobSchedule.id,
        jobDefinitionId: testJobDefinition.id,
        cronExpression: "* * * * *",
        timezone: "UTC",
      });

      const updatedSchedule = await drizzle.query.jobSchedules.findFirst({
        where: eq(schema.jobSchedules.id, testJobSchedule.id),
      });

      assert.ok(updatedSchedule);
      assert.ok(updatedSchedule.lastRunAt);
      assert.ok(updatedSchedule.nextRunAt);

      // lastRunAt should be updated
      if (originalSchedule?.lastRunAt) {
        assert.ok(updatedSchedule.lastRunAt > originalSchedule.lastRunAt);
      }
    });
  });

  void describe("loading schedules on start", async () => {
    beforeEach(async () => {
      const jobDef1 = await createJobDefinition(deps, {
        name: `job-def-1-${Date.now()}`,
        handlerName: "Handler1",
      });

      const jobDef2 = await createJobDefinition(deps, {
        name: `job-def-2-${Date.now()}`,
        handlerName: "Handler2",
      });

      // Create active schedules
      await createJobSchedule(deps, {
        name: "ActiveSchedule1",
        jobDefinitionId: jobDef1.id,
        cronExpression: "0 9 * * *",
        isActive: true,
      });

      await createJobSchedule(deps, {
        name: "ActiveSchedule2",
        jobDefinitionId: jobDef2.id,
        cronExpression: "0 17 * * *",
        isActive: true,
      });

      // Create inactive schedule
      await createJobSchedule(deps, {
        name: "InactiveSchedule",
        jobDefinitionId: jobDef1.id,
        cronExpression: "0 12 * * *",
        isActive: false,
      });

      // Create schedule without cron expression
      await createJobSchedule(deps, {
        name: "NoCronSchedule",
        jobDefinitionId: jobDef2.id,
        cronExpression: null,
        isActive: true,
      });
    });

    void it("loads only active schedules with cron expressions on start", async () => {
      await scheduler.start(deps);

      const cronJobs = scheduler["cronJobs"];
      assert.strictEqual(cronJobs.size, 2);

      await scheduler.stop();
    });
  });
});

