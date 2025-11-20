import { and, eq, gte, lte, desc, count } from "drizzle-orm";
import type { DrizzleClient } from "../index.js";
import { auditEvents } from "../drizzle/auditEvents.js";
import { users } from "../drizzle/users.js";
import type { EntityType, Action } from "../drizzle/_common.js";

export interface AuditLogFilters {
  entityType?: EntityType;
  entityId?: string;
  action?: Action;
  userId?: string;
  startDate?: string;
  endDate?: string;
  limit?: number;
  offset?: number;
}

export interface AuditLogWithUser {
  id: string;
  entityType: EntityType;
  entityId: string;
  action: Action;
  organizationId: string | null;
  userId: string | null;
  metadata: Record<string, unknown> | null;
  ipAddress: string | null;
  userAgent: string | null;
  createdAt: Date;
  user?: {
    id: string;
    name: string | null;
    email: string;
  } | null;
}

export async function getOrganizationAuditLogs(
  db: DrizzleClient,
  organizationId: string,
  filters: AuditLogFilters = {},
): Promise<{ logs: AuditLogWithUser[]; total: number }> {
  const conditions = [eq(auditEvents.organizationId, organizationId)];

  if (filters.entityType) {
    conditions.push(eq(auditEvents.entityType, filters.entityType));
  }
  if (filters.entityId) {
    conditions.push(eq(auditEvents.entityId, filters.entityId));
  }
  if (filters.action) {
    conditions.push(eq(auditEvents.action, filters.action));
  }
  if (filters.userId) {
    conditions.push(eq(auditEvents.userId, filters.userId));
  }
  if (filters.startDate) {
    conditions.push(gte(auditEvents.createdAt, new Date(filters.startDate)));
  }
  if (filters.endDate) {
    conditions.push(lte(auditEvents.createdAt, new Date(filters.endDate)));
  }

  const whereClause = and(...conditions);

  const [{ total }] = await db.select({ total: count() }).from(auditEvents).where(whereClause);

  const logs = await db
    .select({
      id: auditEvents.id,
      entityType: auditEvents.entityType,
      entityId: auditEvents.entityId,
      action: auditEvents.action,
      organizationId: auditEvents.organizationId,
      userId: auditEvents.userId,
      metadata: auditEvents.metadata,
      ipAddress: auditEvents.ipAddress,
      userAgent: auditEvents.userAgent,
      createdAt: auditEvents.createdAt,
      user: {
        id: users.id,
        name: users.name,
        email: users.email,
      },
    })
    .from(auditEvents)
    .leftJoin(users, eq(auditEvents.userId, users.id))
    .where(whereClause)
    .orderBy(desc(auditEvents.createdAt))
    .limit(filters.limit ?? 50)
    .offset(filters.offset ?? 0);

  return {
    logs: logs as AuditLogWithUser[],
    total,
  };
}

export async function getUserActivityLogs(
  db: DrizzleClient,
  userId: string,
  filters: AuditLogFilters = {},
): Promise<{ logs: AuditLogWithUser[]; total: number }> {
  const conditions = [eq(auditEvents.userId, userId)];

  if (filters.entityType) {
    conditions.push(eq(auditEvents.entityType, filters.entityType));
  }
  if (filters.action) {
    conditions.push(eq(auditEvents.action, filters.action));
  }
  if (filters.startDate) {
    conditions.push(gte(auditEvents.createdAt, new Date(filters.startDate)));
  }
  if (filters.endDate) {
    conditions.push(lte(auditEvents.createdAt, new Date(filters.endDate)));
  }

  const whereClause = and(...conditions);

  const [{ total }] = await db.select({ total: count() }).from(auditEvents).where(whereClause);

  const logs = await db
    .select({
      id: auditEvents.id,
      entityType: auditEvents.entityType,
      entityId: auditEvents.entityId,
      action: auditEvents.action,
      organizationId: auditEvents.organizationId,
      userId: auditEvents.userId,
      metadata: auditEvents.metadata,
      ipAddress: auditEvents.ipAddress,
      userAgent: auditEvents.userAgent,
      createdAt: auditEvents.createdAt,
      user: {
        id: users.id,
        name: users.name,
        email: users.email,
      },
    })
    .from(auditEvents)
    .leftJoin(users, eq(auditEvents.userId, users.id))
    .where(whereClause)
    .orderBy(desc(auditEvents.createdAt))
    .limit(filters.limit ?? 50)
    .offset(filters.offset ?? 0);

  return {
    logs: logs as AuditLogWithUser[],
    total,
  };
}

export async function createAuditLog(
  db: DrizzleClient,
  data: {
    entityType: EntityType;
    entityId: string;
    action: Action;
    organizationId?: string;
    userId?: string;
    metadata?: Record<string, unknown>;
    ipAddress?: string;
    userAgent?: string;
  },
): Promise<void> {
  await db.insert(auditEvents).values({
    entityType: data.entityType,
    entityId: data.entityId,
    action: data.action,
    organizationId: data.organizationId ?? null,
    userId: data.userId ?? null,
    metadata: data.metadata ?? null,
    ipAddress: data.ipAddress ?? null,
    userAgent: data.userAgent ?? null,
  });
}

export function exportAuditLogsToCSV(logs: AuditLogWithUser[]): string {
  const headers = [
    "ID",
    "Entity Type",
    "Entity ID",
    "Action",
    "Organization ID",
    "User ID",
    "User Name",
    "User Email",
    "IP Address",
    "User Agent",
    "Created At",
  ];

  const rows = logs.map((log) => [
    log.id,
    log.entityType,
    log.entityId,
    log.action,
    log.organizationId ?? "",
    log.userId ?? "",
    log.user?.name ?? "",
    log.user?.email ?? "",
    log.ipAddress ?? "",
    log.userAgent ?? "",
    log.createdAt.toISOString(),
  ]);

  const csvContent = [
    headers.join(","),
    ...rows.map((row) => row.map((cell) => `"${cell.replace(/"/g, '""')}"`).join(",")),
  ].join("\n");

  return csvContent;
}

export function exportAuditLogsToJSON(logs: AuditLogWithUser[]): string {
  return JSON.stringify(logs, null, 2);
}
