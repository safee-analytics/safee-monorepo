import { describe, it, expect, beforeAll, afterAll, beforeEach } from "vitest";
import { inArray } from "drizzle-orm";
import {
  connectTest,
  createTestDeps,
  createJobLog,
  getJobLogs,
  getJobErrorLogs,
  logJobInfo,
  logJobWarning,
  logJobError,
  logJobDebug,
  cleanupOldJobLogs,
  getJobLogsSummary,
  createJob,
  schema,
  type DrizzleClient,
} from "@safee/database";

const { organizations, jobLogs } = schema;

describe("JobLogs Integration Tests", () => {
  let db: DrizzleClient;
  let close: () => Promise<void>;
  let testOrgId: string;
  let testJobId: string;

  beforeAll(async () => {
    const connection = await connectTest();
    db = connection.drizzle;
    close = connection.close;
  });

  afterAll(async () => {
    await close();
  });

  beforeEach(async () => {
    // With CASCADE, we only need to delete organizations
    await db.delete(organizations);

    // Create test organization
    const [org] = await db
      .insert(organizations)
      .values({ name: "Test Org", slug: "test-org-logs" })
      .returning();
    testOrgId = org.id;

    // Create test job
    const deps = createTestDeps(db);
    const job = await createJob(deps, {
      jobName: "send_email",
      type: "immediate" as const,
      priority: "normal" as const,
      status: "pending" as const,
      organizationId: testOrgId,
      payload: {},
      maxRetries: 3,
    });
    testJobId = job.id;
  });

  describe("createJobLog", () => {
    it("should create a job log entry", async () => {
      const deps = createTestDeps(db);

      const log = await createJobLog(deps, testJobId, "info", "Test message", { key: "value" });

      expect(log).toBeDefined();
      expect(log.jobId).toBe(testJobId);
      expect(log.level).toBe("info");
      expect(log.message).toBe("Test message");
      expect(log.metadata).toEqual({ key: "value" });
    });

    it("should create log with different levels", async () => {
      const deps = createTestDeps(db);

      const debugLog = await createJobLog(deps, testJobId, "debug", "Debug message");
      const infoLog = await createJobLog(deps, testJobId, "info", "Info message");
      const warnLog = await createJobLog(deps, testJobId, "warn", "Warning message");
      const errorLog = await createJobLog(deps, testJobId, "error", "Error message");

      expect(debugLog.level).toBe("debug");
      expect(infoLog.level).toBe("info");
      expect(warnLog.level).toBe("warn");
      expect(errorLog.level).toBe("error");
    });
  });

  describe("getJobLogs", () => {
    it("should get all logs for a job", async () => {
      const deps = createTestDeps(db);

      await createJobLog(deps, testJobId, "info", "Message 1");
      await createJobLog(deps, testJobId, "info", "Message 2");
      await createJobLog(deps, testJobId, "error", "Error message");

      const logs = await getJobLogs(deps, testJobId);

      expect(logs).toHaveLength(3);
    });

    it("should filter logs by single level", async () => {
      const deps = createTestDeps(db);

      await createJobLog(deps, testJobId, "info", "Info message");
      await createJobLog(deps, testJobId, "error", "Error message");
      await createJobLog(deps, testJobId, "warn", "Warning message");

      const errorLogs = await getJobLogs(deps, testJobId, { level: "error" });

      expect(errorLogs).toHaveLength(1);
      expect(errorLogs[0].level).toBe("error");
    });

    it("should filter logs by multiple levels", async () => {
      const deps = createTestDeps(db);

      await createJobLog(deps, testJobId, "info", "Info message");
      await createJobLog(deps, testJobId, "error", "Error message");
      await createJobLog(deps, testJobId, "warn", "Warning message");
      await createJobLog(deps, testJobId, "debug", "Debug message");

      const logs = await getJobLogs(deps, testJobId, { level: ["error", "warn"] });

      expect(logs).toHaveLength(2);
      expect(logs.every((l) => l.level === "error" || l.level === "warn")).toBe(true);
    });

    it("should respect limit and offset", async () => {
      const deps = createTestDeps(db);

      // Create 5 logs
      for (let i = 1; i <= 5; i++) {
        await createJobLog(deps, testJobId, "info", `Message ${i}`);
      }

      const firstPage = await getJobLogs(deps, testJobId, { limit: 2, offset: 0 });
      const secondPage = await getJobLogs(deps, testJobId, { limit: 2, offset: 2 });

      expect(firstPage).toHaveLength(2);
      expect(secondPage).toHaveLength(2);
      expect(firstPage[0].message).not.toBe(secondPage[0].message);
    });

    it("should order logs by newest first", async () => {
      const deps = createTestDeps(db);

      await createJobLog(deps, testJobId, "info", "First message");
      await new Promise((resolve) => setTimeout(resolve, 10));
      await createJobLog(deps, testJobId, "info", "Second message");
      await new Promise((resolve) => setTimeout(resolve, 10));
      await createJobLog(deps, testJobId, "info", "Third message");

      const logs = await getJobLogs(deps, testJobId);

      expect(logs[0].message).toBe("Third message");
      expect(logs[2].message).toBe("First message");
    });
  });

  describe("getJobErrorLogs", () => {
    it("should get only error and warning logs", async () => {
      const deps = createTestDeps(db);

      await createJobLog(deps, testJobId, "info", "Info message");
      await createJobLog(deps, testJobId, "error", "Error message");
      await createJobLog(deps, testJobId, "warn", "Warning message");
      await createJobLog(deps, testJobId, "debug", "Debug message");

      const errorLogs = await getJobErrorLogs(deps, testJobId);

      expect(errorLogs).toHaveLength(2);
      expect(errorLogs.every((l) => l.level === "error" || l.level === "warn")).toBe(true);
    });
  });

  describe("convenience log functions", () => {
    it("should log info message", async () => {
      const deps = createTestDeps(db);

      const log = await logJobInfo(deps, testJobId, "Info message", { extra: "data" });

      expect(log.level).toBe("info");
      expect(log.message).toBe("Info message");
      expect(log.metadata).toEqual({ extra: "data" });
    });

    it("should log warning message", async () => {
      const deps = createTestDeps(db);

      const log = await logJobWarning(deps, testJobId, "Warning message");

      expect(log.level).toBe("warn");
      expect(log.message).toBe("Warning message");
    });

    it("should log error message", async () => {
      const deps = createTestDeps(db);

      const log = await logJobError(deps, testJobId, "Error message");

      expect(log.level).toBe("error");
      expect(log.message).toBe("Error message");
    });

    it("should log debug message", async () => {
      const deps = createTestDeps(db);

      const log = await logJobDebug(deps, testJobId, "Debug message");

      expect(log.level).toBe("debug");
      expect(log.message).toBe("Debug message");
    });
  });

  describe("cleanupOldJobLogs", () => {
    it("should delete logs older than specified date", async () => {
      const deps = createTestDeps(db);

      // Create old logs
      const oldLog1 = await createJobLog(deps, testJobId, "info", "Old message 1");
      const oldLog2 = await createJobLog(deps, testJobId, "info", "Old message 2");

      // Manually update createdAt to be old
      const oldDate = new Date(Date.now() - 1000 * 60 * 60 * 24 * 10); // 10 days ago
      await db
        .update(jobLogs)
        .set({ createdAt: oldDate })
        .where(inArray(jobLogs.id, [oldLog1.id, oldLog2.id]));

      // Create recent log
      await createJobLog(deps, testJobId, "info", "Recent message");

      const cutoffDate = new Date(Date.now() - 1000 * 60 * 60 * 24 * 7); // 7 days ago
      const deletedCount = await cleanupOldJobLogs(deps, cutoffDate);

      expect(deletedCount).toBe(2);

      const remainingLogs = await getJobLogs(deps, testJobId);
      expect(remainingLogs).toHaveLength(1);
      expect(remainingLogs[0].message).toBe("Recent message");
    });

    it("should return 0 when no logs to delete", async () => {
      const deps = createTestDeps(db);

      await createJobLog(deps, testJobId, "info", "Recent message");

      const cutoffDate = new Date(Date.now() - 1000 * 60 * 60 * 24 * 7);
      const deletedCount = await cleanupOldJobLogs(deps, cutoffDate);

      expect(deletedCount).toBe(0);
    });
  });

  describe("getJobLogsSummary", () => {
    it("should get summary for multiple jobs", async () => {
      const deps = createTestDeps(db);

      // Create second job
      const job2 = await createJob(deps, {
        jobName: "send_email",
        type: "immediate" as const,
        priority: "normal" as const,
        status: "pending" as const,
        organizationId: testOrgId,
        payload: {},
        maxRetries: 3,
      });

      // Create logs for first job
      await createJobLog(deps, testJobId, "info", "Info 1");
      await createJobLog(deps, testJobId, "error", "Error 1");
      await createJobLog(deps, testJobId, "warn", "Warning 1");

      // Create logs for second job
      await createJobLog(deps, job2.id, "info", "Info 2");
      await createJobLog(deps, job2.id, "error", "Error 2");

      const summary = await getJobLogsSummary(deps, [testJobId, job2.id]);

      expect(summary).toHaveLength(2);

      const job1Summary = summary.find((s) => s.jobId === testJobId);
      expect(job1Summary).toBeDefined();
      expect(job1Summary?.totalLogs).toBe(3);
      expect(job1Summary?.errorCount).toBe(1);
      expect(job1Summary?.warningCount).toBe(1);
      expect(job1Summary?.lastLogTime).toBeInstanceOf(Date);

      const job2Summary = summary.find((s) => s.jobId === job2.id);
      expect(job2Summary).toBeDefined();
      expect(job2Summary?.totalLogs).toBe(2);
      expect(job2Summary?.errorCount).toBe(1);
      expect(job2Summary?.warningCount).toBe(0);
    });

    it("should return zero counts for jobs with no logs", async () => {
      const deps = createTestDeps(db);

      const summary = await getJobLogsSummary(deps, [testJobId]);

      expect(summary).toHaveLength(1);
      expect(summary[0].totalLogs).toBe(0);
      expect(summary[0].errorCount).toBe(0);
      expect(summary[0].warningCount).toBe(0);
      expect(summary[0].lastLogTime).toBeNull();
    });

    it("should return empty array for empty job list", async () => {
      const deps = createTestDeps(db);

      const summary = await getJobLogsSummary(deps, []);

      expect(summary).toEqual([]);
    });
  });
});
