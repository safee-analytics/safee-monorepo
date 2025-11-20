import { relations } from "drizzle-orm";
import { approvalSteps } from "./approvalSteps.js";
import { approvalRequests } from "./approvalRequests.js";
import { users } from "./users.js";

export const approvalStepsRelations = relations(approvalSteps, ({ one }) => ({
  request: one(approvalRequests, {
    fields: [approvalSteps.requestId],
    references: [approvalRequests.id],
  }),
  approver: one(users, {
    fields: [approvalSteps.approverId],
    references: [users.id],
    relationName: "approvalStepApprover",
  }),
  delegatedToUser: one(users, {
    fields: [approvalSteps.delegatedTo],
    references: [users.id],
    relationName: "approvalStepDelegatedTo",
  }),
}));
