import { relations } from "drizzle-orm";
import { approvalWorkflows } from "./approvalWorkflows.js";
import { approvalWorkflowSteps } from "./approvalWorkflowSteps.js";
import { approvalRequests } from "./approvalRequests.js";
import { approvalSteps } from "./approvalSteps.js";
import { approvalRules } from "./approvalRules.js";
import { organizations } from "./organizations.js";
import { users } from "./users.js";

export const approvalWorkflowsRelations = relations(approvalWorkflows, ({ one, many }) => ({
  organization: one(organizations, {
    fields: [approvalWorkflows.organizationId],
    references: [organizations.id],
  }),
  steps: many(approvalWorkflowSteps),
  requests: many(approvalRequests),
  rules: many(approvalRules),
}));

export const approvalWorkflowStepsRelations = relations(approvalWorkflowSteps, ({ one }) => ({
  workflow: one(approvalWorkflows, {
    fields: [approvalWorkflowSteps.workflowId],
    references: [approvalWorkflows.id],
  }),
}));

export const approvalRequestsRelations = relations(approvalRequests, ({ one, many }) => ({
  workflow: one(approvalWorkflows, {
    fields: [approvalRequests.workflowId],
    references: [approvalWorkflows.id],
  }),
  requestedByUser: one(users, {
    fields: [approvalRequests.requestedBy],
    references: [users.id],
  }),
  steps: many(approvalSteps),
}));

export const approvalStepsRelations = relations(approvalSteps, ({ one }) => ({
  request: one(approvalRequests, {
    fields: [approvalSteps.requestId],
    references: [approvalRequests.id],
  }),
  approver: one(users, {
    fields: [approvalSteps.approverId],
    references: [users.id],
  }),
  delegatedToUser: one(users, {
    fields: [approvalSteps.delegatedTo],
    references: [users.id],
  }),
}));

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
