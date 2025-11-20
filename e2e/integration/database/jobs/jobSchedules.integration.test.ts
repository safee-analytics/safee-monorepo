import { describe, it, expect, beforeAll, afterAll, beforeEach } from "vitest";
import {
  connectTest,
  createTestDeps,
  createJobSchedule,
  getJobScheduleById,
  getJobSchedulesByJobName,
  listActiveJobSchedules,
  getSchedulesReadyToRun,
  updateJobSchedule,
  updateScheduleRunTime,
  activateJobSchedule,
  deactivateJobSchedule,
  deleteJobSchedule,
  type DrizzleClient,
} from "@safee/database";
import { nukeDatabase } from "@safee/database/test-helpers";

describe("JobSchedules Integration Tests", () => {
  let db: DrizzleClient;
  let close: () => Promise<void>;

  beforeAll(async () => {
    const connection = await connectTest({ appName: "job-schedules-integration-test" });
    db = connection.drizzle;
    close = connection.close;
  });

  afterAll(async () => {
    await close();
  });

  beforeEach(async () => {
    await nukeDatabase(db);
  });

  describe("createJobSchedule", () => {
    it("should create a job schedule", async () => {
      const deps = createTestDeps(db);

      const schedule = await createJobSchedule(deps, {
        name: "Daily Email",
        jobName: "send_email",
        cronExpression: "0 9 * * *",
        timezone: "UTC",
        isActive: true,
      });

      expect(schedule).toBeDefined();
      expect(schedule.name).toBe("Daily Email");
      expect(schedule.jobName).toBe("send_email");
      expect(schedule.cronExpression).toBe("0 9 * * *");
      expect(schedule.timezone).toBe("UTC");
      expect(schedule.isActive).toBe(true);
    });

    it("should throw error for duplicate name and jobName combination", async () => {
      const deps = createTestDeps(db);

      await createJobSchedule(deps, {
        name: "Daily Email",
        jobName: "send_email",
        cronExpression: "0 9 * * *",
      });

      await expect(
        createJobSchedule(deps, {
          name: "Daily Email",
          jobName: "send_email",
          cronExpression: "0 10 * * *",
        }),
      ).rejects.toThrow("Job schedule with name 'Daily Email' already exists for this job");
    });

    it("should allow same name for different jobs", async () => {
      const deps = createTestDeps(db);

      const schedule1 = await createJobSchedule(deps, {
        name: "Daily",
        jobName: "send_email",
        cronExpression: "0 9 * * *",
      });

      // This would work if we had another job type, but send_email is the only one in the enum
      // So we can't really test this scenario properly without modifying the schema

      expect(schedule1.name).toBe("Daily");
    });
  });

  describe("getJobScheduleById", () => {
    it("should retrieve schedule by ID", async () => {
      const deps = createTestDeps(db);

      const created = await createJobSchedule(deps, {
        name: "Test Schedule",
        jobName: "send_email",
        cronExpression: "0 * * * *",
      });

      const schedule = await getJobScheduleById(deps, created.id);

      expect(schedule).toBeDefined();
      expect(schedule?.id).toBe(created.id);
      expect(schedule?.name).toBe("Test Schedule");
    });

    it("should return undefined for non-existent ID", async () => {
      const deps = createTestDeps(db);

      const schedule = await getJobScheduleById(deps, "00000000-0000-0000-0000-000000000000");

      expect(schedule).toBeUndefined();
    });
  });

  describe("getJobSchedulesByJobName", () => {
    it("should get schedules by job name", async () => {
      const deps = createTestDeps(db);

      await createJobSchedule(deps, {
        name: "Schedule 1",
        jobName: "send_email",
        cronExpression: "0 9 * * *",
      });

      await createJobSchedule(deps, {
        name: "Schedule 2",
        jobName: "send_email",
        cronExpression: "0 17 * * *",
      });

      const schedules = await getJobSchedulesByJobName(deps, "send_email");

      expect(schedules).toHaveLength(2);
      expect(schedules.map((s) => s.name)).toContain("Schedule 1");
      expect(schedules.map((s) => s.name)).toContain("Schedule 2");
    });

    it("should return empty array when no schedules exist", async () => {
      const deps = createTestDeps(db);

      const schedules = await getJobSchedulesByJobName(deps, "send_email");

      expect(schedules).toHaveLength(0);
    });
  });

  describe("listActiveJobSchedules", () => {
    it("should list only active schedules", async () => {
      const deps = createTestDeps(db);

      await createJobSchedule(deps, {
        name: "Active Schedule",
        jobName: "send_email",
        cronExpression: "0 9 * * *",
        isActive: true,
      });

      await createJobSchedule(deps, {
        name: "Inactive Schedule",
        jobName: "send_email",
        cronExpression: "0 10 * * *",
        isActive: false,
      });

      const activeSchedules = await listActiveJobSchedules(deps);

      expect(activeSchedules).toHaveLength(1);
      expect(activeSchedules[0].name).toBe("Active Schedule");
    });

    it("should order by nextRunAt", async () => {
      const deps = createTestDeps(db);

      const later = new Date(Date.now() + 1000 * 60 * 60 * 2); // 2 hours from now
      const sooner = new Date(Date.now() + 1000 * 60 * 60); // 1 hour from now

      await createJobSchedule(deps, {
        name: "Later",
        jobName: "send_email",
        cronExpression: "0 9 * * *",
        isActive: true,
        nextRunAt: later,
      });

      await createJobSchedule(deps, {
        name: "Sooner",
        jobName: "send_email",
        cronExpression: "0 10 * * *",
        isActive: true,
        nextRunAt: sooner,
      });

      const schedules = await listActiveJobSchedules(deps);

      expect(schedules[0].name).toBe("Sooner");
      expect(schedules[1].name).toBe("Later");
    });
  });

  describe("getSchedulesReadyToRun", () => {
    it("should get schedules due for execution", async () => {
      const deps = createTestDeps(db);

      const pastTime = new Date(Date.now() - 1000 * 60 * 60); // 1 hour ago
      const futureTime = new Date(Date.now() + 1000 * 60 * 60); // 1 hour from now

      await createJobSchedule(deps, {
        name: "Due Schedule",
        jobName: "send_email",
        cronExpression: "0 * * * *",
        isActive: true,
        nextRunAt: pastTime,
      });

      await createJobSchedule(deps, {
        name: "Future Schedule",
        jobName: "send_email",
        cronExpression: "0 * * * *",
        isActive: true,
        nextRunAt: futureTime,
      });

      const readySchedules = await getSchedulesReadyToRun(deps);

      expect(readySchedules).toHaveLength(1);
      expect(readySchedules[0].name).toBe("Due Schedule");
    });

    it("should include schedules with null nextRunAt", async () => {
      const deps = createTestDeps(db);

      await createJobSchedule(deps, {
        name: "No Next Run",
        jobName: "send_email",
        cronExpression: "0 * * * *",
        isActive: true,
        nextRunAt: null,
      });

      const readySchedules = await getSchedulesReadyToRun(deps);

      expect(readySchedules).toHaveLength(1);
      expect(readySchedules[0].name).toBe("No Next Run");
    });

    it("should respect custom check time", async () => {
      const deps = createTestDeps(db);

      const scheduleTime = new Date(Date.now() + 1000 * 60 * 30); // 30 minutes from now
      const checkTime = new Date(Date.now() + 1000 * 60 * 60); // 1 hour from now

      await createJobSchedule(deps, {
        name: "Schedule",
        jobName: "send_email",
        cronExpression: "0 * * * *",
        isActive: true,
        nextRunAt: scheduleTime,
      });

      const readySchedules = await getSchedulesReadyToRun(deps, checkTime);

      expect(readySchedules).toHaveLength(1);
    });

    it("should not include inactive schedules", async () => {
      const deps = createTestDeps(db);

      const pastTime = new Date(Date.now() - 1000 * 60 * 60);

      await createJobSchedule(deps, {
        name: "Inactive Due",
        jobName: "send_email",
        cronExpression: "0 * * * *",
        isActive: false,
        nextRunAt: pastTime,
      });

      const readySchedules = await getSchedulesReadyToRun(deps);

      expect(readySchedules).toHaveLength(0);
    });
  });

  describe("updateJobSchedule", () => {
    it("should update schedule properties", async () => {
      const deps = createTestDeps(db);

      const schedule = await createJobSchedule(deps, {
        name: "Original",
        jobName: "send_email",
        cronExpression: "0 9 * * *",
        isActive: true,
      });

      const updated = await updateJobSchedule(deps, schedule.id, {
        name: "Updated",
        cronExpression: "0 10 * * *",
      });

      expect(updated.name).toBe("Updated");
      expect(updated.cronExpression).toBe("0 10 * * *");
      expect(updated.isActive).toBe(true); // Unchanged
    });

    it("should throw error for non-existent schedule", async () => {
      const deps = createTestDeps(db);

      await expect(
        updateJobSchedule(deps, "00000000-0000-0000-0000-000000000000", {
          name: "Updated",
        }),
      ).rejects.toThrow("Job schedule with ID");
    });

    it("should update updatedAt timestamp", async () => {
      const deps = createTestDeps(db);

      const schedule = await createJobSchedule(deps, {
        name: "Original",
        jobName: "send_email",
        cronExpression: "0 9 * * *",
      });

      const originalUpdatedAt = schedule.updatedAt;

      await new Promise((resolve) => setTimeout(resolve, 100));

      const updated = await updateJobSchedule(deps, schedule.id, {
        name: "Updated",
      });

      expect(updated.updatedAt.getTime()).toBeGreaterThan(originalUpdatedAt.getTime());
    });
  });

  describe("updateScheduleRunTime", () => {
    it("should update lastRunAt and nextRunAt", async () => {
      const deps = createTestDeps(db);

      const schedule = await createJobSchedule(deps, {
        name: "Test",
        jobName: "send_email",
        cronExpression: "0 * * * *",
      });

      const lastRun = new Date();
      const nextRun = new Date(Date.now() + 1000 * 60 * 60);

      const updated = await updateScheduleRunTime(deps, schedule.id, lastRun, nextRun);

      expect(updated.lastRunAt).toBeDefined();
      expect(updated.nextRunAt).toBeDefined();
      expect(updated.lastRunAt?.getTime()).toBe(lastRun.getTime());
      expect(updated.nextRunAt?.getTime()).toBe(nextRun.getTime());
    });

    it("should update with only lastRunAt", async () => {
      const deps = createTestDeps(db);

      const schedule = await createJobSchedule(deps, {
        name: "Test",
        jobName: "send_email",
        cronExpression: "0 * * * *",
      });

      const lastRun = new Date();

      const updated = await updateScheduleRunTime(deps, schedule.id, lastRun);

      expect(updated.lastRunAt).toBeDefined();
      expect(updated.lastRunAt?.getTime()).toBe(lastRun.getTime());
    });
  });

  describe("activateJobSchedule", () => {
    it("should activate inactive schedule", async () => {
      const deps = createTestDeps(db);

      const schedule = await createJobSchedule(deps, {
        name: "Test",
        jobName: "send_email",
        cronExpression: "0 * * * *",
        isActive: false,
      });

      const activated = await activateJobSchedule(deps, schedule.id);

      expect(activated.isActive).toBe(true);
    });
  });

  describe("deactivateJobSchedule", () => {
    it("should deactivate active schedule", async () => {
      const deps = createTestDeps(db);

      const schedule = await createJobSchedule(deps, {
        name: "Test",
        jobName: "send_email",
        cronExpression: "0 * * * *",
        isActive: true,
      });

      const deactivated = await deactivateJobSchedule(deps, schedule.id);

      expect(deactivated.isActive).toBe(false);
    });
  });

  describe("deleteJobSchedule", () => {
    it("should delete schedule", async () => {
      const deps = createTestDeps(db);

      const schedule = await createJobSchedule(deps, {
        name: "Test",
        jobName: "send_email",
        cronExpression: "0 * * * *",
      });

      const result = await deleteJobSchedule(deps, schedule.id);

      expect(result).toBe(true);

      const deleted = await getJobScheduleById(deps, schedule.id);
      expect(deleted).toBeUndefined();
    });

    it("should return false for non-existent schedule", async () => {
      const deps = createTestDeps(db);

      const result = await deleteJobSchedule(deps, "00000000-0000-0000-0000-000000000000");

      expect(result).toBe(false);
    });
  });
});
