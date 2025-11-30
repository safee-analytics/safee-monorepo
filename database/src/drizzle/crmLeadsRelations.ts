import { relations } from "drizzle-orm";
import { crmLeads } from "./crmLeads.js";
import { crmActivities } from "./crmActivities.js";
import { organizations } from "./organizations.js";

export const crmLeadsRelations = relations(crmLeads, ({ one, many }) => ({
  organization: one(organizations, {
    fields: [crmLeads.organizationId],
    references: [organizations.id],
  }),
  activities: many(crmActivities),
}));
