import { uuid, varchar, timestamp, date, index, unique } from "drizzle-orm/pg-core";
import { auditSchema, idpk, caseStatusEnum, casePriorityEnum, auditTypeEnum } from "./_common.js";
import { organizations } from "./organizations.js";
import { users } from "./users.js";

export const cases = auditSchema.table(
  "cases",
  {
    id: idpk("id"),
    organizationId: uuid("organization_id")
      .references(() => organizations.id, { onDelete: "cascade" })
      .notNull(),
    caseNumber: varchar("case_number", { length: 50 }).notNull(),
    clientName: varchar("client_name", { length: 255 }).notNull(),
    auditType: auditTypeEnum("audit_type").notNull(),
    status: caseStatusEnum("status").notNull().default("pending"),
    priority: casePriorityEnum("priority").notNull().default("medium"),
    dueDate: date("due_date", { mode: "date" }),
    completedDate: date("completed_date", { mode: "date" }),
    createdBy: uuid("created_by")
      .references(() => users.id, { onDelete: "restrict", onUpdate: "cascade" })
      .notNull(),
    createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
    updatedAt: timestamp("updated_at", { withTimezone: true }).defaultNow().notNull(),
  },
  (table) => [
    unique("cases_org_case_number_unique").on(table.organizationId, table.caseNumber),
    index("cases_organization_id_idx").on(table.organizationId),
    index("cases_status_idx").on(table.status),
    index("cases_audit_type_idx").on(table.auditType),
    index("cases_created_by_idx").on(table.createdBy),
  ],
);

export type Case = typeof cases.$inferSelect;
export type NewCase = typeof cases.$inferInsert;
