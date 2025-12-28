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

export const jobNameEnum = jobsSchema.enum("job_name", [
  "send_email",
  "encrypt_file",
  "rotate_encryption_key",
  "reencrypt_files",

  // BullMQ jobs
  "calculate_analytics",
  "send_bulk_email",
  "sync_odoo",
  "generate_report",
  "odoo_provisioning",
  "install_odoo_modules",
]);

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

export const documentTypeEnum = systemSchema.enum("document_type", [
  "invoice",
  "bill",
  "quote",
  "purchase_order",
  "delivery_note",
  "receipt",
  "credit_note",
  "debit_note",
  "payslip",
  "contract",
  "payment_receipt",
  "refund",
]);

export const notificationTypeEnum = systemSchema.enum("notification_type", [
  // General
  "deadline",
  "review",
  "completed",
  "team",
  "assignment",
  "comment",
  "mention",
  "reminder",
  "alert",
  "warning",
  "error",
  "info",
  "success",
  // Approvals & Requests (Generic workflow)
  "approval_requested",
  "approval_approved",
  "approval_rejected",
  "approval_cancelled",
  "approval_reminder",
  "request_submitted",
  "request_updated",
  "request_withdrawn",
  "request_escalated",
  // Cases/Audit
  "case_update",
  "case_created",
  "case_assigned",
  "case_completed",
  "case_overdue",
  "case_archived",
  "document",
  "document_uploaded",
  "document_reviewed",
  "document_approved",
  "document_rejected",
  // Accounting/Hisabiq
  "invoice_created",
  "invoice_submitted",
  "invoice_approved",
  "invoice_rejected",
  "invoice_paid",
  "invoice_overdue",
  "invoice_cancelled",
  "payment_received",
  "payment_sent",
  "payment_failed",
  "payment_pending",
  "bill_created",
  "bill_submitted",
  "bill_approved",
  "bill_rejected",
  "bill_paid",
  "bill_overdue",
  "expense_submitted",
  "expense_approved",
  "expense_rejected",
  "expense_reimbursed",
  // HR/Kanz
  "leave_requested",
  "leave_approved",
  "leave_rejected",
  "leave_cancelled",
  "leave_reminder",
  "payslip_generated",
  "payslip_available",
  "contract_created",
  "contract_expiring",
  "contract_expired",
  "contract_renewed",
  "employee_onboarded",
  "employee_offboarded",
  "timesheet_submitted",
  "timesheet_approved",
  "timesheet_rejected",
  // CRM/Nisbah
  "deal_created",
  "deal_updated",
  "deal_won",
  "deal_lost",
  "deal_assigned",
  "contact_added",
  "contact_updated",
  "task_assigned",
  "task_completed",
  "task_overdue",
  "task_reminder",
  "meeting_scheduled",
  "meeting_reminder",
  "meeting_cancelled",
  "follow_up_due",
]);

export const relatedEntityTypeEnum = systemSchema.enum("related_entity_type", [
  // Audit
  "case",
  "document",
  "audit_template",
  "audit_scope",
  "audit_section",
  "audit_procedure",
  // Approvals
  "approval",
  "approval_request",
  // Accounting
  "invoice",
  "bill",
  "payment",
  "account",
  "journal",
  // HR
  "employee",
  "payslip",
  "leave_request",
  "leave_allocation",
  "contract",
  "department",
  // CRM
  "contact",
  "deal",
  "task",
  // General
  "organization",
  "user",
  "team",
]);

export const invitationStatusEnum = identitySchema.enum("invitation_status", [
  "pending",
  "accepted",
  "rejected",
  "expired",
  "canceled",
]);

export const accountTypeEnum = financeSchema.enum("account_type", [
  "asset",
  "liability",
  "equity",
  "income",
  "expense",
]);

export const accountInternalTypeEnum = financeSchema.enum("account_internal_type", [
  "receivable",
  "payable",
  "liquidity",
  "other",
]);

export const auditTypeEnum = auditSchema.enum("audit_type", [
  "ICV",
  "ISO_9001",
  "ISO_14001",
  "ISO_45001",
  "financial_audit",
  "internal_audit",
  "compliance_audit",
  "operational_audit",
]);

export const auditCategoryEnum = auditSchema.enum("audit_category", [
  "certification",
  "financial",
  "operational",
  "compliance",
]);

export const caseEntityTypeEnum = auditSchema.enum("case_entity_type", [
  "case",
  "scope",
  "section",
  "procedure",
  "document",
  "note",
]);

export const caseActionEnum = auditSchema.enum("case_action", [
  "created",
  "updated",
  "deleted",
  "completed",
  "archived",
  "assigned",
  "unassigned",
]);

export const themeEnum = identitySchema.enum("theme", ["light", "dark", "auto"]);

export const colorSchemeEnum = identitySchema.enum("color_scheme", [
  "blue",
  "purple",
  "green",
  "orange",
  "red",
  "teal",
]);

export const fontSizeEnum = identitySchema.enum("font_size", ["small", "medium", "large"]);

