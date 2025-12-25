import { relations } from "drizzle-orm";
import { odooDatabases } from "./odooDatabases.js";
import { organizations } from "./organizations.js";
import { odooUsers } from "./odooUsers.js";

export const odooDatabasesRelations = relations(odooDatabases, ({ one, many }) => ({
  organization: one(organizations, {
    fields: [odooDatabases.organizationId],
    references: [organizations.id],
  }),
  odooUsers: many(odooUsers),
}));
