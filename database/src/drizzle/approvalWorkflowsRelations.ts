import { relations } from "drizzle-orm";
import { approvalWorkflows } from "./approvalWorkflows.js";
import { approvalWorkflowSteps } from "./approvalWorkflowSteps.js";
import { approvalRequests } from "./approvalRequests.js";
import { approvalRules } from "./approvalRules.js";
import { organizations } from "./organizations.js";

export const approvalWorkflowsRelations = relations(approvalWorkflows, ({ one, many }) => ({
  organization: one(organizations, {
    fields: [approvalWorkflows.organizationId],
    references: [organizations.id],
  }),
  steps: many(approvalWorkflowSteps),
  requests: many(approvalRequests),
  rules: many(approvalRules),
}));
