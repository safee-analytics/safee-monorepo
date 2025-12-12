import { varchar, timestamp, boolean, text, uuid } from "drizzle-orm/pg-core";
import { identitySchema, idpk, localeEnum } from "./_common.js";

export const organizations = identitySchema.table("organizations", {
  id: idpk("id"),
  name: varchar("name", { length: 255 }).notNull(),
  slug: varchar("slug", { length: 100 }).notNull().unique(),
  logo: text("logo"),
  // Company Info
  address: text("address"),
  email: varchar("email", { length: 255 }),
  phone: varchar("phone", { length: 50 }),
  website: varchar("website", { length: 255 }),
  industry: varchar("industry", { length: 255 }),
  // Legal Info
  legalName: varchar("legal_name", { length: 255 }),
  businessNumber: varchar("business_number", { length: 100 }),
  gstNumber: varchar("gst_number", { length: 100 }),
  businessType: varchar("business_type", { length: 100 }),
  legalAddress: text("legal_address"),
  // Customer Contact
  customerEmail: varchar("customer_email", { length: 255 }),
  customerAddress: text("customer_address"),
  // Preferences
  fiscalYearStart: varchar("fiscal_year_start", { length: 20 }),
  currency: varchar("currency", { length: 10 }).default("QAR"),
  dateFormat: varchar("date_format", { length: 20 }).default("dd/mm/yyyy"),
  metadata: text("metadata"),
  defaultLocale: localeEnum("default_locale").default("en").notNull(),
  isActive: boolean("is_active").default(true).notNull(),
  encryptionEnabled: boolean("encryption_enabled").default(false).notNull(),
  encryptionEnabledAt: timestamp("encryption_enabled_at", { withTimezone: true }),
  encryptionEnabledBy: uuid("encryption_enabled_by"),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
  updatedAt: timestamp("updated_at", { withTimezone: true })
    .defaultNow()
    .$onUpdate(() => /* @__PURE__ */ new Date())
    .notNull(),
});
