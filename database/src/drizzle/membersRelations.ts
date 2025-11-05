import { relations } from "drizzle-orm";
import { members } from "./members.js";
import { organizations } from "./organizations.js";
import { users } from "./users.js";

export const membersRelations = relations(members, ({ one }) => ({
  organization: one(organizations, {
    fields: [members.organizationId],
    references: [organizations.id],
  }),
  user: one(users, {
    fields: [members.userId],
    references: [users.id],
  }),
}));
