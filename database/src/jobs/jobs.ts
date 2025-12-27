import { eq, and, desc, asc, inArray, lte, or, isNull, lt, count, gte, sql } from "drizzle-orm";
import { DbDeps } from "../deps.js";
import { conditionalCount } from "../index.js";
import { jobs } from "../drizzle/jobs.js";
import { jobLogs } from "../drizzle/jobLogs.js";
import type { Job, NewJob } from "../drizzle/jobs.js";
import type { JobStatus, JobType, Priority } from "../drizzle/_common.js";

// Priority order: critical=1, high=2, normal=3, low=4
const priorityOrder = sql`CASE ${jobs.priority}
  WHEN 'critical' THEN 1
  WHEN 'high' THEN 2
  WHEN 'normal' THEN 3
  WHEN 'low' THEN 4
  ELSE 5
END`;
// TODO: use query engine
export async function createJob({ drizzle, logger }: DbDeps, data: NewJob): Promise<Job> {
  logger.info(
    {
      jobName: data.jobName,
      type: data.type,
      priority: data.priority,
    },
    "Creating job",
  );

  const [result] = await drizzle.insert(jobs).values(data).returning();

  logger.info(
    {
      id: result.id,
      jobName: result.jobName,
      status: result.status,
    },
    "Job created successfully",
  );

  return result;
}

export async function getJobById({ drizzle, logger }: DbDeps, id: string): Promise<Job | undefined> {
  logger.debug({ id }, "Getting job by ID");

  const result = await drizzle.query.jobs.findFirst({
    where: eq(jobs.id, id),
    with: {
      schedule: true,
      organization: true,
      logs: {
        orderBy: desc(jobLogs.createdAt),
        limit: 10,
      },
    },
  });

  if (!result) {
    logger.warn({ id }, "Job not found");
  }

  return result;
}

export async function getJobsByStatus(
  { drizzle, logger }: DbDeps,
  status: JobStatus | JobStatus[],
): Promise<Job[]> {
  const statuses = Array.isArray(status) ? status : [status];
  logger.debug({ statuses }, "Getting jobs by status");

  return await drizzle
    .select()
    .from(jobs)
    .where(inArray(jobs.status, statuses))
    .orderBy(asc(priorityOrder), asc(jobs.scheduledFor), asc(jobs.createdAt));
}

export async function getPendingJobs(
  { drizzle, logger }: DbDeps,
  limit = 10,
  organizationId?: string,
): Promise<Job[]> {
  logger.debug({ limit, organizationId }, "Getting pending jobs");

  const now = new Date();
  let whereCondition = and(
    eq(jobs.status, "pending"),
    or(lte(jobs.scheduledFor, now), isNull(jobs.scheduledFor)),
  );

  if (organizationId) {
    whereCondition = and(whereCondition, eq(jobs.organizationId, organizationId));
  }

  const results = await drizzle
    .select()
    .from(jobs)
    .where(whereCondition)
    .orderBy(asc(priorityOrder), asc(jobs.scheduledFor), asc(jobs.createdAt))
    .limit(limit);

  logger.info({ count: results.length, limit }, "Retrieved pending jobs");
  return results;
}

export async function getRetryableJobs({ drizzle, logger }: DbDeps, limit = 10): Promise<Job[]> {
  logger.debug({ limit }, "Getting retryable jobs");

  const results = await drizzle
    .select()
    .from(jobs)
    .where(and(eq(jobs.status, "failed"), lt(jobs.attempts, jobs.maxRetries)))
    .orderBy(asc(priorityOrder), asc(jobs.updatedAt))
    .limit(limit);

  logger.info({ count: results.length }, "Retrieved retryable jobs");
  return results;
}

export async function updateJobStatus(
  { drizzle, logger }: DbDeps,
  id: string,
  status: JobStatus,
  data: {
    startedAt?: Date;
    completedAt?: Date;
    result?: Record<string, unknown>;
    error?: string;
    attempts?: number;
  } = {},
): Promise<Job> {
  logger.info({ id, status, data }, "Updating job status");

  return drizzle.transaction(async (tx) => {
    const existing = await tx.query.jobs.findFirst({
      where: eq(jobs.id, id),
    });

    if (!existing) {
      logger.error({ id }, "Job not found for status update");
      throw new Error(`Job with ID '${id}' not found`);
    }

    const updateData: Partial<NewJob> = {
      status,
      updatedAt: new Date(),
      ...data,
    };

    // Set completion time for final statuses
    if (["completed", "failed", "cancelled"].includes(status) && !data.completedAt) {
      updateData.completedAt = new Date();
    }

    const [result] = await tx.update(jobs).set(updateData).where(eq(jobs.id, id)).returning();

    logger.info(
      {
        id: result.id,
        status: result.status,
        attempts: result.attempts,
      },
      "Job status updated successfully",
    );

    return result;
  });
}

