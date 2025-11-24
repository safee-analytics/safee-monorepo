import { relations } from "drizzle-orm";
import { hrLeaveRequests } from "./hrLeaveRequests.js";
import { hrEmployees } from "./hrEmployees.js";
import { hrLeaveTypes } from "./hrLeaveTypes.js";
import { hrDepartments } from "./hrDepartments.js";
import { organizations } from "./organizations.js";

export const hrLeaveRequestsRelations = relations(hrLeaveRequests, ({ one }) => ({
  organization: one(organizations, {
    fields: [hrLeaveRequests.organizationId],
    references: [organizations.id],
  }),
  employee: one(hrEmployees, {
    fields: [hrLeaveRequests.employeeId],
    references: [hrEmployees.id],
  }),
  leaveType: one(hrLeaveTypes, {
    fields: [hrLeaveRequests.leaveTypeId],
    references: [hrLeaveTypes.id],
  }),
  manager: one(hrEmployees, {
    fields: [hrLeaveRequests.managerId],
    references: [hrEmployees.id],
  }),
  department: one(hrDepartments, {
    fields: [hrLeaveRequests.departmentId],
    references: [hrDepartments.id],
  }),
}));
