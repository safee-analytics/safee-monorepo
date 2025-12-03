import { uuid, varchar, text, decimal, integer, timestamp, date } from "drizzle-orm/pg-core";
import {
  financeSchema,
  idpk,
  odooMoveTypeEnum,
  odooInvoiceStateEnum,
  odooPaymentStateEnum,
} from "./_common.js";
import { organizations } from "./organizations.js";

export const accountingInvoices = financeSchema.table("invoices", {
  id: idpk("id"),

  organizationId: uuid("organization_id")
    .notNull()
    .references(() => organizations.id, { onDelete: "cascade" }),

  odooInvoiceId: integer("odoo_invoice_id").notNull(),

  // Invoice identification
  name: varchar("name", { length: 255 }), // Invoice number
  moveType: odooMoveTypeEnum("move_type").notNull(), // out_invoice, out_refund, in_invoice, in_refund, entry

  // Partner information
  partnerId: integer("partner_id"), // Odoo partner ID
  partnerName: varchar("partner_name", { length: 255 }),

  // Dates
  invoiceDate: date("invoice_date"),
  invoiceDateDue: date("invoice_date_due"),

  // Reference and origin
  paymentReference: varchar("payment_reference", { length: 255 }),
  invoiceOrigin: varchar("invoice_origin", { length: 255 }),

  // Currency
  currencyId: integer("currency_id"),
  currencyName: varchar("currency_name", { length: 50 }),

  // Amounts
  amountUntaxed: decimal("amount_untaxed", { precision: 15, scale: 2 }),
  amountTax: decimal("amount_tax", { precision: 15, scale: 2 }),
  amountTotal: decimal("amount_total", { precision: 15, scale: 2 }),
  amountResidual: decimal("amount_residual", { precision: 15, scale: 2 }), // Remaining amount to pay

  // State
  state: odooInvoiceStateEnum("state"), // draft, posted, cancel
  paymentState: odooPaymentStateEnum("payment_state"), // not_paid, in_payment, paid, partial, reversed

  // Journal and company
  journalId: integer("journal_id"),
  journalName: varchar("journal_name", { length: 255 }),
  companyId: integer("company_id"),

  // Additional info
  narration: text("narration"), // Internal notes

  lastSyncedAt: timestamp("last_synced_at", { withTimezone: true }),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).defaultNow().notNull(),
});
