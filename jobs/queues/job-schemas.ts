import { z } from "zod";

// Analytics Queue
export const AnalyticsJobSchema = z.discriminatedUnion("type", [
  z.object({
    type: z.literal("calculate_dashboard_metrics"),
    organizationId: z.string().uuid(),
    dateRange: z.object({
      start: z.string().datetime(),
      end: z.string().datetime(),
    }),
  }),
  z.object({
    type: z.literal("aggregate_case_statistics"),
    caseId: z.string().uuid(),
    organizationId: z.string().uuid(),
  }),
  z.object({
    type: z.literal("calculate_organization_analytics"),
    organizationId: z.string().uuid(),
    metrics: z.array(z.enum(["cases", "users", "documents", "reports"])),
  }),
]);
export type AnalyticsJob = z.infer<typeof AnalyticsJobSchema>;

// Email Queue
export const EmailJobSchema = z.discriminatedUnion("type", [
  z.object({
    type: z.literal("send_transactional"),
    to: z.string().email(),
    template: z.string(),
    data: z.record(z.unknown()),
    organizationId: z.string().uuid().optional(),
  }),
  z.object({
    type: z.literal("send_notification"),
    userId: z.string().uuid(),
    notificationType: z.enum([
      "case_update",
      "case_assigned",
      "approval_request",
      "approval_approved",
      "approval_rejected",
      "report_ready",
      "document_uploaded",
    ]),
    payload: z.record(z.unknown()),
    organizationId: z.string().uuid(),
  }),
  z.object({
    type: z.literal("send_bulk_notification"),
    userIds: z.array(z.string().uuid()),
    notificationType: z.string(),
    payload: z.record(z.unknown()),
    organizationId: z.string().uuid(),
  }),
]);
export type EmailJob = z.infer<typeof EmailJobSchema>;

// Odoo Sync Queue
export const OdooSyncJobSchema = z.discriminatedUnion("type", [
  z.object({
    type: z.literal("sync_employee"),
    employeeId: z.string().uuid(),
    direction: z.enum(["to_odoo", "from_odoo", "bidirectional"]),
    organizationId: z.string().uuid(),
  }),
  z.object({
    type: z.literal("sync_invoice"),
    invoiceId: z.string().uuid(),
    direction: z.enum(["to_odoo", "from_odoo"]),
    organizationId: z.string().uuid(),
  }),
  z.object({
    type: z.literal("sync_department"),
    departmentId: z.string().uuid(),
    direction: z.enum(["to_odoo", "from_odoo", "bidirectional"]),
    organizationId: z.string().uuid(),
  }),
  z.object({
    type: z.literal("bulk_sync_employees"),
    employeeIds: z.array(z.string().uuid()).optional(),
    direction: z.enum(["to_odoo", "from_odoo", "bidirectional"]),
    organizationId: z.string().uuid(),
  }),
]);
export type OdooSyncJob = z.infer<typeof OdooSyncJobSchema>;

// Reports Queue
export const ReportsJobSchema = z.discriminatedUnion("type", [
  z.object({
    type: z.literal("generate_pdf"),
    reportId: z.string().uuid(),
    organizationId: z.string().uuid(),
    options: z
      .object({
        includeCharts: z.boolean().optional(),
        includeRawData: z.boolean().optional(),
      })
      .optional(),
  }),
  z.object({
    type: z.literal("generate_excel"),
    reportId: z.string().uuid(),
    organizationId: z.string().uuid(),
    options: z
      .object({
        includeFormulas: z.boolean().optional(),
        sheetNames: z.array(z.string()).optional(),
      })
      .optional(),
  }),
  z.object({
    type: z.literal("generate_audit_trail"),
    organizationId: z.string().uuid(),
    dateRange: z.object({
      start: z.string().datetime(),
      end: z.string().datetime(),
    }),
    entityTypes: z.array(z.enum(["case", "document", "user", "invoice", "employee"])).optional(),
  }),
  z.object({
    type: z.literal("generate_case_report"),
    caseId: z.string().uuid(),
    organizationId: z.string().uuid(),
    format: z.enum(["pdf", "excel"]),
  }),
]);
export type ReportsJob = z.infer<typeof ReportsJobSchema>;
