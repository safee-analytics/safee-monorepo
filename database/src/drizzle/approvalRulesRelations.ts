import { relations } from "drizzle-orm";
import { approvalRules } from "./approvalRules.js";
import { organizations } from "./organizations.js";
import { approvalWorkflows } from "./approvalWorkflows.js";

export const approvalRulesRelations = relations(approvalRules, ({ one }) => ({
  organization: one(organizations, {
    fields: [approvalRules.organizationId],
    references: [organizations.id],
  }),
  workflow: one(approvalWorkflows, {
    fields: [approvalRules.workflowId],
    references: [approvalWorkflows.id],
  }),
}));
