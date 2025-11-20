import { relations } from "drizzle-orm";
import { teamMembers } from "./teamMembers.js";
import { teams } from "./teams.js";
import { users } from "./users.js";

export const teamMembersRelations = relations(teamMembers, ({ one }) => ({
  team: one(teams, {
    fields: [teamMembers.teamId],
    references: [teams.id],
  }),
  user: one(users, {
    fields: [teamMembers.userId],
    references: [users.id],
  }),
}));
