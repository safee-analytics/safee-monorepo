import { relations } from "drizzle-orm";
import { users } from "./users.js";
import { organizations } from "./organizations.js";

export const usersRelations = relations(users, ({ one }) => ({
  organization: one(organizations, {
    fields: [users.organizationId],
    references: [organizations.id],
  }),
}));
