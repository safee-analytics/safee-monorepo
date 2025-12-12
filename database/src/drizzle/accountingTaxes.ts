import { uuid, varchar, timestamp, index, integer, boolean, numeric } from "drizzle-orm/pg-core";
import { financeSchema, idpk, taxAmountTypeEnum, taxScopeEnum, taxTypeEnum } from "./_common.js";
import { organizations } from "./organizations.js";

export const accountingTaxes = financeSchema.table(
  "taxes",
  {
    id: idpk("id"),

    organizationId: uuid("organization_id")
      .references(() => organizations.id, { onDelete: "cascade", onUpdate: "cascade" })
      .notNull(),

    odooTaxId: integer("odoo_tax_id"),

    name: varchar("name", { length: 255 }).notNull(),
    description: varchar("description", { length: 255 }),

    amount: numeric("amount", { precision: 10, scale: 6 }).notNull(),
    amountType: taxAmountTypeEnum("amount_type").default("percent").notNull(),
    taxScope: taxScopeEnum("tax_scope"),

    typeOfTax: taxTypeEnum("type_of_tax"),
    taxGroup: varchar("tax_group", { length: 100 }),

    priceInclude: boolean("price_include").default(false),

    active: boolean("active").default(true).notNull(),

    companyId: integer("company_id"), // Odoo company ID

    lastSyncedAt: timestamp("last_synced_at", { withTimezone: true }),

    createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
    updatedAt: timestamp("updated_at", { withTimezone: true })
      .defaultNow()
      .$onUpdate(() => /* @__PURE__ */ new Date())
      .notNull(),
  },
  (table) => [
    index("taxes_organization_id_idx").on(table.organizationId),
    index("taxes_odoo_tax_id_idx").on(table.odooTaxId),
  ],
);
