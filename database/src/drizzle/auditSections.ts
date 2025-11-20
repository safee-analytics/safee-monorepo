import { uuid, varchar, timestamp, text, boolean, integer, jsonb, index } from "drizzle-orm/pg-core";
import { auditSchema, idpk } from "./_common.js";
import { auditScopes } from "./auditScopes.js";

/**
 * Audit sections table - Sections within an audit scope
 * Groups related procedures together
 */
export const auditSections = auditSchema.table(
  "audit_sections",
  {
    id: idpk("id"),
    scopeId: uuid("scope_id")
      .references(() => auditScopes.id, { onDelete: "cascade" })
      .notNull(),
    name: varchar("name", { length: 255 }).notNull(),
    description: text("description"),
    sortOrder: integer("sort_order").notNull().default(0),
    isCompleted: boolean("is_completed").notNull().default(false),
    settings: jsonb("settings").default({}).$type<{
      canAddProcedures?: boolean;
      canRemoveProcedures?: boolean;
      requiredAttachments?: number;
      allowObservations?: boolean;
      requireReview?: boolean;
    }>(),
    createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
    updatedAt: timestamp("updated_at", { withTimezone: true }).defaultNow().notNull(),
  },
  (table) => [
    index("audit_sections_scope_id_idx").on(table.scopeId),
    index("audit_sections_sort_order_idx").on(table.sortOrder),
  ],
);

export type AuditSection = typeof auditSections.$inferSelect;
export type NewAuditSection = typeof auditSections.$inferInsert;
