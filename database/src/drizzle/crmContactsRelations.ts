import { relations } from "drizzle-orm";
import { crmContacts } from "./crmContacts.js";
import { organizations } from "./organizations.js";

export const crmContactsRelations = relations(crmContacts, ({ one }) => ({
  organization: one(organizations, {
    fields: [crmContacts.organizationId],
    references: [organizations.id],
  }),
}));
