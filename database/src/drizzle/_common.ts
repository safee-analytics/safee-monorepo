import { pgSchema, uuid } from "drizzle-orm/pg-core";
import { sql } from "drizzle-orm";

export function idpk(name: string) {
  return uuid(name)
    .default(sql`uuid_generate_v4()`)
    .primaryKey()
    .notNull();
}

export const identitySchema = pgSchema("identity");
export const financeSchema = pgSchema("finance");
export const hrSchema = pgSchema("hr");
export const salesSchema = pgSchema("sales");
export const systemSchema = pgSchema("system");
export const jobsSchema = pgSchema("jobs");

export const userRoleEnum = identitySchema.enum("user_role", ["ADMIN", "MANAGER", "EMPLOYEE", "ACCOUNTANT"]);

export const invoiceTypeEnum = financeSchema.enum("invoice_type", ["SALES", "PURCHASE"]);

export const contactTypeEnum = salesSchema.enum("contact_type", ["LEAD", "PROSPECT", "CUSTOMER", "SUPPLIER"]);

export const dealStageEnum = salesSchema.enum("deal_stage", [
  "LEAD",
  "QUALIFIED",
  "PROPOSAL",
  "NEGOTIATION",
  "CLOSED_WON",
  "CLOSED_LOST",
]);

// Job system enums
export const jobStatusEnum = jobsSchema.enum("job_status", [
  "pending",
  "running",
  "completed",
  "failed",
  "cancelled",
  "retrying",
]);

export const jobTypeEnum = jobsSchema.enum("job_type", ["cron", "scheduled", "immediate", "recurring"]);

export const priorityEnum = jobsSchema.enum("priority", ["low", "normal", "high", "critical"]);

export const logLevelEnum = jobsSchema.enum("log_level", ["debug", "info", "warn", "error"]);

// Audit system enums
export const entityTypeEnum = systemSchema.enum("entity_type", [
  "job",
  "invoice",
  "user",
  "organization",
  "employee",
  "contact",
  "deal",
]);

export const actionEnum = systemSchema.enum("action", [
  "created",
  "updated",
  "deleted",
  "completed",
  "failed",
  "started",
  "cancelled",
  "retrying",
]);

// Permission action enum
export const permissionActionEnum = identitySchema.enum("permission_action", [
  "create",
  "read",
  "update",
  "delete",
  "list",
  "export",
  "import",
  "approve",
  "reject",
  "manage",
]);

// Permission resource enum
export const permissionResourceEnum = identitySchema.enum("permission_resource", [
  "users",
  "roles",
  "permissions",
  "organizations",
  "invoices",
  "accounts",
  "contacts",
  "deals",
  "employees",
  "payroll",
  "reports",
  "settings",
  "audit",
]);

export type InvoiceType = (typeof invoiceTypeEnum.enumValues)[number];
export type ContactType = (typeof contactTypeEnum.enumValues)[number];
export type DealStage = (typeof dealStageEnum.enumValues)[number];
export type UserRole = (typeof userRoleEnum.enumValues)[number];
export type JobStatus = (typeof jobStatusEnum.enumValues)[number];
export type JobType = (typeof jobTypeEnum.enumValues)[number];
export type Priority = (typeof priorityEnum.enumValues)[number];
export type LogLevel = (typeof logLevelEnum.enumValues)[number];
export type EntityType = (typeof entityTypeEnum.enumValues)[number];
export type Action = (typeof actionEnum.enumValues)[number];
export type PermissionAction = (typeof permissionActionEnum.enumValues)[number];
export type PermissionResource = (typeof permissionResourceEnum.enumValues)[number];

export const schemas = {
  identity: identitySchema,
  finance: financeSchema,
  hr: hrSchema,
  sales: salesSchema,
  system: systemSchema,
  jobs: jobsSchema,
} as const;
