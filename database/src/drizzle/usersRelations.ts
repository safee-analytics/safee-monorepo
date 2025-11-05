import { relations } from "drizzle-orm";
import { users } from "./users.js";
import { organizations } from "./organizations.js";
import { userServices } from "./userServices.js";
import { members } from "./members.js";

export const usersRelations = relations(users, ({ one, many }) => ({
  organization: one(organizations, {
    fields: [users.organizationId],
    references: [organizations.id],
  }),
  userServices: many(userServices),
  members: many(members),
}));
