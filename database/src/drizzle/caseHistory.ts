import { uuid, varchar, timestamp, jsonb, index } from "drizzle-orm/pg-core";
import { auditSchema, idpk, caseEntityTypeEnum, caseActionEnum } from "./_common.js";
import { cases } from "./cases.js";
import { users } from "./users.js";

export const caseHistory = auditSchema.table(
  "case_history",
  {
    id: idpk("id"),
    caseId: uuid("case_id")
      .references(() => cases.id, { onDelete: "cascade" })
      .notNull(),
    entityType: caseEntityTypeEnum("entity_type").notNull(),
    entityId: uuid("entity_id").notNull(), // ID of the changed entity
    action: caseActionEnum("action").notNull(),
    changesBefore: jsonb("changes_before").$type<Record<string, unknown>>(), // State before change
    changesAfter: jsonb("changes_after").$type<Record<string, unknown>>(), // State after change
    changedBy: uuid("changed_by")
      .references(() => users.id, { onDelete: "restrict", onUpdate: "cascade" })
      .notNull(),
    changedAt: timestamp("changed_at", { withTimezone: true }).defaultNow().notNull(),
  },
  (table) => [
    index("case_history_case_id_idx").on(table.caseId),
    index("case_history_entity_type_idx").on(table.entityType),
    index("case_history_entity_id_idx").on(table.entityId),
    index("case_history_changed_at_idx").on(table.changedAt),
  ],
);

export type CaseHistory = typeof caseHistory.$inferSelect;
export type NewCaseHistory = typeof caseHistory.$inferInsert;
