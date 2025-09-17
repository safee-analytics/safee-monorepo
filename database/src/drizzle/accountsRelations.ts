import { relations } from "drizzle-orm";
import { accounts } from "./accounts.js";
import { organizations } from "./organizations.js";

export const accountsRelations = relations(accounts, ({ one, many }) => ({
  organization: one(organizations, {
    fields: [accounts.organizationId],
    references: [organizations.id],
  }),
  parent: one(accounts, {
    fields: [accounts.parentId],
    references: [accounts.id],
    relationName: "accountHierarchy",
  }),
  children: many(accounts, {
    relationName: "accountHierarchy",
  }),
}));
