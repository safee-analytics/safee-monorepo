import { uuid, varchar, timestamp, text, jsonb, index } from "drizzle-orm/pg-core";
import { auditSchema, idpk, auditStatusEnum } from "./_common.js";
import { cases } from "./cases.js";
import { auditTemplates } from "./auditTemplates.js";
import { users } from "./users.js";

/**
 * Audit scopes table - Contains the actual audit scope for a case
 * Applied from templates or created custom
 */
export const auditScopes = auditSchema.table(
  "audit_scopes",
  {
    id: idpk("id"),
    caseId: uuid("case_id")
      .references(() => cases.id, { onDelete: "cascade" })
      .notNull(),
    templateId: uuid("template_id").references(() => auditTemplates.id, { onDelete: "set null" }), // Optional: which template was used
    name: varchar("name", { length: 255 }).notNull(),
    description: text("description"),
    status: auditStatusEnum("status").notNull().default("draft"),
    metadata: jsonb("metadata").default({}).$type<Record<string, unknown>>(), // Flexible audit-type-specific data
    createdBy: uuid("created_by")
      .references(() => users.id, { onDelete: "restrict", onUpdate: "cascade" })
      .notNull(),
    completedBy: uuid("completed_by").references(() => users.id, {
      onDelete: "restrict",
      onUpdate: "cascade",
    }),
    archivedBy: uuid("archived_by").references(() => users.id, { onDelete: "restrict", onUpdate: "cascade" }),
    createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
    updatedAt: timestamp("updated_at", { withTimezone: true }).defaultNow().notNull(),
    completedAt: timestamp("completed_at", { withTimezone: true }),
    archivedAt: timestamp("archived_at", { withTimezone: true }),
  },
  (table) => [
    index("audit_scopes_case_id_idx").on(table.caseId),
    index("audit_scopes_template_id_idx").on(table.templateId),
    index("audit_scopes_status_idx").on(table.status),
  ],
);

export type AuditScope = typeof auditScopes.$inferSelect;
export type NewAuditScope = typeof auditScopes.$inferInsert;
