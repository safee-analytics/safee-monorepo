import { relations } from "drizzle-orm";
import { connectors } from "./connectors.js";
import { organizations } from "./organizations.js";
import { users } from "./users.js";

export const connectorsRelations = relations(connectors, ({ one }) => ({
  organization: one(organizations, {
    fields: [connectors.organizationId],
    references: [organizations.id],
  }),
  creator: one(users, {
    fields: [connectors.createdBy],
    references: [users.id],
    relationName: "connectorCreator",
  }),
  updater: one(users, {
    fields: [connectors.updatedBy],
    references: [users.id],
    relationName: "connectorUpdater",
  }),
}));
