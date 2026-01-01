import { uuid, varchar, timestamp, text, jsonb, index } from "drizzle-orm/pg-core";
import { casesSchema, idpk, templateStatusEnum } from "./_common.js";
import { cases } from "./cases.js";
import { templates } from "./templates.js";
import { users } from "./users.js";

export const templateInstances = casesSchema.table(
  "template_instances",
  {
    id: idpk("id"),
    caseId: uuid("case_id")
      .references(() => cases.id, { onDelete: "cascade" })
      .notNull(),
    templateId: uuid("template_id").references(() => templates.id, { onDelete: "set null" }),
    stepExecutionId: uuid("step_execution_id"),
    name: varchar("name", { length: 255 }).notNull(),
    description: text("description"),
    status: templateStatusEnum("status").notNull().default("draft"),
    data: jsonb("data").notNull().$type<Record<string, unknown>>(),
    createdBy: uuid("created_by")
      .references(() => users.id, { onDelete: "restrict", onUpdate: "cascade" })
      .notNull(),
    completedBy: uuid("completed_by").references(() => users.id, {
      onDelete: "restrict",
      onUpdate: "cascade",
    }),
    archivedBy: uuid("archived_by").references(() => users.id, { onDelete: "restrict", onUpdate: "cascade" }),
    createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
    updatedAt: timestamp("updated_at", { withTimezone: true })
      .defaultNow()
      .$onUpdate(() => /* @__PURE__ */ new Date())
      .notNull(),
    completedAt: timestamp("completed_at", { withTimezone: true }),
    archivedAt: timestamp("archived_at", { withTimezone: true }),
  },
  (table) => [
    index("template_instances_case_id_idx").on(table.caseId),
    index("template_instances_template_id_idx").on(table.templateId),
    index("template_instances_step_execution_id_idx").on(table.stepExecutionId),
    index("template_instances_status_idx").on(table.status),
  ],
);

export type TemplateInstance = typeof templateInstances.$inferSelect;
export type NewTemplateInstance = typeof templateInstances.$inferInsert;
