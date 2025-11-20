import { eq, and, desc, gte, lte, inArray } from "drizzle-orm";
import { DbDeps } from "../deps.js";
import { auditEvents } from "../drizzle/auditEvents.js";
import type { AuditEvent, NewAuditEvent } from "../drizzle/auditEvents.js";
import type { EntityType, Action } from "../drizzle/_common.js";

export async function createAuditEvent(
  { drizzle, logger }: DbDeps,
  data: NewAuditEvent,
): Promise<AuditEvent> {
  logger.debug(
    {
      entityType: data.entityType,
      entityId: data.entityId,
      action: data.action,
      userId: data.userId,
    },
    "Creating audit event",
  );

  const [result] = await drizzle.insert(auditEvents).values(data).returning();

  logger.debug({ id: result.id }, "Audit event created");
  return result;
}

export async function getAuditEventsForEntity(
  { drizzle, logger }: DbDeps,
  entityType: EntityType,
  entityId: string,
  limit = 50,
): Promise<AuditEvent[]> {
  logger.debug({ entityType, entityId, limit }, "Getting audit events for entity");

  return await drizzle.query.auditEvents.findMany({
    where: and(eq(auditEvents.entityType, entityType), eq(auditEvents.entityId, entityId)),
    orderBy: desc(auditEvents.createdAt),
    limit,
    with: {
      user: true,
    },
  });
}

export async function getAuditEventsForOrganization(
  { drizzle, logger }: DbDeps,
  organizationId: string,
  options: {
    entityTypes?: EntityType[];
    actions?: Action[];
    userId?: string;
    startDate?: Date;
    endDate?: Date;
    limit?: number;
    offset?: number;
  } = {},
): Promise<AuditEvent[]> {
  const { entityTypes, actions, userId, startDate, endDate, limit = 100, offset = 0 } = options;

  logger.debug(
    {
      organizationId,
      entityTypes,
      actions,
      userId,
      startDate,
      endDate,
      limit,
      offset,
    },
    "Getting audit events for organization",
  );

  const whereConditions = [eq(auditEvents.organizationId, organizationId)];

  if (entityTypes?.length) {
    whereConditions.push(inArray(auditEvents.entityType, entityTypes));
  }

  if (actions?.length) {
    whereConditions.push(inArray(auditEvents.action, actions));
  }

  if (userId) {
    whereConditions.push(eq(auditEvents.userId, userId));
  }

  if (startDate) {
    whereConditions.push(gte(auditEvents.createdAt, startDate));
  }

  if (endDate) {
    whereConditions.push(lte(auditEvents.createdAt, endDate));
  }

  const results = await drizzle.query.auditEvents.findMany({
    where: and(...whereConditions),
    orderBy: desc(auditEvents.createdAt),
    limit,
    offset,
    with: {
      user: true,
    },
  });

  logger.info({ count: results.length, organizationId }, "Retrieved audit events for organization");
  return results;
}

export async function getRecentAuditEvents(
  { drizzle, logger }: DbDeps,
  limit = 50,
  organizationId?: string,
): Promise<AuditEvent[]> {
  logger.debug({ limit, organizationId }, "Getting recent audit events");

  const whereCondition = organizationId ? eq(auditEvents.organizationId, organizationId) : undefined;

  return await drizzle.query.auditEvents.findMany({
    where: whereCondition,
    orderBy: desc(auditEvents.createdAt),
    limit,
    with: {
      user: true,
      organization: true,
    },
  });
}

export async function logJobEvent(
  { drizzle, logger }: DbDeps,
  jobId: string,
  action: Action,
  metadata: Record<string, unknown> = {},
  userId?: string,
  organizationId?: string,
): Promise<AuditEvent> {
  logger.debug({ jobId, action, userId, organizationId }, "Logging job event");

  return createAuditEvent(
    { drizzle, logger },
    {
      entityType: "job",
      entityId: jobId,
      action,
      organizationId,
      userId,
      metadata,
      ipAddress: null,
      userAgent: null,
    },
  );
}

export async function cleanupOldAuditEvents({ drizzle, logger }: DbDeps, olderThan: Date): Promise<number> {
  logger.info({ olderThan }, "Cleaning up old audit events");

  const result = await drizzle.delete(auditEvents).where(lte(auditEvents.createdAt, olderThan));

  const deletedCount = result.rowCount ?? 0;
  logger.info({ deletedCount, olderThan }, "Cleaned up old audit events");

  return deletedCount;
}
