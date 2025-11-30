import { relations } from "drizzle-orm";
import { crmTeams } from "./crmTeams.js";
import { organizations } from "./organizations.js";

export const crmTeamsRelations = relations(crmTeams, ({ one }) => ({
  organization: one(organizations, {
    fields: [crmTeams.organizationId],
    references: [organizations.id],
  }),
}));
