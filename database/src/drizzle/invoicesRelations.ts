import { relations } from "drizzle-orm";
import { invoices, invoiceItems } from "./invoices.js";
import { organizations } from "./organizations.js";
import { contacts } from "./contacts.js";

export const invoicesRelations = relations(invoices, ({ one, many }) => ({
  organization: one(organizations, {
    fields: [invoices.organizationId],
    references: [organizations.id],
  }),
  customer: one(contacts, {
    fields: [invoices.customerId],
    references: [contacts.id],
    relationName: "customerInvoices",
  }),
  supplier: one(contacts, {
    fields: [invoices.supplierId],
    references: [contacts.id],
    relationName: "supplierInvoices",
  }),
  items: many(invoiceItems),
}));

export const invoiceItemsRelations = relations(invoiceItems, ({ one }) => ({
  invoice: one(invoices, {
    fields: [invoiceItems.invoiceId],
    references: [invoices.id],
  }),
}));
