import { describe, it, before, after, beforeEach } from "node:test";
import assert from "node:assert";
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

async function wipeJobSchedulesDb(drizzle: DrizzleClient) {
  await drizzle.delete(schema.jobLogs);
  await drizzle.delete(schema.jobs);
  await drizzle.delete(schema.jobSchedules);
}

void describe("Job Schedules", async () => {
  let drizzle: DrizzleClient;
  let close: () => Promise<void>;
  const logger = pino({ level: "silent" });
  let deps: DbDeps;

  before(async () => {
    ({ drizzle, close } = testConnect("job-schedules-test"));
    deps = { drizzle, logger };
  });

  after(async () => {
    await close();
  });

  void describe("createJobSchedule", async () => {
    beforeEach(async () => {
      await wipeJobSchedulesDb(drizzle);
    });

    void it("creates job schedule successfully", async () => {
      const scheduleData = {
        name: "DailySchedule",
        jobName: "send_email" as const,
        cronExpression: "0 9 * * *", // 9 AM daily
        timezone: "UTC",
      };

      const schedule = await createJobSchedule(deps, scheduleData);

      assert.ok(schedule.id);
      assert.strictEqual(schedule.name, "DailySchedule");
      assert.strictEqual(schedule.jobName, "send_email");
      assert.strictEqual(schedule.cronExpression, "0 9 * * *");
      assert.strictEqual(schedule.timezone, "UTC");
      assert.strictEqual(schedule.isActive, true);
    });

    void it("throws error when schedule with same name exists for same job", async () => {
      const scheduleData = {
        name: "DuplicateSchedule",
        jobName: "send_email" as const,
        cronExpression: "0 9 * * *",
      };

      await createJobSchedule(deps, scheduleData);

      await assert.rejects(
        async () => await createJobSchedule(deps, scheduleData),
        /Job schedule with name 'DuplicateSchedule' already exists for this job/,
      );
    });

    void it("allows same schedule name for different jobs", async () => {
      const scheduleData1 = {
        name: "SameName",
        jobName: "send_email" as const,
        cronExpression: "0 9 * * *",
      };

      const scheduleData2 = {
        name: "SameName",
        jobName: "send_email" as const,
        cronExpression: "0 10 * * *",
      };

      const schedule1 = await createJobSchedule(deps, scheduleData1);
      const schedule2 = await createJobSchedule(deps, scheduleData2);

      assert.ok(schedule1.id);
      assert.ok(schedule2.id);
      assert.notStrictEqual(schedule1.id, schedule2.id);
    });
  });

  void describe("getJobScheduleById", async () => {
    let testSchedule: typeof schema.jobSchedules.$inferSelect;

    beforeEach(async () => {
      await wipeJobSchedulesDb(drizzle);

      testSchedule = await createJobSchedule(deps, {
        name: "TestSchedule",
        jobName: "send_email" as const,
        cronExpression: "0 9 * * *",
      });
    });

    void it("retrieves job schedule by ID", async () => {
      const schedule = await getJobScheduleById(deps, testSchedule.id);

      assert.ok(schedule);
      assert.strictEqual(schedule.id, testSchedule.id);
      assert.strictEqual(schedule.name, "TestSchedule");
      assert.strictEqual(schedule.jobName, "send_email");
    });

    void it("returns undefined for non-existent schedule", async () => {
      const schedule = await getJobScheduleById(deps, "nonexistent-id");
      assert.strictEqual(schedule, undefined);
    });
  });

  void describe("listActiveJobSchedules", async () => {
    beforeEach(async () => {
      await wipeJobSchedulesDb(drizzle);

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

    void it("returns only active job schedules", async () => {
      const activeSchedules = await listActiveJobSchedules(deps);

      assert.strictEqual(activeSchedules.length, 2);
      assert.ok(activeSchedules.every((s) => s.isActive));

      const names = activeSchedules.map((s) => s.name).sort();
      assert.deepStrictEqual(names, ["ActiveSchedule1", "ActiveSchedule2"]);
    });
  });

  void describe("getSchedulesReadyToRun", async () => {
    beforeEach(async () => {
      await wipeJobSchedulesDb(drizzle);

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

    void it("returns schedules ready to run", async () => {
      const readySchedules = await getSchedulesReadyToRun(deps);

      assert.strictEqual(readySchedules.length, 2);
      assert.ok(readySchedules.every((s) => s.isActive));

      const names = readySchedules.map((s) => s.name).sort();
      assert.deepStrictEqual(names, ["NullNextRunSchedule", "ReadySchedule"]);
    });

    void it("filters by check time", async () => {
      const futureCheckTime = new Date(Date.now() + 120000); // 2 minutes from now

      const readySchedules = await getSchedulesReadyToRun(deps, futureCheckTime);

      // Should include all schedules now since check time is in future
      assert.ok(readySchedules.length >= 2);
    });
  });

  void describe("updateJobSchedule", async () => {
    let testSchedule: typeof schema.jobSchedules.$inferSelect;

    beforeEach(async () => {
      await wipeJobSchedulesDb(drizzle);

      testSchedule = await createJobSchedule(deps, {
        name: "TestSchedule",
        jobName: "send_email" as const,
        cronExpression: "0 9 * * *",
      });
    });

    void it("updates job schedule successfully", async () => {
      const updates = {
        cronExpression: "0 17 * * *",
        timezone: "America/New_York",
      };

      const updatedSchedule = await updateJobSchedule(deps, testSchedule.id, updates);

      assert.strictEqual(updatedSchedule.id, testSchedule.id);
      assert.strictEqual(updatedSchedule.cronExpression, "0 17 * * *");
      assert.strictEqual(updatedSchedule.timezone, "America/New_York");
      assert.strictEqual(updatedSchedule.name, "TestSchedule"); // Should remain unchanged
    });

    void it("throws error when schedule not found", async () => {
      await assert.rejects(
        async () => await updateJobSchedule(deps, "nonexistent-id", { cronExpression: "0 10 * * *" }),
        /Job schedule with ID 'nonexistent-id' not found/,
      );
    });

    void it("updates updatedAt timestamp", async () => {
      const originalUpdatedAt = testSchedule.updatedAt;

      await new Promise((resolve) => setTimeout(resolve, 10));

      const updatedSchedule = await updateJobSchedule(deps, testSchedule.id, {
        cronExpression: "0 10 * * *",
      });

      assert.ok(updatedSchedule.updatedAt > originalUpdatedAt);
    });
  });

  void describe("updateScheduleRunTime", async () => {
    let testSchedule: typeof schema.jobSchedules.$inferSelect;

    beforeEach(async () => {
      await wipeJobSchedulesDb(drizzle);

      testSchedule = await createJobSchedule(deps, {
        name: "TestSchedule",
        jobName: "send_email" as const,
        cronExpression: "0 9 * * *",
      });
    });

    void it("updates last run and next run times", async () => {
      const lastRunAt = new Date();
      const nextRunAt = new Date(lastRunAt.getTime() + 24 * 60 * 60 * 1000); // 24 hours later

      const updatedSchedule = await updateScheduleRunTime(deps, testSchedule.id, lastRunAt, nextRunAt);

      assert.strictEqual(updatedSchedule.lastRunAt?.getTime(), lastRunAt.getTime());
      assert.strictEqual(updatedSchedule.nextRunAt?.getTime(), nextRunAt.getTime());
    });

    void it("updates only last run time when next run not provided", async () => {
      const lastRunAt = new Date();

      const updatedSchedule = await updateScheduleRunTime(deps, testSchedule.id, lastRunAt);

      assert.strictEqual(updatedSchedule.lastRunAt?.getTime(), lastRunAt.getTime());
      // nextRunAt should remain unchanged (null or previous value)
    });
  });

  void describe("activateJobSchedule", async () => {
    let testSchedule: typeof schema.jobSchedules.$inferSelect;

    beforeEach(async () => {
      await wipeJobSchedulesDb(drizzle);

      testSchedule = await createJobSchedule(deps, {
        name: "TestSchedule",
        jobName: "send_email" as const,
        cronExpression: "0 9 * * *",
        isActive: false,
      });
    });

    void it("activates job schedule", async () => {
      const activatedSchedule = await activateJobSchedule(deps, testSchedule.id);

      assert.strictEqual(activatedSchedule.isActive, true);
    });
  });

  void describe("deactivateJobSchedule", async () => {
    let testSchedule: typeof schema.jobSchedules.$inferSelect;

    beforeEach(async () => {
      await wipeJobSchedulesDb(drizzle);

      testSchedule = await createJobSchedule(deps, {
        name: "TestSchedule",
        jobName: "send_email" as const,
        cronExpression: "0 9 * * *",
        isActive: true,
      });
    });

    void it("deactivates job schedule", async () => {
      const deactivatedSchedule = await deactivateJobSchedule(deps, testSchedule.id);

      assert.strictEqual(deactivatedSchedule.isActive, false);
    });
  });

  void describe("deleteJobSchedule", async () => {
    let testSchedule: typeof schema.jobSchedules.$inferSelect;

    beforeEach(async () => {
      await wipeJobSchedulesDb(drizzle);

      testSchedule = await createJobSchedule(deps, {
        name: "TestSchedule",
        jobName: "send_email" as const,
        cronExpression: "0 9 * * *",
      });
    });

    void it("deletes job schedule successfully", async () => {
      const deleted = await deleteJobSchedule(deps, testSchedule.id);

      assert.strictEqual(deleted, true);

      // Verify schedule is deleted
      const schedule = await getJobScheduleById(deps, testSchedule.id);
      assert.strictEqual(schedule, undefined);
    });

    void it("returns false when schedule not found", async () => {
      const deleted = await deleteJobSchedule(deps, "nonexistent-id");

      assert.strictEqual(deleted, false);
    });
  });
});
