import { relations } from "drizzle-orm";
import { contacts } from "./contacts.js";
import { organizations } from "./organizations.js";
import { deals } from "./deals.js";
import { invoices } from "./invoices.js";

export const contactsRelations = relations(contacts, ({ one, many }) => ({
  organization: one(organizations, {
    fields: [contacts.organizationId],
    references: [organizations.id],
  }),
  deals: many(deals),
  customerInvoices: many(invoices, {
    relationName: "customerInvoices",
  }),
  supplierInvoices: many(invoices, {
    relationName: "supplierInvoices",
  }),
}));
