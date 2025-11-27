import { relations } from "drizzle-orm";
import { auditPlanTemplates } from "./auditPlanTemplates.js";
import { organizations } from "./organizations.js";

export const auditPlanTemplatesRelations = relations(auditPlanTemplates, ({ one }) => ({
  organization: one(organizations, {
    fields: [auditPlanTemplates.organizationId],
    references: [organizations.id],
  }),
}));
