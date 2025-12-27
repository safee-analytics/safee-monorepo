import { z } from "zod";

// Analytics Queue
export const AnalyticsJobSchema = z.discriminatedUnion("type", [
  z.object({
    type: z.literal("calculate_dashboard_metrics"),
    organizationId: z.uuid(),
    dateRange: z.object({
      start: z.iso.datetime(),
      end: z.iso.datetime(),
    }),
  }),
  z.object({
    type: z.literal("aggregate_case_statistics"),
    caseId: z.uuid(),
    organizationId: z.uuid(),
  }),
  z.object({
    type: z.literal("calculate_organization_analytics"),
    organizationId: z.uuid(),
    metrics: z.array(z.enum(["cases", "users", "documents", "reports"])),
  }),
]);
export type AnalyticsJob = z.infer<typeof AnalyticsJobSchema>;

// Email Queue
export const EmailJobSchema = z.discriminatedUnion("type", [
  z.object({
    type: z.literal("send_transactional"),
    to: z.email(),
    template: z.string(),
    data: z.record(z.string(), z.unknown()),
    organizationId: z.uuid().optional(),
  }),
  z.object({
    type: z.literal("send_notification"),
    userId: z.uuid(),
    notificationType: z.enum([
      "case_update",
      "case_assigned",
      "approval_request",
      "approval_approved",
      "approval_rejected",
      "report_ready",
      "document_uploaded",
    ]),
    payload: z.record(z.string(), z.unknown()),
    organizationId: z.uuid(),
  }),
  z.object({
    type: z.literal("send_bulk_notification"),
    userIds: z.array(z.uuid()),
    notificationType: z.string(),
    payload: z.record(z.string(), z.unknown()),
    organizationId: z.uuid(),
  }),
]);
export type EmailJob = z.infer<typeof EmailJobSchema>;

// Odoo Sync Queue
export const OdooSyncJobSchema = z.discriminatedUnion("type", [
  z.object({
    type: z.literal("sync_employee"),
    employeeId: z.uuid(),
    direction: z.enum(["to_odoo", "from_odoo", "bidirectional"]),
    organizationId: z.uuid(),
  }),
  z.object({
    type: z.literal("sync_invoice"),
    invoiceId: z.uuid(),
    direction: z.enum(["to_odoo", "from_odoo"]),
    organizationId: z.uuid(),
  }),
  z.object({
    type: z.literal("sync_department"),
    departmentId: z.uuid(),
    direction: z.enum(["to_odoo", "from_odoo", "bidirectional"]),
    organizationId: z.uuid(),
  }),
  z.object({
    type: z.literal("bulk_sync_employees"),
    employeeIds: z.array(z.uuid()).optional(),
    direction: z.enum(["to_odoo", "from_odoo", "bidirectional"]),
    organizationId: z.uuid(),
  }),
]);
export type OdooSyncJob = z.infer<typeof OdooSyncJobSchema>;

// Reports Queue
export const ReportsJobSchema = z.discriminatedUnion("type", [
  z.object({
    type: z.literal("generate_pdf"),
    reportId: z.uuid(),
    organizationId: z.uuid(),
    options: z
      .object({
        includeCharts: z.boolean().optional(),
        includeRawData: z.boolean().optional(),
      })
      .optional(),
  }),
  z.object({
    type: z.literal("generate_excel"),
    reportId: z.uuid(),
    organizationId: z.uuid(),
    options: z
      .object({
        includeFormulas: z.boolean().optional(),
        sheetNames: z.array(z.string()).optional(),
      })
      .optional(),
  }),
  z.object({
    type: z.literal("generate_audit_trail"),
    organizationId: z.uuid(),
    dateRange: z.object({
      start: z.iso.datetime(),
      end: z.iso.datetime(),
    }),
    entityTypes: z.array(z.enum(["case", "document", "user", "invoice", "employee"])).optional(),
  }),
  z.object({
    type: z.literal("generate_case_report"),
    caseId: z.uuid(),
    organizationId: z.uuid(),
    format: z.enum(["pdf", "excel"]),
  }),
]);
export type ReportsJob = z.infer<typeof ReportsJobSchema>;

// Email Jobs Queue (transactional emails)
const EmailAddressSchema = z.object({
  email: z.email(),
  name: z.string().optional(),
});

export const SendEmailJobSchema = z
  .object({
    type: z.literal("send_email"),
    to: z.array(EmailAddressSchema).min(1),
    cc: z.array(EmailAddressSchema).optional(),
    bcc: z.array(EmailAddressSchema).optional(),
    template: z
      .object({
        name: z.enum([
          "welcome",
          "passwordReset",
          "otp",
          "magicLink",
          "invitation",
          "changeEmail",
          "deleteAccount",
          "emailVerification",
        ]),
        variables: z.record(z.string(), z.string()),
      })
      .optional(),
    subject: z.string().optional(),
    html: z.string().optional(),
    text: z.string().optional(),
    locale: z.enum(["en", "ar"]).default("en"),
    organizationId: z.uuid().optional(),
  })
  .refine((data) => data.template ?? (data.subject && (data.html ?? data.text)), {
    message: "Must provide either template or subject+content",
  });
export type SendEmailJob = z.infer<typeof SendEmailJobSchema>;

// Encryption Queue
export const EncryptFileJobSchema = z.object({
  type: z.literal("encrypt_file"),
  fileId: z.uuid(),
  organizationId: z.uuid(),
  encryptedBy: z.uuid(), // userId
});
export type EncryptFileJob = z.infer<typeof EncryptFileJobSchema>;

// Key Rotation Queue
export const RotateEncryptionKeyJobSchema = z.object({
  type: z.literal("rotate_encryption_key"),
  organizationId: z.uuid(),
  rotatedBy: z.uuid(), // userId
});
export type RotateEncryptionKeyJob = z.infer<typeof RotateEncryptionKeyJobSchema>;
