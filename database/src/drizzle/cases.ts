import { uuid, varchar, timestamp, date, text, index, unique } from "drizzle-orm/pg-core";
import { casesSchema, idpk, caseStatusEnum, casePriorityEnum, caseTypeEnum } from "./_common.js";
import { organizations } from "./organizations.js";
import { users } from "./users.js";
import { workflowTemplates } from "./workflowTemplates.js";

export const cases = casesSchema.table(
  "cases",
  {
    id: idpk("id"),
    organizationId: uuid("organization_id")
      .references(() => organizations.id, { onDelete: "cascade" })
      .notNull(),
    caseNumber: varchar("case_number", { length: 50 }).notNull(),
    title: varchar("title", { length: 255 }).notNull(),
    description: text("description"),
    caseType: caseTypeEnum("case_type").notNull(),
    status: caseStatusEnum("status").notNull().default("draft"),
    priority: casePriorityEnum("priority").notNull().default("medium"),
    workflowTemplateId: uuid("workflow_template_id").references(() => workflowTemplates.id, {
      onDelete: "restrict",
    }),
    dueDate: date("due_date", { mode: "date" }),
    completedDate: date("completed_date", { mode: "date" }),
    createdBy: uuid("created_by")
      .references(() => users.id, { onDelete: "restrict", onUpdate: "cascade" })
      .notNull(),
    createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
    updatedAt: timestamp("updated_at", { withTimezone: true })
      .defaultNow()
      .$onUpdate(() => /* @__PURE__ */ new Date())
      .notNull(),
  },
  (table) => [
    unique("cases_org_case_number_unique").on(table.organizationId, table.caseNumber),
    index("cases_organization_id_idx").on(table.organizationId),
    index("cases_status_idx").on(table.status),
    index("cases_case_type_idx").on(table.caseType),
    index("cases_workflow_template_id_idx").on(table.workflowTemplateId),
    index("cases_created_by_idx").on(table.createdBy),
  ],
);

export type Case = typeof cases.$inferSelect;
export type NewCase = typeof cases.$inferInsert;
