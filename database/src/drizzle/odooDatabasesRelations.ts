import { relations } from "drizzle-orm";
import { odooDatabases } from "./odooDatabases.js";
import { organizations } from "./organizations.js";

export const odooDatabasesRelations = relations(odooDatabases, ({ one }) => ({
  organization: one(organizations, {
    fields: [odooDatabases.organizationId],
    references: [organizations.id],
  }),
}));
