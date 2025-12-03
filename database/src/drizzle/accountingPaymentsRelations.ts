import { relations } from "drizzle-orm";
import { accountingPayments } from "./accountingPayments.js";
import { organizations } from "./organizations.js";

export const accountingPaymentsRelations = relations(accountingPayments, ({ one }) => ({
  organization: one(organizations, {
    fields: [accountingPayments.organizationId],
    references: [organizations.id],
  }),
}));
