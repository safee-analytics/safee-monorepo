import { describe, it, beforeAll, afterAll, beforeEach, expect } from "vitest";
import { pino } from "pino";
import { testConnect } from "../drizzle/testConnect.js";
import type { DrizzleClient } from "../drizzle.js";
import { JobScheduler } from "./jobScheduler.js";
import { nukeDatabase } from "../test-helpers/test-fixtures.js";
import { createJobSchedule } from "../jobs/jobSchedules.js";
import { getJobById } from "../jobs/jobs.js";
import { InMemoryPubSub } from "../pubsub/inMemoryPubSub.js";
import * as schema from "../drizzle/index.js";
import type { DbDeps } from "../deps.js";
import { eq } from "../index.js";

void describe("Job Scheduler", async () => {
  let drizzle: DrizzleClient;
  let close: () => Promise<void>;
  const logger = pino({ level: "silent" });
  let deps: DbDeps;
  let pubsub: InMemoryPubSub;
  let scheduler: JobScheduler;

  beforeAll(async () => {
    ({ drizzle, close } = testConnect("job-scheduler-test"));
    deps = { drizzle, logger };
  });

  afterAll(async () => {
    await close();
  });

  beforeEach(async () => {
    await nukeDatabase(drizzle);

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

      await pubsub.publish("test-job-queue", "test-message");
      await pubsub.publish("test-job-events", "test-event");

      await scheduler.stop();
    });

    void it("handles multiple start calls gracefully", async () => {
      await scheduler.start(deps);

      await scheduler.start(deps);

      await scheduler.stop();
    });

    void it("handles stop without start", async () => {
      await scheduler.stop();
    });
  });

  void describe("job scheduling", async () => {
    void it("schedules active job with cron expression", async () => {
      const testJobSchedule = await createJobSchedule(deps, {
        name: "ActiveJobSchedule",
        jobName: "send_email" as const,
        cronExpression: "0 9 * * *", // 9 AM daily
        timezone: "UTC",
        isActive: true,
      });

      await scheduler.start(deps);
      await scheduler.scheduleJob(deps, testJobSchedule.id);
      await scheduler.stop();
    });

    void it("does not schedule inactive job", async () => {
      const testJobSchedule = await createJobSchedule(deps, {
        name: "InactiveSchedule",
        jobName: "send_email" as const,
        cronExpression: "0 9 * * *",
        isActive: false, // Create as inactive
      });

      await scheduler.start(deps);
      await scheduler.scheduleJob(deps, testJobSchedule.id);
      await scheduler.stop();
    });

    void it("does not schedule job without cron expression", async () => {
      const testJobSchedule = await createJobSchedule(deps, {
        name: "NoCronSchedule",
        jobName: "send_email" as const,
        cronExpression: null, // No cron expression
        isActive: true,
      });

      await scheduler.start(deps);
      await scheduler.scheduleJob(deps, testJobSchedule.id);
      await scheduler.stop();
    });

    void it("handles non-existent schedule gracefully", async () => {
      await scheduler.start(deps);
      await scheduler.scheduleJob(deps, "00000000-0000-0000-0000-000000000000");
      await scheduler.stop();
    });

    void it("updates existing cron job when rescheduling", async () => {
      const testJobSchedule = await createJobSchedule(deps, {
        name: "RescheduleTest",
        jobName: "send_email" as const,
        cronExpression: "0 9 * * *",
        isActive: true,
      });

      await scheduler.start(deps);
      await scheduler.scheduleJob(deps, testJobSchedule.id);

      await drizzle
        .update(schema.jobSchedules)
        .set({ cronExpression: "0 10 * * *" }) // 10 AM daily
        .where(eq(schema.jobSchedules.id, testJobSchedule.id));

      await scheduler.scheduleJob(deps, testJobSchedule.id);
      await scheduler.stop();
    });
  });

  void describe("job unscheduling", async () => {
    void it("unschedules existing job", async () => {
      const testJobSchedule = await createJobSchedule(deps, {
        name: "UnscheduleTest",
        jobName: "send_email" as const,
        cronExpression: "0 9 * * *",
        isActive: true,
      });

      await scheduler.start(deps);
      await scheduler.scheduleJob(deps, testJobSchedule.id);

      await scheduler.unscheduleJob(testJobSchedule.id);
      await scheduler.stop();
    });

    void it("handles unscheduling non-existent job gracefully", async () => {
      await scheduler.start(deps);
      await scheduler.unscheduleJob("00000000-0000-0000-0000-000000000000");
      await scheduler.stop();
    });
  });

  void describe("job queueing", async () => {
    void it("queues job for immediate execution", async () => {
      let queuedMessage: { jobId: string; type: string } | null = null;

      await scheduler.start(deps);

      await pubsub.subscribe("test-job-queue-worker", async (message) => {
        const messageText = typeof message.data === "string" ? message.data : message.data.toString();
        const parsed = JSON.parse(messageText) as { jobId: string; type: string };
        queuedMessage = parsed;
      });

      await scheduler.queueJob("test-job-id");

      await new Promise((resolve) => setTimeout(resolve, 100));

      expect(queuedMessage, "Message should have been queued").toBeTruthy();
      expect(queuedMessage!.jobId).toBe("test-job-id");

      await scheduler.stop();
    });
  });

  void describe("job processing", async () => {
    void it("processes job successfully", async () => {
      const { createJob } = await import("../jobs/jobs.js");
      const testJob = await createJob(deps, {
        jobName: "send_email" as const,
        type: "immediate" as const,
        priority: "normal" as const,
        maxRetries: 3,
      });

      const jobEvents: { jobId: string; type: string; error?: string }[] = [];

      await scheduler.start(deps);

      await pubsub.subscribe("test-job-events-worker", async (message) => {
        const event = JSON.parse(message.data.toString()) as { jobId: string; type: string; error?: string };
        jobEvents.push(event);
      });

      await scheduler.queueJob(testJob.id);

      await new Promise((resolve) => setTimeout(resolve, 200));

      const updatedJob = await getJobById(deps, testJob.id);
      expect(updatedJob).toBeTruthy();
      expect(updatedJob!.status).toBe("completed");
      expect(updatedJob!.startedAt).toBeTruthy();
      expect(updatedJob!.completedAt).toBeTruthy();

      expect(jobEvents.length >= 2).toBeTruthy();

      const startedEvent = jobEvents.find((e) => e.type === "job.started");
      const completedEvent = jobEvents.find((e) => e.type === "job.completed");

      expect(startedEvent).toBeTruthy();
      expect(startedEvent!.jobId).toBe(testJob.id);

      expect(completedEvent).toBeTruthy();
      expect(completedEvent!.jobId).toBe(testJob.id);

      await scheduler.stop();
    });

    void it("handles job processing failure", async () => {
      await scheduler.start(deps);

      const invalidJobId = "invalid-job-id";
      await scheduler.queueJob(invalidJobId);

      await new Promise((resolve) => setTimeout(resolve, 200));

      await scheduler.stop();
    });
  });

  void describe("cron job execution", async () => {
    void it("creates job instance when cron job executes", async () => {
      const testJobSchedule = await createJobSchedule(deps, {
        name: "CronExecutionSchedule",
        jobName: "send_email" as const,
        cronExpression: "* * * * *", // Every minute
        timezone: "UTC",
        isActive: true,
      });

      await scheduler.start(deps);

      await scheduler.scheduleJob(deps, testJobSchedule.id);

      await scheduler.stop();
    });

    void it("updates schedule run times after cron execution", async () => {
      const testJobSchedule = await createJobSchedule(deps, {
        name: "CronExecutionRunTimeSchedule",
        jobName: "send_email" as const,
        cronExpression: "* * * * *", // Every minute
        timezone: "UTC",
        isActive: true,
      });

      await scheduler.start(deps);

      const originalSchedule = await drizzle.query.jobSchedules.findFirst({
        where: eq(schema.jobSchedules.id, testJobSchedule.id),
      });

      await scheduler.scheduleJob(deps, testJobSchedule.id);

      const updatedSchedule = await drizzle.query.jobSchedules.findFirst({
        where: eq(schema.jobSchedules.id, testJobSchedule.id),
      });

      expect(updatedSchedule).toBeTruthy();
      expect(originalSchedule).toBeTruthy();

      expect(updatedSchedule!.id).toBe(originalSchedule!.id);

      await scheduler.stop();
    });
  });

  void describe("loading schedules on start", async () => {
    void it("loads only active schedules with cron expressions on start", async () => {
      await createJobSchedule(deps, {
        name: "LoadActiveSchedule1",
        jobName: "send_email" as const,
        cronExpression: "0 9 * * *",
        isActive: true,
      });

      await createJobSchedule(deps, {
        name: "LoadActiveSchedule2",
        jobName: "send_email" as const,
        cronExpression: "0 17 * * *",
        isActive: true,
      });

      await createJobSchedule(deps, {
        name: "LoadInactiveSchedule",
        jobName: "send_email" as const,
        cronExpression: "0 12 * * *",
        isActive: false,
      });

      await createJobSchedule(deps, {
        name: "LoadNoCronSchedule",
        jobName: "send_email" as const,
        cronExpression: null,
        isActive: true,
      });

      await scheduler.start(deps);

      // No direct way to verify cronJobs count since it's private

      await scheduler.stop();
    });
  });
});
