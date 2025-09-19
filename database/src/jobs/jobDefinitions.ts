import { eq, asc } from "drizzle-orm";
import { DbDeps } from "../deps.js";
import { jobDefinitions } from "../drizzle/jobDefinitions.js";
import type { JobDefinition, NewJobDefinition } from "../drizzle/jobDefinitions.js";

/**
 * Create a new job definition
 */
export async function createJobDefinition(
  { drizzle, logger }: DbDeps,
  data: NewJobDefinition,
): Promise<JobDefinition> {
  logger.info({ name: data.name, handlerName: data.handlerName }, "Creating job definition");

  return drizzle.transaction(async (tx) => {
    // Check if job definition with this name already exists
    const existing = await tx.query.jobDefinitions.findFirst({
      where: eq(jobDefinitions.name, data.name),
    });

    if (existing) {
      logger.error({ name: data.name }, "Job definition with this name already exists");
      throw new Error(`Job definition with name '${data.name}' already exists`);
    }

    const [result] = await tx.insert(jobDefinitions).values(data).returning();

    logger.info({ id: result.id, name: result.name }, "Job definition created successfully");
    return result;
  });
}

/**
 * Get job definition by ID
 */
export async function getJobDefinitionById(
  { drizzle, logger }: DbDeps,
  id: string,
): Promise<JobDefinition | undefined> {
  logger.debug({ id }, "Getting job definition by ID");

  const result = await drizzle.query.jobDefinitions.findFirst({
    where: eq(jobDefinitions.id, id),
  });

  if (!result) {
    logger.warn({ id }, "Job definition not found");
  }

  return result;
}

/**
 * Get job definition by name
 */
export async function getJobDefinitionByName(
  { drizzle, logger }: DbDeps,
  name: string,
): Promise<JobDefinition | undefined> {
  logger.debug({ name }, "Getting job definition by name");

  return await drizzle.query.jobDefinitions.findFirst({
    where: eq(jobDefinitions.name, name),
  });
}

/**
 * Get job definition by handler name
 */
export async function getJobDefinitionByHandler(
  { drizzle, logger }: DbDeps,
  handlerName: string,
): Promise<JobDefinition | undefined> {
  logger.debug({ handlerName }, "Getting job definition by handler");

  return await drizzle.query.jobDefinitions.findFirst({
    where: eq(jobDefinitions.handlerName, handlerName),
  });
}

/**
 * List all active job definitions
 */
export async function listActiveJobDefinitions({ drizzle, logger }: DbDeps): Promise<JobDefinition[]> {
  logger.debug("Listing active job definitions");

  const results = await drizzle.query.jobDefinitions.findMany({
    where: eq(jobDefinitions.isActive, true),
    orderBy: asc(jobDefinitions.name),
  });

  logger.info({ count: results.length }, "Retrieved active job definitions");
  return results;
}

/**
 * List job definitions with pagination
 */
export async function listJobDefinitions(
  { drizzle, logger }: DbDeps,
  options: {
    page?: number;
    limit?: number;
    isActive?: boolean;
  } = {},
): Promise<JobDefinition[]> {
  const { page = 1, limit = 50, isActive } = options;
  const offset = (page - 1) * limit;

  logger.debug({ page, limit, isActive }, "Listing job definitions with pagination");

  const results = await drizzle.query.jobDefinitions.findMany({
    where: isActive !== undefined ? eq(jobDefinitions.isActive, isActive) : undefined,
    orderBy: asc(jobDefinitions.name),
    limit,
    offset,
  });

  logger.info({ count: results.length, page, limit }, "Retrieved job definitions");
  return results;
}

/**
 * Update job definition
 */
export async function updateJobDefinition(
  { drizzle, logger }: DbDeps,
  id: string,
  data: Partial<NewJobDefinition>,
): Promise<JobDefinition> {
  logger.info({ id, updates: Object.keys(data) }, "Updating job definition");

  return drizzle.transaction(async (tx) => {
    const existing = await tx.query.jobDefinitions.findFirst({
      where: eq(jobDefinitions.id, id),
    });

    if (!existing) {
      logger.error({ id }, "Job definition not found for update");
      throw new Error(`Job definition with ID '${id}' not found`);
    }

    const [result] = await tx
      .update(jobDefinitions)
      .set({ ...data, updatedAt: new Date() })
      .where(eq(jobDefinitions.id, id))
      .returning();

    logger.info({ id: result.id, name: result.name }, "Job definition updated successfully");
    return result;
  });
}

/**
 * Activate job definition
 */
export async function activateJobDefinition({ drizzle, logger }: DbDeps, id: string): Promise<JobDefinition> {
  logger.info({ id }, "Activating job definition");
  return updateJobDefinition({ drizzle, logger }, id, { isActive: true });
}

/**
 * Deactivate job definition
 */
export async function deactivateJobDefinition(
  { drizzle, logger }: DbDeps,
  id: string,
): Promise<JobDefinition> {
  logger.info({ id }, "Deactivating job definition");
  return updateJobDefinition({ drizzle, logger }, id, { isActive: false });
}

/**
 * Check if job definition exists by name
 */
export async function jobDefinitionExists({ drizzle, logger }: DbDeps, name: string): Promise<boolean> {
  logger.debug({ name }, "Checking if job definition exists");

  const result = await getJobDefinitionByName({ drizzle, logger }, name);
  return result !== undefined;
}
