import { uuid, varchar, text, integer, timestamp } from "drizzle-orm/pg-core";
import { salesSchema, idpk, activityStateEnum } from "./_common.js";
import { organizations } from "./organizations.js";
import { crmLeads } from "./crmLeads.js";

export const crmActivities = salesSchema.table("activities", {
  id: idpk("id"),

  organizationId: uuid("organization_id")
    .notNull()
    .references(() => organizations.id, { onDelete: "cascade" }),

  odooActivityId: integer("odoo_activity_id").notNull(),

  leadId: uuid("lead_id").references(() => crmLeads.id, { onDelete: "cascade" }),

  activityTypeId: integer("activity_type_id"),
  summary: varchar("summary", { length: 255 }),
  note: text("note"),

  dateDue: timestamp("date_due", { withTimezone: true }),
  userId: integer("user_id"),

  state: activityStateEnum("state"),

  lastSyncedAt: timestamp("last_synced_at", { withTimezone: true }),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
  updatedAt: timestamp("updated_at", { withTimezone: true })
    .defaultNow()
    .$onUpdate(() => /* @__PURE__ */ new Date())
    .notNull(),
});
