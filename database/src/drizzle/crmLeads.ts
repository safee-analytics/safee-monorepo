import { uuid, varchar, text, decimal, integer, timestamp, boolean } from "drizzle-orm/pg-core";
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
  partnerName: varchar("partner_name", { length: 255 }),
  emailFrom: varchar("email_from", { length: 255 }),
  phone: varchar("phone", { length: 50 }),
  website: varchar("website", { length: 255 }),
  function: varchar("function", { length: 255 }),

  street: varchar("street", { length: 255 }),
  street2: varchar("street2", { length: 255 }),
  city: varchar("city", { length: 100 }),
  stateId: integer("state_id"),
  countryId: integer("country_id"),
  zip: varchar("zip", { length: 20 }),

  partnerId: integer("partner_id"),
  commercialPartnerId: integer("commercial_partner_id"),
  stageId: integer("stage_id"),
  teamId: integer("team_id"),
  userId: integer("user_id"),
  companyId: integer("company_id"),
  campaignId: integer("campaign_id"),
  sourceId: integer("source_id"),
  mediumId: integer("medium_id"),
  langId: integer("lang_id"),

  expectedRevenue: decimal("expected_revenue", { precision: 15, scale: 2 }),
  proratedRevenue: decimal("prorated_revenue", { precision: 15, scale: 2 }),
  recurringRevenue: decimal("recurring_revenue", { precision: 15, scale: 2 }),
  recurringPlan: integer("recurring_plan_id"),
  recurringRevenueMonthly: decimal("recurring_revenue_monthly", { precision: 15, scale: 2 }),

  probability: decimal("probability", { precision: 5, scale: 2 }),

  dateOpen: timestamp("date_open", { withTimezone: true }),
  dateDeadline: timestamp("date_deadline", { withTimezone: true }),
  dateClosed: timestamp("date_closed", { withTimezone: true }),
  dateConversion: timestamp("date_conversion", { withTimezone: true }),
  dateLastStageUpdate: timestamp("date_last_stage_update", { withTimezone: true }),

  priority: varchar("priority", { length: 10 }).default("0"),
  active: boolean("active").default(true).notNull(),

  description: text("description"),
  referred: varchar("referred", { length: 255 }),
  tagIds: integer("tag_ids").array(),
  lostReasonId: integer("lost_reason_id"),
  color: integer("color"),

  lastSyncedAt: timestamp("last_synced_at", { withTimezone: true }),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).defaultNow().notNull(),
});
