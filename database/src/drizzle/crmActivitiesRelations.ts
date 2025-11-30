import { relations } from "drizzle-orm";
import { crmActivities } from "./crmActivities.js";
import { crmLeads } from "./crmLeads.js";
import { organizations } from "./organizations.js";

export const crmActivitiesRelations = relations(crmActivities, ({ one }) => ({
  organization: one(organizations, {
    fields: [crmActivities.organizationId],
    references: [organizations.id],
  }),
  lead: one(crmLeads, {
    fields: [crmActivities.leadId],
    references: [crmLeads.id],
  }),
}));
