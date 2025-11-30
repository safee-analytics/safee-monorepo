import { relations } from "drizzle-orm";
import { auditPlans } from "./auditPlans.js";
import { cases } from "./cases.js";
import { users } from "./users.js";
import { organizations } from "./organizations.js";

export const auditPlansRelations = relations(auditPlans, ({ one }) => ({
  case: one(cases, {
    fields: [auditPlans.caseId],
    references: [cases.id],
  }),
  creator: one(users, {
    fields: [auditPlans.createdBy],
    references: [users.id],
    relationName: "auditPlanCreator",
  }),
  organization: one(organizations, {
    fields: [auditPlans.organizationId],
    references: [organizations.id],
  }),
}));