export async function startJob({ drizzle, logger }: DbDeps, id: string): Promise<Job> {
  logger.info({ id }, "Starting job execution");

  return updateJobStatus({ drizzle, logger }, id, "running", {
    startedAt: new Date(),
    attempts: 1, // Increment attempts when starting
  });
}

export async function completeJob(
  { drizzle, logger }: DbDeps,
  id: string,
  result?: Record<string, unknown>,
): Promise<Job> {
  logger.info({ id }, "Completing job successfully");

  return updateJobStatus({ drizzle, logger }, id, "completed", {
    result,
    completedAt: new Date(),
  });
}

export async function failJob(
  { drizzle, logger }: DbDeps,
  id: string,
  error: string,
  shouldRetry = false,
): Promise<Job> {
  logger.info({ id, error, shouldRetry }, "Failing job");

  const status = shouldRetry ? "retrying" : "failed";

  return updateJobStatus({ drizzle, logger }, id, status, {
    error,
    completedAt: shouldRetry ? undefined : new Date(),
  });
}

export async function cancelJob({ drizzle, logger }: DbDeps, id: string): Promise<Job> {
  logger.info({ id }, "Cancelling job");

  return updateJobStatus({ drizzle, logger }, id, "cancelled", {
    completedAt: new Date(),
  });
}

export async function getJobStats(
  { drizzle, logger }: DbDeps,
  organizationId?: string,
  timeRange?: { start: Date; end: Date },
): Promise<{
  total: number;
  byStatus: Record<JobStatus, number>;
  byType: Record<JobType, number>;
  byPriority: Record<Priority, number>;
}> {
  logger.debug({ organizationId, timeRange }, "Getting job statistics");

  const whereConditions = [];
  if (organizationId) {
    whereConditions.push(eq(jobs.organizationId, organizationId));
  }
  if (timeRange) {
    whereConditions.push(and(lte(jobs.createdAt, timeRange.end), gte(jobs.createdAt, timeRange.start)));
  }

  const baseWhere = whereConditions.length > 0 ? and(...whereConditions) : undefined;

  const [result] = await drizzle
    .select({
      total: count(),
      pendingCount: conditionalCount(jobs.status, "pending"),
      runningCount: conditionalCount(jobs.status, "running"),
      completedCount: conditionalCount(jobs.status, "completed"),
      failedCount: conditionalCount(jobs.status, "failed"),
      cancelledCount: conditionalCount(jobs.status, "cancelled"),
      retryingCount: conditionalCount(jobs.status, "retrying"),
      cronCount: conditionalCount(jobs.type, "cron"),
      scheduledCount: conditionalCount(jobs.type, "scheduled"),
      immediateCount: conditionalCount(jobs.type, "immediate"),
      recurringCount: conditionalCount(jobs.type, "recurring"),
      lowCount: conditionalCount(jobs.priority, "low"),
      normalCount: conditionalCount(jobs.priority, "normal"),
      highCount: conditionalCount(jobs.priority, "high"),
      criticalCount: conditionalCount(jobs.priority, "critical"),
    })
    .from(jobs)
    .where(baseWhere);

  // PostgreSQL count() returns strings at runtime, but Drizzle types them as numbers
  // We need to convert to ensure proper number types, hence the eslint-disable comments
  /* eslint-disable @typescript-eslint/no-unnecessary-type-conversion */
  const stats = {
    total: Number(result.total),
    byStatus: {
      pending: Number(result.pendingCount),
      running: Number(result.runningCount),
      completed: Number(result.completedCount),
      failed: Number(result.failedCount),
      cancelled: Number(result.cancelledCount),
      retrying: Number(result.retryingCount),
    } satisfies Record<JobStatus, number>,
    byType: {
      cron: Number(result.cronCount),
      scheduled: Number(result.scheduledCount),
      immediate: Number(result.immediateCount),
      recurring: Number(result.recurringCount),
    } satisfies Record<JobType, number>,
    byPriority: {
      low: Number(result.lowCount),
      normal: Number(result.normalCount),
      high: Number(result.highCount),
      critical: Number(result.criticalCount),
    } satisfies Record<Priority, number>,
  };
  /* eslint-enable @typescript-eslint/no-unnecessary-type-conversion */

  logger.info({ stats }, "Retrieved job statistics");
  return stats;
}
