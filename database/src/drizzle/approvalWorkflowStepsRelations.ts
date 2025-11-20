import { relations } from "drizzle-orm";
import { approvalWorkflowSteps } from "./approvalWorkflowSteps.js";
import { approvalWorkflows } from "./approvalWorkflows.js";

export const approvalWorkflowStepsRelations = relations(approvalWorkflowSteps, ({ one }) => ({
  workflow: one(approvalWorkflows, {
    fields: [approvalWorkflowSteps.workflowId],
    references: [approvalWorkflows.id],
  }),
}));
