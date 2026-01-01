import { relations } from "drizzle-orm";
import { resourceAssignments } from "./resourceAssignments.js";
import { organizations } from "./organizations.js";
import { users } from "./users.js";

export const resourceAssignmentsRelations = relations(resourceAssignments, ({ one }) => ({
  organization: one(organizations, {
    fields: [resourceAssignments.organizationId],
    references: [organizations.id],
  }),
  user: one(users, {
    fields: [resourceAssignments.userId],
    references: [users.id],
  }),
  assignedByUser: one(users, {
    fields: [resourceAssignments.assignedBy],
    references: [users.id],
  }),
}));
