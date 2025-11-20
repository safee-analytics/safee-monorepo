import { relations } from "drizzle-orm";
import { teams } from "./teams.js";
import { teamMembers } from "./teamMembers.js";
import { organizations } from "./organizations.js";

export const teamsRelations = relations(teams, ({ one, many }) => ({
  organization: one(organizations, {
    fields: [teams.organizationId],
    references: [organizations.id],
  }),
  members: many(teamMembers),
}));
