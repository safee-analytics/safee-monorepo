import { relations } from "drizzle-orm";
import { accountingTaxes } from "./accountingTaxes.js";
import { organizations } from "./organizations.js";

export const accountingTaxesRelations = relations(accountingTaxes, ({ one }) => ({
  organization: one(organizations, {
    fields: [accountingTaxes.organizationId],
    references: [organizations.id],
  }),
}));
