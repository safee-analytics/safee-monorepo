import { describe, it, beforeAll, afterAll, beforeEach, expect } from "vitest";
import { pino } from "pino";
import { testConnect } from "../drizzle/testConnect.js";
import type { DrizzleClient } from "../drizzle.js";
import {
  createJobSchedule,
  getJobScheduleById,
  listActiveJobSchedules,
  getSchedulesReadyToRun,
  updateJobSchedule,
  updateScheduleRunTime,
  activateJobSchedule,
  deactivateJobSchedule,
  deleteJobSchedule,
} from "./jobSchedules.js";
import * as schema from "../drizzle/index.js";
import type { DbDeps } from "../deps.js";
import { nukeDatabase } from "../test-helpers/index.js";

describe("Job Schedules", async () => {
  let drizzle: DrizzleClient;
  let close: () => Promise<void>;
  const logger = pino({ level: "silent" });
  let deps: DbDeps;

  beforeAll(async () => {
    ({ drizzle, close } = testConnect("job-schedules-test"));
    deps = { drizzle, logger };
  });

  afterAll(async () => {
    await close();
  });

  describe("createJobSchedule", async () => {
    beforeEach(async () => {
      await nukeDatabase(drizzle);
    });

    it("creates job schedule successfully", async () => {
      const scheduleData = {
        name: "DailySchedule",
        jobName: "send_email" as const,
        cronExpression: "0 9 * * *",
        timezone: "UTC",
      };

      const schedule = await createJobSchedule(deps, scheduleData);

      expect(schedule.id).toBeTruthy();
      expect(schedule.name).toBe("DailySchedule");
      expect(schedule.jobName).toBe("send_email");
      expect(schedule.cronExpression).toBe("0 9 * * *");
      expect(schedule.timezone).toBe("UTC");
      expect(schedule.isActive).toBe(true);
    });

    it("throws error when schedule with same name exists for same job", async () => {
      const scheduleData = {
        name: "DuplicateSchedule",
        jobName: "send_email" as const,
        cronExpression: "0 9 * * *",
      };

      await createJobSchedule(deps, scheduleData);

      await expect(createJobSchedule(deps, scheduleData)).rejects.toThrow(
        /Job schedule with name 'DuplicateSchedule' already exists for this job/,
      );
    });

    it("allows different schedule names for same job", async () => {
      const scheduleData1 = {
        name: "Schedule1",
        jobName: "send_email" as const,
        cronExpression: "0 9 * * *",
      };

      const scheduleData2 = {
        name: "Schedule2",
        jobName: "send_email" as const,
        cronExpression: "0 10 * * *",
      };

      const schedule1 = await createJobSchedule(deps, scheduleData1);
      const schedule2 = await createJobSchedule(deps, scheduleData2);

      expect(schedule1.id).toBeTruthy();
      expect(schedule2.id).toBeTruthy();
      expect(schedule1.id).not.toBe(schedule2.id);
    });
  });

  describe("getJobScheduleById", async () => {
    let testSchedule: typeof schema.jobSchedules.$inferSelect;

    beforeEach(async () => {
      await nukeDatabase(drizzle);

      testSchedule = await createJobSchedule(deps, {
        name: "TestSchedule",
        jobName: "send_email" as const,
        cronExpression: "0 9 * * *",
      });
    });

    it("retrieves job schedule by ID", async () => {
      const schedule = await getJobScheduleById(deps, testSchedule.id);

      expect(schedule).toBeTruthy();
      expect(schedule!.id).toBe(testSchedule.id);
      expect(schedule!.name).toBe("TestSchedule");
      expect(schedule!.jobName).toBe("send_email");
    });

    it("returns undefined for non-existent schedule", async () => {
      const schedule = await getJobScheduleById(deps, "00000000-0000-0000-0000-000000000000");
      expect(schedule).toBe(undefined);
    });
  });

  describe("listActiveJobSchedules", async () => {
    beforeEach(async () => {
      await nukeDatabase(drizzle);

      await createJobSchedule(deps, {
        name: "ActiveSchedule1",
        jobName: "send_email" as const,
        cronExpression: "0 9 * * *",
        isActive: true,
      });

      await createJobSchedule(deps, {
        name: "ActiveSchedule2",
        jobName: "send_email" as const,
        cronExpression: "0 17 * * *",
        isActive: true,
      });

      const inactiveSchedule = await createJobSchedule(deps, {
        name: "InactiveSchedule",
        jobName: "send_email" as const,
        cronExpression: "0 12 * * *",
        isActive: true,
      });

      await deactivateJobSchedule(deps, inactiveSchedule.id);
    });

    it("returns only active job schedules", async () => {
      const activeSchedules = await listActiveJobSchedules(deps);

      expect(activeSchedules.length).toBe(2);
      expect(activeSchedules.every((s) => s.isActive));

      const names = activeSchedules.map((s) => s.name).sort();
      expect(names).toEqual(["ActiveSchedule1", "ActiveSchedule2"]);
    });
  });

  describe("getSchedulesReadyToRun", async () => {
    beforeEach(async () => {
      await nukeDatabase(drizzle);

      const now = new Date();
      const pastTime = new Date(now.getTime() - 60000); // 1 minute ago
      const futureTime = new Date(now.getTime() + 60000); // 1 minute from now

      // Schedule ready to run (past time)
      await createJobSchedule(deps, {
        name: "ReadySchedule",
        jobName: "send_email" as const,
        cronExpression: "* * * * *",
        nextRunAt: pastTime,
        isActive: true,
      });

      // Schedule not ready (future time)
      await createJobSchedule(deps, {
        name: "NotReadySchedule",
        jobName: "send_email" as const,
        cronExpression: "* * * * *",
        nextRunAt: futureTime,
        isActive: true,
      });

      // Schedule ready (null nextRunAt)
      await createJobSchedule(deps, {
        name: "NullNextRunSchedule",
        jobName: "send_email" as const,
        cronExpression: "* * * * *",
        nextRunAt: null,
        isActive: true,
      });

      // Inactive schedule (should not be returned)
      const inactiveSchedule = await createJobSchedule(deps, {
        name: "InactiveReadySchedule",
        jobName: "send_email" as const,
        cronExpression: "* * * * *",
        nextRunAt: pastTime,
        isActive: true,
      });
      await deactivateJobSchedule(deps, inactiveSchedule.id);
    });

    it("returns schedules ready to run", async () => {
      const readySchedules = await getSchedulesReadyToRun(deps);

      expect(readySchedules.length).toBe(2);
      expect(readySchedules.every((s) => s.isActive));

      const names = readySchedules.map((s) => s.name).sort();
      expect(names).toEqual(["NullNextRunSchedule", "ReadySchedule"]);
    });

    it("filters by check time", async () => {
      const futureCheckTime = new Date(Date.now() + 120000); // 2 minutes from now

      const readySchedules = await getSchedulesReadyToRun(deps, futureCheckTime);

      // Should include all schedules now since check time is in future
      expect(readySchedules.length >= 2).toBeTruthy();
    });
  });

  describe("updateJobSchedule", async () => {
    let testSchedule: typeof schema.jobSchedules.$inferSelect;

    beforeEach(async () => {
      await nukeDatabase(drizzle);

      testSchedule = await createJobSchedule(deps, {
        name: "TestSchedule",
        jobName: "send_email" as const,
        cronExpression: "0 9 * * *",
      });
    });

    it("updates job schedule successfully", async () => {
      const updates = {
        cronExpression: "0 17 * * *",
        timezone: "America/New_York",
      };

      const updatedSchedule = await updateJobSchedule(deps, testSchedule.id, updates);

      expect(updatedSchedule.id).toBe(testSchedule.id);
      expect(updatedSchedule.cronExpression).toBe("0 17 * * *");
      expect(updatedSchedule.timezone).toBe("America/New_York");
      expect(updatedSchedule.name).toBe("TestSchedule"); // Should remain unchanged
    });

    it("throws error when schedule not found", async () => {
      await expect(
        updateJobSchedule(deps, "00000000-0000-0000-0000-000000000000", { cronExpression: "0 10 * * *" }),
      ).rejects.toThrow(/Job schedule with ID '00000000-0000-0000-0000-000000000000' not found/);
    });

    it("updates updatedAt timestamp", async () => {
      const originalUpdatedAt = testSchedule.updatedAt;

      await new Promise((resolve) => setTimeout(resolve, 10));

      const updatedSchedule = await updateJobSchedule(deps, testSchedule.id, {
        cronExpression: "0 10 * * *",
      });

      expect(updatedSchedule.updatedAt > originalUpdatedAt).toBeTruthy();
    });
  });

  describe("updateScheduleRunTime", async () => {
    let testSchedule: typeof schema.jobSchedules.$inferSelect;

    beforeEach(async () => {
      await nukeDatabase(drizzle);

      testSchedule = await createJobSchedule(deps, {
        name: "TestSchedule",
        jobName: "send_email" as const,
        cronExpression: "0 9 * * *",
      });
    });

    it("updates last run and next run times", async () => {
      const lastRunAt = new Date();
      const nextRunAt = new Date(lastRunAt.getTime() + 24 * 60 * 60 * 1000); // 24 hours later

      const updatedSchedule = await updateScheduleRunTime(deps, testSchedule.id, lastRunAt, nextRunAt);

      expect(updatedSchedule.lastRunAt?.getTime()).toBe(lastRunAt.getTime());
      expect(updatedSchedule.nextRunAt?.getTime()).toBe(nextRunAt.getTime());
    });

    it("updates only last run time when next run not provided", async () => {
      const lastRunAt = new Date();

      const updatedSchedule = await updateScheduleRunTime(deps, testSchedule.id, lastRunAt);

      expect(updatedSchedule.lastRunAt?.getTime()).toBe(lastRunAt.getTime());
      // nextRunAt should remain unchanged (null or previous value)
    });
  });

  describe("activateJobSchedule", async () => {
    let testSchedule: typeof schema.jobSchedules.$inferSelect;

    beforeEach(async () => {
      await nukeDatabase(drizzle);

      testSchedule = await createJobSchedule(deps, {
        name: "TestSchedule",
        jobName: "send_email" as const,
        cronExpression: "0 9 * * *",
        isActive: false,
      });
    });

    it("activates job schedule", async () => {
      const activatedSchedule = await activateJobSchedule(deps, testSchedule.id);

      expect(activatedSchedule.isActive).toBe(true);
    });
  });

  describe("deactivateJobSchedule", async () => {
    let testSchedule: typeof schema.jobSchedules.$inferSelect;

    beforeEach(async () => {
      await nukeDatabase(drizzle);

      testSchedule = await createJobSchedule(deps, {
        name: "TestSchedule",
        jobName: "send_email" as const,
        cronExpression: "0 9 * * *",
        isActive: true,
      });
    });

    it("deactivates job schedule", async () => {
      const deactivatedSchedule = await deactivateJobSchedule(deps, testSchedule.id);

      expect(deactivatedSchedule.isActive).toBe(false);
    });
  });

  describe("deleteJobSchedule", async () => {
    let testSchedule: typeof schema.jobSchedules.$inferSelect;

    beforeEach(async () => {
      await nukeDatabase(drizzle);

      testSchedule = await createJobSchedule(deps, {
        name: "TestSchedule",
        jobName: "send_email" as const,
        cronExpression: "0 9 * * *",
      });
    });

    it("deletes job schedule successfully", async () => {
      const deleted = await deleteJobSchedule(deps, testSchedule.id);

      expect(deleted).toBe(true);

      // Verify schedule is deleted
      const schedule = await getJobScheduleById(deps, testSchedule.id);
      expect(schedule).toBe(undefined);
    });

    it("returns false when schedule not found", async () => {
      const deleted = await deleteJobSchedule(deps, "00000000-0000-0000-0000-000000000000");

      expect(deleted).toBe(false);
    });
  });
});
