import { uuid, varchar, timestamp, text, jsonb, index, boolean } from "drizzle-orm/pg-core";
import { casesSchema, idpk, caseTypeEnum } from "./_common.js";
import { organizations } from "./organizations.js";

type TemplateSection = {
  id: string;
  type: "cover_page" | "text" | "metrics_table" | "findings_list" | "chart" | "appendix";
  title?: string;
  dataSource?: string;
  config?: Record<string, unknown>;
};

export const auditReportTemplates = casesSchema.table(
  "audit_report_templates",
  {
    id: idpk("id"),
    name: varchar("name", { length: 255 }).notNull(),
    caseType: caseTypeEnum("case_type"),
    description: text("description"),
    templateStructure: jsonb("template_structure").notNull().$type<{
      sections: TemplateSection[];
      styles?: Record<string, unknown>;
      metadata?: Record<string, unknown>;
    }>(),
    isDefault: boolean("is_default").notNull().default(false),
    isActive: boolean("is_active").notNull().default(true),
    organizationId: uuid("organization_id").references(() => organizations.id, { onDelete: "cascade" }),
    createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
    updatedAt: timestamp("updated_at", { withTimezone: true })
      .defaultNow()
      .$onUpdate(() => /* @__PURE__ */ new Date())
      .notNull(),
  },
  (table) => [
    index("audit_report_templates_case_type_idx").on(table.caseType),
    index("audit_report_templates_active_idx").on(table.isActive),
    index("audit_report_templates_org_idx").on(table.organizationId),
  ],
);

export type AuditReportTemplate = typeof auditReportTemplates.$inferSelect;
export type NewAuditReportTemplate = typeof auditReportTemplates.$inferInsert;
