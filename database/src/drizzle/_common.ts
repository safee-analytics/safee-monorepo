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
export const auditSchema = pgSchema("audit");
export const odooSchema = pgSchema("odoo");

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

export const jobStatusEnum = jobsSchema.enum("job_status", [
  "pending",
  "running",
  "completed",
  "failed",
  "cancelled",
  "retrying",
]);

export const jobTypeEnum = jobsSchema.enum("job_type", ["cron", "scheduled", "immediate", "recurring"]);

export const jobNameEnum = jobsSchema.enum("job_name", ["send_email"]);

export const priorityEnum = jobsSchema.enum("priority", ["low", "normal", "high", "critical"]);

export const logLevelEnum = jobsSchema.enum("log_level", ["debug", "info", "warn", "error"]);

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

export const loginMethodEnum = identitySchema.enum("login_method", ["password", "sso", "mfa"]);

export const revokedReasonEnum = identitySchema.enum("revoked_reason", [
  "logout",
  "timeout",
  "admin",
  "security",
  "new_device",
]);

export const identifierTypeEnum = identitySchema.enum("identifier_type", ["email", "ip"]);

export const eventTypeEnum = identitySchema.enum("event_type", [
  "login_success",
  "login_failed",
  "logout",
  "password_changed",
  "password_change_failed",
  "password_reset_requested",
  "session_revoked",
  "permission_changed",
  "suspicious_activity",
  "account_locked",
  "account_unlocked",
]);

export const riskLevelEnum = identitySchema.enum("risk_level", ["low", "medium", "high", "critical"]);

export const localeEnum = identitySchema.enum("locale", ["en", "ar"]);

export const caseStatusEnum = auditSchema.enum("case_status", [
  "pending",
  "in-progress",
  "under-review",
  "completed",
  "overdue",
  "archived",
]);

export const casePriorityEnum = auditSchema.enum("case_priority", ["low", "medium", "high", "critical"]);

// Export enum values for frontend validation
export const CASE_STATUSES = caseStatusEnum.enumValues;
export const CASE_PRIORITIES = casePriorityEnum.enumValues;

export const auditStatusEnum = auditSchema.enum("audit_status", [
  "draft",
  "in-progress",
  "under-review",
  "completed",
  "archived",
]);

export const noteTypeEnum = auditSchema.enum("note_type", [
  "observation",
  "review_comment",
  "general",
  "memo",
]);

export const assignmentRoleEnum = auditSchema.enum("assignment_role", ["lead", "reviewer", "team_member"]);

export const approvalStatusEnum = systemSchema.enum("approval_status", [
  "pending",
  "approved",
  "rejected",
  "cancelled",
]);

export const odooOperationStatusEnum = odooSchema.enum("operation_status", [
  "processing",
  "success",
  "failed",
  "retrying",
]);

export const odooCircuitStateEnum = odooSchema.enum("circuit_state", ["CLOSED", "OPEN", "HALF_OPEN"]);

export type ApprovalStatus = (typeof approvalStatusEnum.enumValues)[number];
export type InvoiceType = (typeof invoiceTypeEnum.enumValues)[number];
export type ContactType = (typeof contactTypeEnum.enumValues)[number];
export type DealStage = (typeof dealStageEnum.enumValues)[number];
export type UserRole = (typeof userRoleEnum.enumValues)[number];
export type JobStatus = (typeof jobStatusEnum.enumValues)[number];
export type JobType = (typeof jobTypeEnum.enumValues)[number];
export type JobName = (typeof jobNameEnum.enumValues)[number];
export type Priority = (typeof priorityEnum.enumValues)[number];
export type LogLevel = (typeof logLevelEnum.enumValues)[number];
export type EntityType = (typeof entityTypeEnum.enumValues)[number];
export type Action = (typeof actionEnum.enumValues)[number];
export type PermissionAction = (typeof permissionActionEnum.enumValues)[number];
export type PermissionResource = (typeof permissionResourceEnum.enumValues)[number];
export type LoginMethod = (typeof loginMethodEnum.enumValues)[number];
export type RevokedReason = (typeof revokedReasonEnum.enumValues)[number];
export type IdentifierType = (typeof identifierTypeEnum.enumValues)[number];
export type EventType = (typeof eventTypeEnum.enumValues)[number];
export type RiskLevel = (typeof riskLevelEnum.enumValues)[number];
export type Locale = (typeof localeEnum.enumValues)[number];
export type CaseStatus = (typeof caseStatusEnum.enumValues)[number];
export type CasePriority = (typeof casePriorityEnum.enumValues)[number];
export type AuditStatus = (typeof auditStatusEnum.enumValues)[number];
export type NoteType = (typeof noteTypeEnum.enumValues)[number];
export type AssignmentRole = (typeof assignmentRoleEnum.enumValues)[number];
export type OdooOperationStatus = (typeof odooOperationStatusEnum.enumValues)[number];
export type OdooCircuitState = (typeof odooCircuitStateEnum.enumValues)[number];

export const schemas = {
  identity: identitySchema,
  finance: financeSchema,
  hr: hrSchema,
  sales: salesSchema,
  system: systemSchema,
  jobs: jobsSchema,
  audit: auditSchema,
  odoo: odooSchema,
} as const;
