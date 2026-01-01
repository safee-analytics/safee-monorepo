import { uuid, varchar, timestamp, boolean, text, jsonb, index } from "drizzle-orm/pg-core";
import { casesSchema, idpk, caseTypeEnum } from "./_common.js";
import { organizations } from "./organizations.js";
import { users } from "./users.js";

export const workflowTemplates = casesSchema.table(
  "workflow_templates",
  {
    id: idpk("id"),
    organizationId: uuid("organization_id").references(() => organizations.id, { onDelete: "cascade" }),
    name: varchar("name", { length: 255 }).notNull(),
    description: text("description"),
    caseType: caseTypeEnum("case_type").notNull(),
    version: varchar("version", { length: 50 }).notNull().default("1.0"),
    isSystemTemplate: boolean("is_system_template").notNull().default(false),
    isActive: boolean("is_active").notNull().default(true),
    config: jsonb("config").notNull().$type<{
      settings?: Record<string, unknown>;
      variables?: Record<string, unknown>;
    }>(),
    createdBy: uuid("created_by").references(() => users.id, { onDelete: "restrict", onUpdate: "cascade" }),
    createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
    updatedAt: timestamp("updated_at", { withTimezone: true })
      .defaultNow()
      .$onUpdate(() => new Date())
      .notNull(),
  },
  (table) => [
    index("workflow_templates_organization_id_idx").on(table.organizationId),
    index("workflow_templates_case_type_idx").on(table.caseType),
    index("workflow_templates_is_active_idx").on(table.isActive),
    index("workflow_templates_is_system_template_idx").on(table.isSystemTemplate),
  ],
);

export type WorkflowTemplate = typeof workflowTemplates.$inferSelect;
export type NewWorkflowTemplate = typeof workflowTemplates.$inferInsert;
