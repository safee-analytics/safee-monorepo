import { describe, it, beforeAll, afterAll, beforeEach, expect } from "vitest";
import { pino } from "pino";
import { testConnect } from "../drizzle/testConnect.js";
import type { DrizzleClient } from "../drizzle.js";
import {
  createJobLog,
  getJobLogs,
  getJobErrorLogs,
  logJobInfo,
  logJobWarning,
  logJobError,
  logJobDebug,
  cleanupOldJobLogs,
  getJobLogsSummary,
} from "./jobLogs.js";
import { createJob } from "./jobs.js";
import * as schema from "../drizzle/index.js";
import type { DbDeps } from "../deps.js";

async function wipeJobLogsDb(drizzle: DrizzleClient) {
  await drizzle.delete(schema.jobs);
  await drizzle.delete(schema.jobSchedules);
}

describe("Job Logs", async () => {
  let drizzle: DrizzleClient;
  let close: () => Promise<void>;
  const logger = pino({ level: "silent" });
  let deps: DbDeps;

  beforeAll(async () => {
    ({ drizzle, close } = testConnect("job-logs-test"));
    deps = { drizzle, logger };
  });

  afterAll(async () => {
    await close();
  });

  describe("createJobLog", async () => {
    let testJob: typeof schema.jobs.$inferSelect;

    beforeEach(async () => {
      await wipeJobLogsDb(drizzle);

      testJob = await createJob(deps, {
        jobName: "send_email" as const,
        maxRetries: 3,
        type: "immediate" as const,
        priority: "normal" as const,
      });
    });

    it("creates job log successfully", async () => {
      const logEntry = await createJobLog(deps, testJob.id, "info", "Job started", {
        step: "initialization",
      });

      expect(logEntry.id).toBeTruthy();
      expect(logEntry.jobId).toBe(testJob.id);
      expect(logEntry.level).toBe("info");
      expect(logEntry.message).toBe("Job started");
      expect(logEntry.metadata).toEqual({ step: "initialization" });
      expect(logEntry.createdAt).toBeTruthy();
    });

    it("creates log with empty metadata when not provided", async () => {
      const logEntry = await createJobLog(deps, testJob.id, "error", "Job failed");

      expect(logEntry.jobId).toBe(testJob.id);
      expect(logEntry.level).toBe("error");
      expect(logEntry.message).toBe("Job failed");
      expect(logEntry.metadata).toEqual({});
    });

    it("creates logs with different levels", async () => {
      const debugLog = await createJobLog(deps, testJob.id, "debug", "Debug message");
      const infoLog = await createJobLog(deps, testJob.id, "info", "Info message");
      const warnLog = await createJobLog(deps, testJob.id, "warn", "Warning message");
      const errorLog = await createJobLog(deps, testJob.id, "error", "Error message");

      expect(debugLog.level).toBe("debug");
      expect(infoLog.level).toBe("info");
      expect(warnLog.level).toBe("warn");
      expect(errorLog.level).toBe("error");
    });
  });

  describe("getJobLogs", async () => {
    let testJob: typeof schema.jobs.$inferSelect;

    beforeEach(async () => {
      await wipeJobLogsDb(drizzle);

      testJob = await createJob(deps, {
        jobName: "send_email" as const,
        maxRetries: 3,
        type: "immediate" as const,
        priority: "normal" as const,
      });

      await createJobLog(deps, testJob.id, "debug", "Debug message");
      await createJobLog(deps, testJob.id, "info", "Info message 1");
      await createJobLog(deps, testJob.id, "info", "Info message 2");
      await createJobLog(deps, testJob.id, "warn", "Warning message");
      await createJobLog(deps, testJob.id, "error", "Error message");
    });

    it("returns all logs for job", async () => {
      const logs = await getJobLogs(deps, testJob.id);

      expect(logs.length).toBe(5);
      expect(logs.every((log) => log.jobId === testJob.id));
    });

    it("filters logs by level", async () => {
      const errorLogs = await getJobLogs(deps, testJob.id, { level: "error" });
      expect(errorLogs.length).toBe(1);
      expect(errorLogs[0]?.level).toBe("error");

      const infoLogs = await getJobLogs(deps, testJob.id, { level: "info" });
      expect(infoLogs.length).toBe(2);
      expect(infoLogs.every((log) => log.level === "info"));
    });

    it("filters logs by multiple levels", async () => {
      const errorAndWarnLogs = await getJobLogs(deps, testJob.id, { level: ["error", "warn"] });

      expect(errorAndWarnLogs.length).toBe(2);
      expect(errorAndWarnLogs.every((log) => log.level === "error" || log.level === "warn"));
    });

    it("respects limit parameter", async () => {
      const limitedLogs = await getJobLogs(deps, testJob.id, { limit: 2 });

      expect(limitedLogs.length).toBe(2);
    });

    it("respects offset parameter", async () => {
      const firstBatch = await getJobLogs(deps, testJob.id, { limit: 2, offset: 0 });
      const secondBatch = await getJobLogs(deps, testJob.id, { limit: 2, offset: 2 });

      expect(firstBatch.length).toBe(2);
      expect(secondBatch.length).toBe(2);

      const firstIds = firstBatch.map((log) => log.id);
      const secondIds = secondBatch.map((log) => log.id);
      expect(!firstIds.some((id) => secondIds.includes(id)));
    });

    it("returns logs ordered by creation time descending", async () => {
      const logs = await getJobLogs(deps, testJob.id);

      for (let i = 1; i < logs.length; i++) {
        expect(logs[i - 1].createdAt >= logs[i].createdAt).toBeTruthy();
      }
    });
  });

  describe("getJobErrorLogs", async () => {
    let testJob: typeof schema.jobs.$inferSelect;

    beforeEach(async () => {
      await wipeJobLogsDb(drizzle);

      testJob = await createJob(deps, {
        jobName: "send_email" as const,
        maxRetries: 3,
        type: "immediate" as const,
        priority: "normal" as const,
      });

      await createJobLog(deps, testJob.id, "debug", "Debug message");
      await createJobLog(deps, testJob.id, "info", "Info message");
      await createJobLog(deps, testJob.id, "warn", "Warning message");
      await createJobLog(deps, testJob.id, "error", "Error message");
    });

    it("returns only error and warning logs", async () => {
      const errorLogs = await getJobErrorLogs(deps, testJob.id);

      expect(errorLogs.length).toBe(2);
      expect(errorLogs.every((log) => log.level === "error" || log.level === "warn"));
    });
  });

  describe("convenience logging functions", async () => {
    let testJob: typeof schema.jobs.$inferSelect;

    beforeEach(async () => {
      await wipeJobLogsDb(drizzle);

      testJob = await createJob(deps, {
        jobName: "send_email" as const,
        maxRetries: 3,
        type: "immediate" as const,
        priority: "normal" as const,
      });
    });

    it("logJobInfo creates info level log", async () => {
      const logEntry = await logJobInfo(deps, testJob.id, "Info message", { data: "test" });

      expect(logEntry.level).toBe("info");
      expect(logEntry.message).toBe("Info message");
      expect(logEntry.metadata).toEqual({ data: "test" });
    });

    it("logJobWarning creates warn level log", async () => {
      const logEntry = await logJobWarning(deps, testJob.id, "Warning message");

      expect(logEntry.level).toBe("warn");
      expect(logEntry.message).toBe("Warning message");
    });

    it("logJobError creates error level log", async () => {
      const logEntry = await logJobError(deps, testJob.id, "Error message");

      expect(logEntry.level).toBe("error");
      expect(logEntry.message).toBe("Error message");
    });

    it("logJobDebug creates debug level log", async () => {
      const logEntry = await logJobDebug(deps, testJob.id, "Debug message");

      expect(logEntry.level).toBe("debug");
      expect(logEntry.message).toBe("Debug message");
    });
  });

  describe("cleanupOldJobLogs", async () => {
    let testJob: typeof schema.jobs.$inferSelect;

    beforeEach(async () => {
      await wipeJobLogsDb(drizzle);

      testJob = await createJob(deps, {
        jobName: "send_email" as const,
        maxRetries: 3,
        type: "immediate" as const,
        priority: "normal" as const,
      });
    });

    it("deletes old logs based on cutoff date", async () => {
      await createJobLog(deps, testJob.id, "info", "Old log 1");
      await createJobLog(deps, testJob.id, "info", "Old log 2");
      await createJobLog(deps, testJob.id, "info", "Recent log");

      // Wait a bit to ensure logs have timestamps before cutoff
      await new Promise((resolve) => setTimeout(resolve, 10));

      // Set cutoff to current time (should delete all existing logs)
      const cutoffDate = new Date();

      const deletedCount = await cleanupOldJobLogs(deps, cutoffDate);

      expect(deletedCount >= 3).toBeTruthy();

      const remainingLogs = await getJobLogs(deps, testJob.id);
      expect(remainingLogs.length).toBe(0);
    });

    it("returns zero when no logs to delete", async () => {
      const futureDate = new Date(Date.now() + 60000);

      const deletedCount = await cleanupOldJobLogs(deps, futureDate);

      expect(deletedCount).toBe(0);
    });
  });

  describe("getJobLogsSummary", async () => {
    let testJob1: typeof schema.jobs.$inferSelect;
    let testJob2: typeof schema.jobs.$inferSelect;

    beforeEach(async () => {
      await wipeJobLogsDb(drizzle);

      testJob1 = await createJob(deps, {
        jobName: "send_email" as const,
        maxRetries: 3,
        type: "immediate" as const,
        priority: "normal" as const,
      });

      testJob2 = await createJob(deps, {
        jobName: "send_email" as const,
        maxRetries: 3,
        type: "immediate" as const,
        priority: "normal" as const,
      });

      await createJobLog(deps, testJob1.id, "info", "Info message 1");
      await createJobLog(deps, testJob1.id, "info", "Info message 2");
      await createJobLog(deps, testJob1.id, "warn", "Warning message");
      await createJobLog(deps, testJob1.id, "error", "Error message");

      await createJobLog(deps, testJob2.id, "info", "Info message");
      await createJobLog(deps, testJob2.id, "error", "Error message 1");
      await createJobLog(deps, testJob2.id, "error", "Error message 2");

      // Wait a bit to ensure different timestamps
      await new Promise((resolve) => setTimeout(resolve, 10));
      await createJobLog(deps, testJob2.id, "info", "Latest message");
    });

    it("returns correct summary statistics", async () => {
      const summaries = await getJobLogsSummary(deps, [testJob1.id, testJob2.id]);

      expect(summaries.length).toBe(2);

      const job1Summary = summaries.find((s) => s.jobId === testJob1.id);
      const job2Summary = summaries.find((s) => s.jobId === testJob2.id);

      expect(job1Summary).toBeTruthy();
      expect(job1Summary!.totalLogs).toBe(4);
      expect(job1Summary!.errorCount).toBe(1);
      expect(job1Summary!.warningCount).toBe(1);
      expect(job1Summary!.lastLogTime).toBeTruthy();

      expect(job2Summary).toBeTruthy();
      expect(job2Summary!.totalLogs).toBe(4);
      expect(job2Summary!.errorCount).toBe(2);
      expect(job2Summary!.warningCount).toBe(0);
      expect(job2Summary!.lastLogTime).toBeTruthy();

      // job2 should have later lastLogTime since we created its last log later
      expect(job2Summary!.lastLogTime! > job1Summary!.lastLogTime!).toBeTruthy();
    });

    it("handles jobs with no logs", async () => {
      const emptyJob = await createJob(deps, {
        jobName: "send_email" as const,
        maxRetries: 3,
        type: "immediate" as const,
        priority: "normal" as const,
      });

      const summaries = await getJobLogsSummary(deps, [emptyJob.id]);

      expect(summaries.length).toBe(1);
      expect(summaries[0]?.totalLogs).toBe(0);
      expect(summaries[0]?.errorCount).toBe(0);
      expect(summaries[0]?.warningCount).toBe(0);
      expect(summaries[0]?.lastLogTime).toBe(null);
    });

    it("returns empty array for empty job list", async () => {
      const summaries = await getJobLogsSummary(deps, []);

      expect(summaries.length).toBe(0);
    });
  });
});
