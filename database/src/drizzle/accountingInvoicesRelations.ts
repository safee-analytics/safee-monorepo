import { relations } from "drizzle-orm";
import { accountingInvoices } from "./accountingInvoices.js";
import { organizations } from "./organizations.js";

export const accountingInvoicesRelations = relations(accountingInvoices, ({ one }) => ({
  organization: one(organizations, {
    fields: [accountingInvoices.organizationId],
    references: [organizations.id],
  }),
}));
