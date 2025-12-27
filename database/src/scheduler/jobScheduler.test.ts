import { describe, it, beforeAll, afterAll, beforeEach, expect, vi } from "vitest";
import { pino } from "pino";
import { testConnect } from "../drizzle/testConnect.js";
import type { DrizzleClient } from "../drizzle.js";
import { JobScheduler } from "./jobScheduler.js";
import { nukeDatabase } from "../test-helpers/test-fixtures.js";
import { createJobSchedule } from "../jobs/jobSchedules.js";
import * as schema from "../drizzle/index.js";
import type { DbDeps } from "../deps.js";
import { eq } from "../index.js";
import { randomUUID } from "node:crypto";
import type { JobName } from "../drizzle/index.js";

describe("Job Scheduler", async () => {
  let drizzle: DrizzleClient;
  let close: () => Promise<void>;
  const logger = pino({ level: "silent" });
  let deps: DbDeps;
  let mockQueueManager: any;
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

    // Create mock QueueManager
    mockQueueManager = {
      addJobByName: vi.fn().mockResolvedValue({ bullmqJobId: "mock-job-id", pgJobId: "mock-pg-id" }),
    };

    scheduler = new JobScheduler({
      queueManager: mockQueueManager,
    });
  });

  describe("scheduler lifecycle", async () => {
    it("starts and stops scheduler successfully", async () => {
      await scheduler.start(deps);
      await scheduler.stop();
    });
  });

  describe("scheduling jobs", async () => {
    it("schedules a job successfully", async () => {
      await scheduler.start(deps);

      const schedule = await createJobSchedule(deps, {
        name: "Test Email Schedule",
        jobName: "send_email" as const,
        cronExpression: "*/5 * * * *",
        timezone: "UTC",
        isActive: true,
      });

      await scheduler.scheduleJob(deps, schedule.id);

      await scheduler.stop();
    });

    it("does not schedule inactive jobs", async () => {
      await scheduler.start(deps);

      const schedule = await createJobSchedule(deps, {
        name: "Inactive Email Schedule",
        jobName: "send_email" as const,
        cronExpression: "*/5 * * * *",
        timezone: "UTC",
        isActive: false,
      });

      await scheduler.scheduleJob(deps, schedule.id);

      await scheduler.stop();
    });

    it("loads schedules on start", async () => {
      const schedule = await createJobSchedule(deps, {
        name: "Test Email Schedule",
        jobName: "send_email" as const,
        cronExpression: "*/5 * * * *",
        timezone: "UTC",
        isActive: true,
      });

      await scheduler.start(deps);

      await scheduler.stop();
    });
  });

  describe("cron execution", async () => {
    it("executes cron job and creates job record", async () => {
      const schedule = await createJobSchedule(deps, {
        name: "Every Second Email Schedule",
        jobName: "send_email" as const,
        cronExpression: "* * * * * *",
        timezone: "UTC",
        isActive: true,
      });

      await scheduler.start(deps);

      await new Promise((resolve) => setTimeout(resolve, 1500));

      const jobRecords = await drizzle.query.jobs.findMany({
        where: eq(schema.jobs.scheduleId, schedule.id),
      });

      expect(jobRecords.length).toBeGreaterThan(0);
      expect(jobRecords[0]?.jobName).toBe("send_email");

      await scheduler.stop();
    });

    it("queues job to BullMQ when cron fires", async () => {
      const schedule = await createJobSchedule(deps, {
        name: "Every Second Email Schedule",
        jobName: "send_email" as const,
        cronExpression: "* * * * * *",
        timezone: "UTC",
        isActive: true,
      });

      await scheduler.start(deps);

      await new Promise((resolve) => setTimeout(resolve, 1500));

      // Verify that queueManager.addJobByName was called
      expect(mockQueueManager.addJobByName).toHaveBeenCalled();
      const calls = mockQueueManager.addJobByName.mock.calls;
      expect(calls.length).toBeGreaterThan(0);
      expect(calls[0][0]).toBe("send_email"); // jobName
      expect(calls[0][1]).toHaveProperty("jobId"); // data with jobId

      await scheduler.stop();
    });
  });

  describe("queue operations", async () => {
    it("queues a job successfully", async () => {
      await scheduler.start(deps);

      const jobId = randomUUID();
      await scheduler.queueJob(jobId, "send_email" as JobName);

      // Verify that queueManager was called correctly
      expect(mockQueueManager.addJobByName).toHaveBeenCalledWith("send_email", { jobId }, {});

      await scheduler.stop();
    });

    it("rejects non-UUID job IDs", async () => {
      await scheduler.start(deps);
      await expect(scheduler.queueJob("not-a-valid-id", "send_email" as JobName)).rejects.toThrow(
        /Invalid job ID/,
      );
      await scheduler.stop();
    });
  });
});
