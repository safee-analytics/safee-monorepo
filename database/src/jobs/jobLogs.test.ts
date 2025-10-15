import { describe, it, before, after, beforeEach } from "node:test";
import assert from "node:assert";
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
  await drizzle.delete(schema.jobLogs);
  await drizzle.delete(schema.jobs);
  await drizzle.delete(schema.jobSchedules);
}

void describe("Job Logs", async () => {
  let drizzle: DrizzleClient;
  let close: () => Promise<void>;
  const logger = pino({ level: "silent" });
  let deps: DbDeps;

  before(async () => {
    ({ drizzle, close } = testConnect("job-logs-test"));
    deps = { drizzle, logger };
  });

  after(async () => {
    await close();
  });

  void describe("createJobLog", async () => {
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

    void it("creates job log successfully", async () => {
      const logEntry = await createJobLog(deps, testJob.id, "info", "Job started", {
        step: "initialization",
      });

      assert.ok(logEntry.id);
      assert.strictEqual(logEntry.jobId, testJob.id);
      assert.strictEqual(logEntry.level, "info");
      assert.strictEqual(logEntry.message, "Job started");
      assert.deepStrictEqual(logEntry.metadata, { step: "initialization" });
      assert.ok(logEntry.createdAt);
    });

    void it("creates log with empty metadata when not provided", async () => {
      const logEntry = await createJobLog(deps, testJob.id, "error", "Job failed");

      assert.strictEqual(logEntry.jobId, testJob.id);
      assert.strictEqual(logEntry.level, "error");
      assert.strictEqual(logEntry.message, "Job failed");
      assert.deepStrictEqual(logEntry.metadata, {});
    });

    void it("creates logs with different levels", async () => {
      const debugLog = await createJobLog(deps, testJob.id, "debug", "Debug message");
      const infoLog = await createJobLog(deps, testJob.id, "info", "Info message");
      const warnLog = await createJobLog(deps, testJob.id, "warn", "Warning message");
      const errorLog = await createJobLog(deps, testJob.id, "error", "Error message");

      assert.strictEqual(debugLog.level, "debug");
      assert.strictEqual(infoLog.level, "info");
      assert.strictEqual(warnLog.level, "warn");
      assert.strictEqual(errorLog.level, "error");
    });
  });

  void describe("getJobLogs", async () => {
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

    void it("returns all logs for job", async () => {
      const logs = await getJobLogs(deps, testJob.id);

      assert.strictEqual(logs.length, 5);
      assert.ok(logs.every((log) => log.jobId === testJob.id));
    });

    void it("filters logs by level", async () => {
      const errorLogs = await getJobLogs(deps, testJob.id, { level: "error" });
      assert.strictEqual(errorLogs.length, 1);
      assert.strictEqual(errorLogs[0]?.level, "error");

      const infoLogs = await getJobLogs(deps, testJob.id, { level: "info" });
      assert.strictEqual(infoLogs.length, 2);
      assert.ok(infoLogs.every((log) => log.level === "info"));
    });

    void it("filters logs by multiple levels", async () => {
      const errorAndWarnLogs = await getJobLogs(deps, testJob.id, { level: ["error", "warn"] });

      assert.strictEqual(errorAndWarnLogs.length, 2);
      assert.ok(errorAndWarnLogs.every((log) => log.level === "error" || log.level === "warn"));
    });

    void it("respects limit parameter", async () => {
      const limitedLogs = await getJobLogs(deps, testJob.id, { limit: 2 });

      assert.strictEqual(limitedLogs.length, 2);
    });

    void it("respects offset parameter", async () => {
      const firstBatch = await getJobLogs(deps, testJob.id, { limit: 2, offset: 0 });
      const secondBatch = await getJobLogs(deps, testJob.id, { limit: 2, offset: 2 });

      assert.strictEqual(firstBatch.length, 2);
      assert.strictEqual(secondBatch.length, 2);

      const firstIds = firstBatch.map((log) => log.id);
      const secondIds = secondBatch.map((log) => log.id);
      assert.ok(!firstIds.some((id) => secondIds.includes(id)));
    });

    void it("returns logs ordered by creation time descending", async () => {
      const logs = await getJobLogs(deps, testJob.id);

      // Should be ordered by creation time (newest first)
      for (let i = 1; i < logs.length; i++) {
        assert.ok(logs[i - 1].createdAt >= logs[i].createdAt);
      }
    });
  });

  void describe("getJobErrorLogs", async () => {
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

    void it("returns only error and warning logs", async () => {
      const errorLogs = await getJobErrorLogs(deps, testJob.id);

      assert.strictEqual(errorLogs.length, 2);
      assert.ok(errorLogs.every((log) => log.level === "error" || log.level === "warn"));
    });
  });

  void describe("convenience logging functions", async () => {
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

    void it("logJobInfo creates info level log", async () => {
      const logEntry = await logJobInfo(deps, testJob.id, "Info message", { data: "test" });

      assert.strictEqual(logEntry.level, "info");
      assert.strictEqual(logEntry.message, "Info message");
      assert.deepStrictEqual(logEntry.metadata, { data: "test" });
    });

    void it("logJobWarning creates warn level log", async () => {
      const logEntry = await logJobWarning(deps, testJob.id, "Warning message");

      assert.strictEqual(logEntry.level, "warn");
      assert.strictEqual(logEntry.message, "Warning message");
    });

    void it("logJobError creates error level log", async () => {
      const logEntry = await logJobError(deps, testJob.id, "Error message");

      assert.strictEqual(logEntry.level, "error");
      assert.strictEqual(logEntry.message, "Error message");
    });

    void it("logJobDebug creates debug level log", async () => {
      const logEntry = await logJobDebug(deps, testJob.id, "Debug message");

      assert.strictEqual(logEntry.level, "debug");
      assert.strictEqual(logEntry.message, "Debug message");
    });
  });

  void describe("cleanupOldJobLogs", async () => {
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

    void it("deletes old logs based on cutoff date", async () => {
      await createJobLog(deps, testJob.id, "info", "Old log 1");
      await createJobLog(deps, testJob.id, "info", "Old log 2");
      await createJobLog(deps, testJob.id, "info", "Recent log");

      // Set cutoff to current time (should delete all existing logs)
      const cutoffDate = new Date();

      const deletedCount = await cleanupOldJobLogs(deps, cutoffDate);

      assert.ok(deletedCount >= 3);

      const remainingLogs = await getJobLogs(deps, testJob.id);
      assert.strictEqual(remainingLogs.length, 0);
    });

    void it("returns zero when no logs to delete", async () => {
      const futureDate = new Date(Date.now() + 60000);

      const deletedCount = await cleanupOldJobLogs(deps, futureDate);

      assert.strictEqual(deletedCount, 0);
    });
  });

  void describe("getJobLogsSummary", async () => {
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

    void it("returns correct summary statistics", async () => {
      const summaries = await getJobLogsSummary(deps, [testJob1.id, testJob2.id]);

      assert.strictEqual(summaries.length, 2);

      const job1Summary = summaries.find((s) => s.jobId === testJob1.id);
      const job2Summary = summaries.find((s) => s.jobId === testJob2.id);

      assert.ok(job1Summary);
      assert.strictEqual(job1Summary.totalLogs, 4);
      assert.strictEqual(job1Summary.errorCount, 1);
      assert.strictEqual(job1Summary.warningCount, 1);
      assert.ok(job1Summary.lastLogTime);

      assert.ok(job2Summary);
      assert.strictEqual(job2Summary.totalLogs, 4);
      assert.strictEqual(job2Summary.errorCount, 2);
      assert.strictEqual(job2Summary.warningCount, 0);
      assert.ok(job2Summary.lastLogTime);

      // job2 should have later lastLogTime since we created its last log later
      assert.ok(job2Summary.lastLogTime > job1Summary.lastLogTime);
    });

    void it("handles jobs with no logs", async () => {
      const emptyJob = await createJob(deps, {
        jobName: "send_email" as const,
        maxRetries: 3,
        type: "immediate" as const,
        priority: "normal" as const,
      });

      const summaries = await getJobLogsSummary(deps, [emptyJob.id]);

      assert.strictEqual(summaries.length, 1);
      assert.strictEqual(summaries[0]?.totalLogs, 0);
      assert.strictEqual(summaries[0]?.errorCount, 0);
      assert.strictEqual(summaries[0]?.warningCount, 0);
      assert.strictEqual(summaries[0]?.lastLogTime, null);
    });

    void it("returns empty array for empty job list", async () => {
      const summaries = await getJobLogsSummary(deps, []);

      assert.strictEqual(summaries.length, 0);
    });
  });
});
