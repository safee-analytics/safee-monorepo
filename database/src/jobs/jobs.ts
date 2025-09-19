import { eq, and, desc, asc, inArray, lte, or, isNull, lt } from "drizzle-orm";
import { DbDeps } from "../deps.js";
import { jobs } from "../drizzle/jobs.js";
import { jobDefinitions } from "../drizzle/jobDefinitions.js";
import { jobLogs } from "../drizzle/jobLogs.js";
import type { Job, NewJob } from "../drizzle/jobs.js";
import type { JobStatus, JobType, Priority } from "../drizzle/_common.js";

/**
 * Create a new job
 */
export async function createJob({ drizzle, logger }: DbDeps, data: NewJob): Promise<Job> {
  logger.info(
    {
      jobDefinitionId: data.jobDefinitionId,
      type: data.type,
      priority: data.priority,
    },
    "Creating job",
  );

  return drizzle.transaction(async (tx) => {
    // Verify job definition exists and is active
    const jobDef = await tx.query.jobDefinitions.findFirst({
      where: eq(jobDefinitions.id, data.jobDefinitionId),
    });

    if (!jobDef) {
      logger.error({ jobDefinitionId: data.jobDefinitionId }, "Job definition not found");
      throw new Error(`Job definition with ID '${data.jobDefinitionId}' not found`);
    }

    if (!jobDef.isActive) {
      logger.error({ jobDefinitionId: data.jobDefinitionId }, "Job definition is not active");
      throw new Error(`Job definition '${jobDef.name}' is not active`);
    }

    // Set defaults from job definition if not provided
    const jobData: NewJob = {
      ...data,
      maxRetries: data.maxRetries ?? jobDef.maxRetries,
      payload: data.payload ?? jobDef.defaultPayload,
    };

    const [result] = await tx.insert(jobs).values(jobData).returning();

    logger.info(
      {
        id: result.id,
        jobDefinitionId: result.jobDefinitionId,
        status: result.status,
      },
      "Job created successfully",
    );

    return result;
  });
}

/**
 * Get job by ID
 */
export async function getJobById({ drizzle, logger }: DbDeps, id: string): Promise<Job | undefined> {
  logger.debug({ id }, "Getting job by ID");

  const result = await drizzle.query.jobs.findFirst({
    where: eq(jobs.id, id),
    with: {
      definition: true,
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

/**
 * Get jobs by status
 */
export async function getJobsByStatus(
  { drizzle, logger }: DbDeps,
  status: JobStatus | JobStatus[],
): Promise<Job[]> {
  const statuses = Array.isArray(status) ? status : [status];
  logger.debug({ statuses }, "Getting jobs by status");

  return await drizzle.query.jobs.findMany({
    where: inArray(jobs.status, statuses),
    orderBy: [asc(jobs.priority), asc(jobs.scheduledFor), asc(jobs.createdAt)],
    with: {
      definition: true,
    },
  });
}

/**
 * Get pending jobs ready for execution
 */
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

  const results = await drizzle.query.jobs.findMany({
    where: whereCondition,
    orderBy: [asc(jobs.priority), asc(jobs.scheduledFor), asc(jobs.createdAt)],
    limit,
    with: {
      definition: true,
    },
  });

  logger.info({ count: results.length, limit }, "Retrieved pending jobs");
  return results;
}

/**
 * Get failed jobs that can be retried
 */
export async function getRetryableJobs({ drizzle, logger }: DbDeps, limit = 10): Promise<Job[]> {
  logger.debug({ limit }, "Getting retryable jobs");

  const results = await drizzle.query.jobs.findMany({
    where: and(eq(jobs.status, "failed"), lt(jobs.attempts, jobs.maxRetries)),
    orderBy: [asc(jobs.priority), asc(jobs.updatedAt)],
    limit,
    with: {
      definition: true,
    },
  });

  logger.info({ count: results.length }, "Retrieved retryable jobs");
  return results;
}

/**
 * Update job status
 */
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

/**
 * Start job execution
 */
export async function startJob({ drizzle, logger }: DbDeps, id: string): Promise<Job> {
  logger.info({ id }, "Starting job execution");

  return updateJobStatus({ drizzle, logger }, id, "running", {
    startedAt: new Date(),
    attempts: 1, // Increment attempts when starting
  });
}

/**
 * Complete job successfully
 */
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

/**
 * Fail job with error
 */
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

/**
 * Cancel job
 */
export async function cancelJob({ drizzle, logger }: DbDeps, id: string): Promise<Job> {
  logger.info({ id }, "Cancelling job");

  return updateJobStatus({ drizzle, logger }, id, "cancelled", {
    completedAt: new Date(),
  });
}

/**
 * Get job statistics
 */
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

  // This would require raw SQL or multiple queries
  // For now, returning a simple structure
  const allJobs = await drizzle.query.jobs.findMany({
    where: organizationId ? eq(jobs.organizationId, organizationId) : undefined,
    columns: { status: true, type: true, priority: true },
  });

  const stats = {
    total: allJobs.length,
    byStatus: {} as Record<JobStatus, number>,
    byType: {} as Record<JobType, number>,
    byPriority: {} as Record<Priority, number>,
  };

  // Count by categories
  for (const job of allJobs) {
    stats.byStatus[job.status] = stats.byStatus[job.status] + 1;
    stats.byType[job.type] = stats.byType[job.type] + 1;
    stats.byPriority[job.priority] = stats.byPriority[job.priority] + 1;
  }

  logger.info({ stats }, "Retrieved job statistics");
  return stats;
}
