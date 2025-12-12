import { uuid, varchar, decimal, integer, timestamp, date } from "drizzle-orm/pg-core";
import {
  financeSchema,
  idpk,
  odooPaymentTypeEnum,
  odooPartnerTypeEnum,
  odooInvoiceStateEnum,
} from "./_common.js";
import { organizations } from "./organizations.js";

export const accountingPayments = financeSchema.table("payments", {
  id: idpk("id"),

  organizationId: uuid("organization_id")
    .notNull()
    .references(() => organizations.id, { onDelete: "cascade" }),

  odooPaymentId: integer("odoo_payment_id").notNull(),

  // Payment type and partner
  paymentType: odooPaymentTypeEnum("payment_type").notNull(), // inbound, outbound, transfer
  partnerType: odooPartnerTypeEnum("partner_type").notNull(), // customer, supplier
  partnerId: integer("partner_id"), // Odoo partner ID
  partnerName: varchar("partner_name", { length: 255 }),

  // Amount and currency
  amount: decimal("amount", { precision: 15, scale: 2 }).notNull(),
  currencyId: integer("currency_id"),
  currencyName: varchar("currency_name", { length: 50 }),

  // Date and reference
  paymentDate: date("payment_date").notNull(),
  ref: varchar("ref", { length: 255 }), // Payment reference

  // Journal and payment method
  journalId: integer("journal_id"),
  journalName: varchar("journal_name", { length: 255 }),
  paymentMethodId: integer("payment_method_id"),
  paymentMethodName: varchar("payment_method_name", { length: 255 }),

  // Destination account
  destinationAccountId: integer("destination_account_id"),
  destinationAccountName: varchar("destination_account_name", { length: 255 }),

  // State (using invoice state enum since it has the same values)
  state: odooInvoiceStateEnum("state"), // draft, posted, cancel

  lastSyncedAt: timestamp("last_synced_at", { withTimezone: true }),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
  updatedAt: timestamp("updated_at", { withTimezone: true })
    .defaultNow()
    .$onUpdate(() => /* @__PURE__ */ new Date())
    .notNull(),
});
