import { pgTable, uuid, varchar, integer, timestamp, boolean } from "drizzle-orm/pg-core";
import { salesSchema, idpk } from "./_common.js";
import { organizations } from "./organizations.js";

export const crmContacts = salesSchema.table("contacts", {
  id: idpk("id"),

  organizationId: uuid("organization_id")
    .notNull()
    .references(() => organizations.id, { onDelete: "cascade" }),

  odooPartnerId: integer("odoo_partner_id").notNull(),

  name: varchar("name", { length: 255 }).notNull(),
  isCompany: boolean("is_company").default(false),
  email: varchar("email", { length: 255 }),
  phone: varchar("phone", { length: 50 }),
  mobile: varchar("mobile", { length: 50 }),
  website: varchar("website", { length: 255 }),

  street: varchar("street", { length: 255 }),
  street2: varchar("street2", { length: 255 }),
  city: varchar("city", { length: 100 }),
  stateId: integer("state_id"),
  countryId: integer("country_id"),
  zip: varchar("zip", { length: 20 }),

  vat: varchar("vat", { length: 50 }),
  industryId: integer("industry_id"),

  isCustomer: boolean("is_customer").default(false),
  isSupplier: boolean("is_supplier").default(false),

  active: boolean("active").default(true).notNull(),

  lastSyncedAt: timestamp("last_synced_at", { withTimezone: true }),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).defaultNow().notNull(),
});
