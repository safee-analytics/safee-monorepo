import { relations } from "drizzle-orm";
import { approvalRequests } from "./approvalRequests.js";
import { approvalWorkflows } from "./approvalWorkflows.js";
import { approvalSteps } from "./approvalSteps.js";
import { users } from "./users.js";

export const approvalRequestsRelations = relations(approvalRequests, ({ one, many }) => ({
  workflow: one(approvalWorkflows, {
    fields: [approvalRequests.workflowId],
    references: [approvalWorkflows.id],
  }),
  requestedByUser: one(users, {
    fields: [approvalRequests.requestedBy],
    references: [users.id],
    relationName: "approvalRequestUser",
  }),
  steps: many(approvalSteps),
}));