export const densityEnum = identitySchema.enum("density", ["compact", "comfortable", "spacious"]);

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
export type DocumentType = (typeof documentTypeEnum.enumValues)[number];
export type NotificationType = (typeof notificationTypeEnum.enumValues)[number];
export type RelatedEntityType = (typeof relatedEntityTypeEnum.enumValues)[number];
export type InvitationStatus = (typeof invitationStatusEnum.enumValues)[number];
export type AccountType = (typeof accountTypeEnum.enumValues)[number];
export type AccountInternalType = (typeof accountInternalTypeEnum.enumValues)[number];
export type AuditType = (typeof auditTypeEnum.enumValues)[number];
export type AuditCategory = (typeof auditCategoryEnum.enumValues)[number];
export type CaseEntityType = (typeof caseEntityTypeEnum.enumValues)[number];
export type CaseAction = (typeof caseActionEnum.enumValues)[number];
export type Theme = (typeof themeEnum.enumValues)[number];
export type ColorScheme = (typeof colorSchemeEnum.enumValues)[number];
export type FontSize = (typeof fontSizeEnum.enumValues)[number];
export type Density = (typeof densityEnum.enumValues)[number];
export type ResourceType = (typeof resourceTypeEnum.enumValues)[number];
export type HRSectionType = (typeof hrSectionTypeEnum.enumValues)[number];

export const employeeTypeEnum = hrSchema.enum("employee_type", [
  "employee",
  "student",
  "trainee",
  "contractor",
  "freelance",
]);

export const genderEnum = hrSchema.enum("gender", ["male", "female", "other"]);

export const maritalStatusEnum = hrSchema.enum("marital_status", [
  "single",
  "married",
  "cohabitant",
  "widower",
  "divorced",
]);

export const payslipStateEnum = hrSchema.enum("payslip_state", ["draft", "verify", "done", "cancel"]);

export const leaveStateEnum = hrSchema.enum("leave_state", [
  "draft",
  "confirm",
  "refuse",
  "validate1",
  "validate",
  "cancel",
]);

export const contractStateEnum = hrSchema.enum("contract_state", ["draft", "open", "close", "cancel"]);

export const wageTypeEnum = hrSchema.enum("wage_type", ["monthly", "hourly"]);

export const allocationUnitEnum = hrSchema.enum("allocation_unit", ["day", "hour"]);

export const requestUnitEnum = hrSchema.enum("request_unit", ["day", "hour"]);

export const timeTypeEnum = hrSchema.enum("time_type", ["leave", "other"]);

export const validationTypeEnum = hrSchema.enum("validation_type", [
  "no_validation",
  "hr",
  "manager",
  "both",
]);

export const payslipLineCategoryEnum = hrSchema.enum("payslip_line_category", [
  "ALW",
  "DED",
  "BASIC",
  "GROSS",
  "NET",
]);

export const hrSectionTypeEnum = hrSchema.enum("section_type", ["self_service", "management"]);

export const resourceTypeEnum = identitySchema.enum("resource_type", [
  "audit_case",
  "accounting_client",
  "crm_lead",
  "crm_deal",
  "hr_department",
]);

export const taxAmountTypeEnum = financeSchema.enum("tax_amount_type", ["percent", "division", "fixed"]);

export const taxScopeEnum = financeSchema.enum("tax_scope", ["sale", "purchase", "none"]);

export const taxTypeEnum = financeSchema.enum("tax_type", ["sale", "purchase", "none"]);

// Odoo invoice/payment enums
export const odooMoveTypeEnum = financeSchema.enum("odoo_move_type", [
  "out_invoice",
  "out_refund",
  "in_invoice",
  "in_refund",
  "entry",
]);

export const odooInvoiceStateEnum = financeSchema.enum("odoo_invoice_state", ["draft", "posted", "cancel"]);

export const odooPaymentStateEnum = financeSchema.enum("odoo_payment_state", [
  "not_paid",
  "in_payment",
  "paid",
  "partial",
  "reversed",
]);

export const odooPaymentTypeEnum = financeSchema.enum("odoo_payment_type", [
  "inbound",
  "outbound",
  "transfer",
]);

export const odooPartnerTypeEnum = financeSchema.enum("odoo_partner_type", ["customer", "supplier"]);

export const activityStateEnum = salesSchema.enum("activity_state", ["planned", "today", "overdue", "done"]);

export type EmployeeType = (typeof employeeTypeEnum.enumValues)[number];
export type Gender = (typeof genderEnum.enumValues)[number];
export type MaritalStatus = (typeof maritalStatusEnum.enumValues)[number];
export type PayslipState = (typeof payslipStateEnum.enumValues)[number];
export type LeaveState = (typeof leaveStateEnum.enumValues)[number];
export type ContractState = (typeof contractStateEnum.enumValues)[number];
export type WageType = (typeof wageTypeEnum.enumValues)[number];
export type AllocationUnit = (typeof allocationUnitEnum.enumValues)[number];
export type RequestUnit = (typeof requestUnitEnum.enumValues)[number];
export type TimeType = (typeof timeTypeEnum.enumValues)[number];
export type ValidationType = (typeof validationTypeEnum.enumValues)[number];
export type PayslipLineCategory = (typeof payslipLineCategoryEnum.enumValues)[number];
export type TaxAmountType = (typeof taxAmountTypeEnum.enumValues)[number];
export type TaxScope = (typeof taxScopeEnum.enumValues)[number];
export type TaxType = (typeof taxTypeEnum.enumValues)[number];
export type ActivityState = (typeof activityStateEnum.enumValues)[number];

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
