import { relations } from "drizzle-orm";
import { caseAssignments } from "./caseAssignments.js";
import { cases } from "./cases.js";
import { users } from "./users.js";

/**
 * Relations for caseAssignments table
 */
export const caseAssignmentsRelations = relations(caseAssignments, ({ one }) => ({
  case: one(cases, {
    fields: [caseAssignments.caseId],
    references: [cases.id],
  }),
  user: one(users, {
    fields: [caseAssignments.userId],
    references: [users.id],
    relationName: "caseAssignmentUser",
  }),
  assigner: one(users, {
    fields: [caseAssignments.assignedBy],
    references: [users.id],
    relationName: "caseAssignmentAssigner",
  }),
}));
