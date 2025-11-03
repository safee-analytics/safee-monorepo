import { text, timestamp, jsonb, index, uuid } from "drizzle-orm/pg-core";
import { idpk, systemSchema, entityTypeEnum, actionEnum } from "./_common.js";
import { organizations } from "./organizations.js";
import { users } from "./users.js";

export const auditEvents = systemSchema.table(
  "audit_events",
  {
    id: idpk("id"),
    entityType: entityTypeEnum("entity_type").notNull(),
    entityId: uuid("entity_id").notNull(),
    action: actionEnum("action").notNull(),
    organizationId: uuid("organization_id").references(() => organizations.id, {
      onDelete: "cascade",
      onUpdate: "cascade",
    }),
    userId: uuid("user_id").references(() => users.id, { onDelete: "cascade", onUpdate: "cascade" }),
    metadata: jsonb("metadata").$type<Record<string, unknown>>(), // Minimal context
    ipAddress: text("ip_address"),
    userAgent: text("user_agent"),
    createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
  },
  (table) => [
    index("audit_events_entity_idx").on(table.entityType, table.entityId),
    index("audit_events_org_idx").on(table.organizationId),
    index("audit_events_user_idx").on(table.userId),
    index("audit_events_action_idx").on(table.action),
    index("audit_events_created_at_idx").on(table.createdAt),
  ],
);

export type AuditEvent = typeof auditEvents.$inferSelect;
export type NewAuditEvent = typeof auditEvents.$inferInsert;
