import { eq, and, asc, lte, isNull, or } from "drizzle-orm";
import { DbDeps } from "../deps.js";
import { jobSchedules } from "../drizzle/jobSchedules.js";
import { jobDefinitions } from "../drizzle/jobDefinitions.js";
import type { JobSchedule, NewJobSchedule } from "../drizzle/jobSchedules.js";

export async function createJobSchedule(
  { drizzle, logger }: DbDeps,
  data: NewJobSchedule,
): Promise<JobSchedule> {
  logger.info({ name: data.name, cronExpression: data.cronExpression }, "Creating job schedule");

  return drizzle.transaction(async (tx) => {
    const jobDef = await tx.query.jobDefinitions.findFirst({
      where: eq(jobDefinitions.id, data.jobDefinitionId),
    });

    if (!jobDef) {
      logger.error({ jobDefinitionId: data.jobDefinitionId }, "Job definition not found");
      throw new Error(`Job definition with ID '${data.jobDefinitionId}' not found`);
    }

    const existing = await tx.query.jobSchedules.findFirst({
      where: and(eq(jobSchedules.name, data.name), eq(jobSchedules.jobDefinitionId, data.jobDefinitionId)),
    });

    if (existing) {
      logger.error(
        { name: data.name, jobDefinitionId: data.jobDefinitionId },
        "Job schedule with this name already exists for this job definition",
      );
      throw new Error(`Job schedule with name '${data.name}' already exists for this job definition`);
    }

    const [result] = await tx.insert(jobSchedules).values(data).returning();

    logger.info({ id: result.id, name: result.name }, "Job schedule created successfully");
    return result;
  });
}

export async function getJobScheduleById(
  { drizzle, logger }: DbDeps,
  id: string,
): Promise<JobSchedule | undefined> {
  logger.debug({ id }, "Getting job schedule by ID");

  const result = await drizzle.query.jobSchedules.findFirst({
    where: eq(jobSchedules.id, id),
    with: {
      definition: true,
    },
  });

  if (!result) {
    logger.warn({ id }, "Job schedule not found");
  }

  return result;
}

export async function getJobSchedulesByDefinition(
  { drizzle, logger }: DbDeps,
  jobDefinitionId: string,
): Promise<JobSchedule[]> {
  logger.debug({ jobDefinitionId }, "Getting job schedules by definition");

  return await drizzle.query.jobSchedules.findMany({
    where: eq(jobSchedules.jobDefinitionId, jobDefinitionId),
    orderBy: asc(jobSchedules.name),
  });
}

export async function listActiveJobSchedules({ drizzle, logger }: DbDeps): Promise<JobSchedule[]> {
  logger.debug("Listing active job schedules");

  const results = await drizzle.query.jobSchedules.findMany({
    where: eq(jobSchedules.isActive, true),
    orderBy: asc(jobSchedules.nextRunAt),
    with: {
      definition: true,
    },
  });

  logger.info({ count: results.length }, "Retrieved active job schedules");
  return results;
}

export async function getSchedulesReadyToRun(
  { drizzle, logger }: DbDeps,
  checkTime: Date = new Date(),
): Promise<JobSchedule[]> {
  logger.debug({ checkTime }, "Getting schedules ready to run");

  const results = await drizzle.query.jobSchedules.findMany({
    where: and(
      eq(jobSchedules.isActive, true),
      or(lte(jobSchedules.nextRunAt, checkTime), isNull(jobSchedules.nextRunAt)),
    ),
    orderBy: asc(jobSchedules.nextRunAt),
    with: {
      definition: true,
    },
  });

  logger.info({ count: results.length, checkTime }, "Found schedules ready to run");
  return results;
}

export async function updateJobSchedule(
  { drizzle, logger }: DbDeps,
  id: string,
  data: Partial<NewJobSchedule>,
): Promise<JobSchedule> {
  logger.info({ id, updates: Object.keys(data) }, "Updating job schedule");

  return drizzle.transaction(async (tx) => {
    const existing = await tx.query.jobSchedules.findFirst({
      where: eq(jobSchedules.id, id),
    });

    if (!existing) {
      logger.error({ id }, "Job schedule not found for update");
      throw new Error(`Job schedule with ID '${id}' not found`);
    }

    const [result] = await tx
      .update(jobSchedules)
      .set({ ...data, updatedAt: new Date() })
      .where(eq(jobSchedules.id, id))
      .returning();

    logger.info({ id: result.id, name: result.name }, "Job schedule updated successfully");
    return result;
  });
}

export async function updateScheduleRunTime(
  { drizzle, logger }: DbDeps,
  id: string,
  lastRunAt: Date,
  nextRunAt?: Date,
): Promise<JobSchedule> {
  logger.debug({ id, lastRunAt, nextRunAt }, "Updating schedule run time");

  return updateJobSchedule({ drizzle, logger }, id, {
    lastRunAt,
    nextRunAt,
    updatedAt: new Date(),
  });
}

export async function activateJobSchedule({ drizzle, logger }: DbDeps, id: string): Promise<JobSchedule> {
  logger.info({ id }, "Activating job schedule");
  return updateJobSchedule({ drizzle, logger }, id, { isActive: true });
}

export async function deactivateJobSchedule({ drizzle, logger }: DbDeps, id: string): Promise<JobSchedule> {
  logger.info({ id }, "Deactivating job schedule");
  return updateJobSchedule({ drizzle, logger }, id, { isActive: false });
}

export async function deleteJobSchedule({ drizzle, logger }: DbDeps, id: string): Promise<boolean> {
  logger.info({ id }, "Deleting job schedule");

  return drizzle.transaction(async (tx) => {
    const existing = await tx.query.jobSchedules.findFirst({
      where: eq(jobSchedules.id, id),
    });

    if (!existing) {
      logger.error({ id }, "Job schedule not found for deletion");
      return false;
    }

    await tx.delete(jobSchedules).where(eq(jobSchedules.id, id));

    logger.info({ id }, "Job schedule deleted successfully");
    return true;
  });
}
