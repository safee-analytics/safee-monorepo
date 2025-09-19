import { eq, and, desc, inArray, lte } from "drizzle-orm";
import { DbDeps } from "../deps.js";
import { jobLogs } from "../drizzle/jobLogs.js";
import type { JobLog } from "../drizzle/jobLogs.js";

type LogLevel = "debug" | "info" | "warn" | "error";

/**
 * Create job log entry
 */
export async function createJobLog(
  { drizzle, logger }: DbDeps,
  jobId: string,
  level: LogLevel,
  message: string,
  metadata: Record<string, unknown> = {},
): Promise<JobLog> {
  logger.debug({ jobId, level, message }, "Creating job log entry");

  const [result] = await drizzle
    .insert(jobLogs)
    .values({
      jobId,
      level,
      message,
      metadata,
    })
    .returning();

  return result;
}

/**
 * Get logs for a job
 */
export async function getJobLogs(
  { drizzle, logger }: DbDeps,
  jobId: string,
  options: {
    level?: LogLevel | LogLevel[];
    limit?: number;
    offset?: number;
  } = {},
): Promise<JobLog[]> {
  const { level, limit = 100, offset = 0 } = options;

  logger.debug({ jobId, level, limit, offset }, "Getting job logs");

  const whereConditions = [eq(jobLogs.jobId, jobId)];

  if (level) {
    const levels = Array.isArray(level) ? level : [level];
    whereConditions.push(inArray(jobLogs.level, levels));
  }

  return await drizzle.query.jobLogs.findMany({
    where: and(...whereConditions),
    orderBy: desc(jobLogs.createdAt),
    limit,
    offset,
  });
}

/**
 * Get error logs for a job
 */
export async function getJobErrorLogs({ drizzle, logger }: DbDeps, jobId: string): Promise<JobLog[]> {
  logger.debug({ jobId }, "Getting job error logs");

  return getJobLogs({ drizzle, logger }, jobId, {
    level: ["error", "warn"],
  });
}

/**
 * Log job info message
 */
export async function logJobInfo(
  { drizzle, logger }: DbDeps,
  jobId: string,
  message: string,
  metadata: Record<string, unknown> = {},
): Promise<JobLog> {
  return createJobLog({ drizzle, logger }, jobId, "info", message, metadata);
}

/**
 * Log job warning message
 */
export async function logJobWarning(
  { drizzle, logger }: DbDeps,
  jobId: string,
  message: string,
  metadata: Record<string, unknown> = {},
): Promise<JobLog> {
  return createJobLog({ drizzle, logger }, jobId, "warn", message, metadata);
}

/**
 * Log job error message
 */
export async function logJobError(
  { drizzle, logger }: DbDeps,
  jobId: string,
  message: string,
  metadata: Record<string, unknown> = {},
): Promise<JobLog> {
  return createJobLog({ drizzle, logger }, jobId, "error", message, metadata);
}

/**
 * Log job debug message
 */
export async function logJobDebug(
  { drizzle, logger }: DbDeps,
  jobId: string,
  message: string,
  metadata: Record<string, unknown> = {},
): Promise<JobLog> {
  return createJobLog({ drizzle, logger }, jobId, "debug", message, metadata);
}

/**
 * Clean up old job logs
 */
export async function cleanupOldJobLogs({ drizzle, logger }: DbDeps, olderThan: Date): Promise<number> {
  logger.info({ olderThan }, "Cleaning up old job logs");

  const result = await drizzle.delete(jobLogs).where(lte(jobLogs.createdAt, olderThan));

  const deletedCount = result.rowCount ?? 0;
  logger.info({ deletedCount, olderThan }, "Cleaned up old job logs");

  return deletedCount;
}

/**
 * Get logs summary for multiple jobs
 */
export async function getJobLogsSummary(
  { drizzle, logger }: DbDeps,
  jobIds: string[],
): Promise<
  {
    jobId: string;
    totalLogs: number;
    errorCount: number;
    warningCount: number;
    lastLogTime: Date | null;
  }[]
> {
  logger.debug({ jobIds }, "Getting job logs summary");

  // This would require a more complex query or multiple queries
  // For now, implementing a simplified version
  const summaries = [];

  for (const jobId of jobIds) {
    const logs = await drizzle.query.jobLogs.findMany({
      where: eq(jobLogs.jobId, jobId),
      columns: { level: true, createdAt: true },
    });

    const errorCount = logs.filter((log) => log.level === "error").length;
    const warningCount = logs.filter((log) => log.level === "warn").length;
    const lastLogTime =
      logs.length > 0
        ? logs.reduce((latest, log) => (log.createdAt > latest ? log.createdAt : latest), logs[0]?.createdAt)
        : null;

    summaries.push({
      jobId,
      totalLogs: logs.length,
      errorCount,
      warningCount,
      lastLogTime,
    });
  }

  return summaries;
}
