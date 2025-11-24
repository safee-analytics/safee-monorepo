import { relations } from "drizzle-orm";
import { hrLeaveAllocations } from "./hrLeaveAllocations.js";
import { hrEmployees } from "./hrEmployees.js";
import { hrLeaveTypes } from "./hrLeaveTypes.js";
import { organizations } from "./organizations.js";

export const hrLeaveAllocationsRelations = relations(hrLeaveAllocations, ({ one }) => ({
  organization: one(organizations, {
    fields: [hrLeaveAllocations.organizationId],
    references: [organizations.id],
  }),
  employee: one(hrEmployees, {
    fields: [hrLeaveAllocations.employeeId],
    references: [hrEmployees.id],
  }),
  leaveType: one(hrLeaveTypes, {
    fields: [hrLeaveAllocations.leaveTypeId],
    references: [hrLeaveTypes.id],
  }),
}));
