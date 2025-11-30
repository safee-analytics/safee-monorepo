import { relations } from "drizzle-orm";
import { crmLostReasons } from "./crmLostReasons.js";
import { organizations } from "./organizations.js";

export const crmLostReasonsRelations = relations(crmLostReasons, ({ one }) => ({
  organization: one(organizations, {
    fields: [crmLostReasons.organizationId],
    references: [organizations.id],
  }),
}));
