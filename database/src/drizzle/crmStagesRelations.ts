import { relations } from "drizzle-orm";
import { crmStages } from "./crmStages.js";
import { organizations } from "./organizations.js";

export const crmStagesRelations = relations(crmStages, ({ one }) => ({
  organization: one(organizations, {
    fields: [crmStages.organizationId],
    references: [organizations.id],
  }),
}));
