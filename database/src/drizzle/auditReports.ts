import { uuid, varchar, timestamp, text, jsonb, index } from "drizzle-orm/pg-core";
import { casesSchema, idpk } from "./_common.js";
import { cases } from "./cases.js";
import { auditReportTemplates } from "./auditReportTemplates.js";
import { users } from "./users.js";

export const reportStatusEnum = casesSchema.enum("report_status", ["generating", "ready", "failed"]);

export const auditReports = casesSchema.table(
  "audit_reports",
  {
    id: idpk("id"),
    caseId: uuid("case_id")
      .references(() => cases.id, { onDelete: "cascade" })
      .notNull(),
    templateId: uuid("template_id").references(() => auditReportTemplates.id, { onDelete: "restrict" }),
    title: varchar("title", { length: 500 }).notNull(),
    status: reportStatusEnum("status").notNull().default("generating"),
    generatedData: jsonb("generated_data").$type<Record<string, unknown>>(),
    settings: jsonb("settings").$type<{
      dateRange?: { start: string; end: string };
      includeSections?: string[];
      customizations?: Record<string, unknown>;
    }>(),
    filePath: text("file_path"),
    generatedAt: timestamp("generated_at", { withTimezone: true }),
    generatedBy: uuid("generated_by")
      .references(() => users.id, { onDelete: "restrict", onUpdate: "cascade" })
      .notNull(),
    createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
    updatedAt: timestamp("updated_at", { withTimezone: true })
      .defaultNow()
      .$onUpdate(() => /* @__PURE__ */ new Date())
      .notNull(),
  },
  (table) => [
    index("audit_reports_case_id_idx").on(table.caseId),
    index("audit_reports_status_idx").on(table.status),
    index("audit_reports_generated_by_idx").on(table.generatedBy),
  ],
);

export type AuditReport = typeof auditReports.$inferSelect;
export type NewAuditReport = typeof auditReports.$inferInsert;
