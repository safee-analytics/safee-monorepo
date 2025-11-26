import { pgTable, uuid, varchar, text, decimal, integer, timestamp, boolean } from "drizzle-orm/pg-core";
import { salesSchema, idpk } from "./_common.js";
import { organizations } from "./organizations.js";

export const crmLeads = salesSchema.table("leads", {
  id: idpk("id"),

  organizationId: uuid("organization_id")
    .notNull()
    .references(() => organizations.id, { onDelete: "cascade" }),

  odooLeadId: integer("odoo_lead_id").notNull(),

  name: varchar("name", { length: 255 }).notNull(),
  type: varchar("type", { length: 20 }).notNull(),

  contactName: varchar("contact_name", { length: 255 }),
  emailFrom: varchar("email_from", { length: 255 }),
  phone: varchar("phone", { length: 50 }),

  partnerId: integer("partner_id"),
  stageId: integer("stage_id"),
  teamId: integer("team_id"),
  userId: integer("user_id"),

  expectedRevenue: decimal("expected_revenue", { precision: 15, scale: 2 }),
  recurringRevenue: decimal("recurring_revenue", { precision: 15, scale: 2 }),
  recurringPlan: integer("recurring_plan_id"),

  dateOpen: timestamp("date_open", { withTimezone: true }),
  dateDeadline: timestamp("date_deadline", { withTimezone: true }),
  dateClosed: timestamp("date_closed", { withTimezone: true }),

  priority: varchar("priority", { length: 10 }).default("0"),
  active: boolean("active").default(true).notNull(),

  description: text("description"),
  tagIds: integer("tag_ids").array(),
  lostReasonId: integer("lost_reason_id"),

  lastSyncedAt: timestamp("last_synced_at", { withTimezone: true }),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).defaultNow().notNull(),
});
