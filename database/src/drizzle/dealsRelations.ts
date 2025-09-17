import { relations } from "drizzle-orm";
import { deals } from "./deals.js";
import { organizations } from "./organizations.js";
import { contacts } from "./contacts.js";

export const dealsRelations = relations(deals, ({ one }) => ({
  organization: one(organizations, {
    fields: [deals.organizationId],
    references: [organizations.id],
  }),
  contact: one(contacts, {
    fields: [deals.contactId],
    references: [contacts.id],
  }),
}));
