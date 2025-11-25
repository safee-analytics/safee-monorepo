import { uuid, varchar, timestamp, index, integer, boolean } from "drizzle-orm/pg-core";
import { financeSchema, idpk, accountTypeEnum, accountInternalTypeEnum } from "./_common.js";
import { organizations } from "./organizations.js";

export const accounts = financeSchema.table(
  "accounts",
  {
    id: idpk("id"),

    organizationId: uuid("organization_id")
      .references(() => organizations.id, { onDelete: "cascade", onUpdate: "cascade" })
      .notNull(),

    odooAccountId: integer("odoo_account_id"),

    code: varchar("code", { length: 50 }).notNull(),
    nameEn: varchar("name_en", { length: 255 }).notNull(),
    nameAr: varchar("name_ar", { length: 255 }),

    // Account Type
    accountType: accountTypeEnum("account_type").notNull(),
    internalType: accountInternalTypeEnum("internal_type"),

    // Hierarchy
    parentId: uuid("parent_id"), // Self-reference for account hierarchy

    // Configuration
    reconcile: boolean("reconcile").default(false), // Can be reconciled
    deprecated: boolean("deprecated").default(false),

    // Currency
    currencyId: integer("currency_id"), // Odoo currency ID

    // Company
    companyId: integer("company_id"), // Odoo company ID

    // Sync tracking
    lastSyncedAt: timestamp("last_synced_at", { withTimezone: true }),

    createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
    updatedAt: timestamp("updated_at", { withTimezone: true }).defaultNow().notNull(),
  },
  (table) => [
    index("accounts_organization_id_idx").on(table.organizationId),
    index("accounts_odoo_account_id_idx").on(table.odooAccountId),
  ],
);
