import { relations } from "drizzle-orm";
import { hrEmployees } from "./hrEmployees.js";
import { hrDepartments } from "./hrDepartments.js";
import { hrContracts } from "./hrContracts.js";
import { hrPayslips } from "./hrPayslips.js";
import { hrLeaveRequests } from "./hrLeaveRequests.js";
import { hrLeaveAllocations } from "./hrLeaveAllocations.js";
import { users } from "./users.js";
import { organizations } from "./organizations.js";

export const hrEmployeesRelations = relations(hrEmployees, ({ one, many }) => ({
  organization: one(organizations, {
    fields: [hrEmployees.organizationId],
    references: [organizations.id],
  }),
  user: one(users, {
    fields: [hrEmployees.userId],
    references: [users.id],
  }),
  department: one(hrDepartments, {
    fields: [hrEmployees.departmentId],
    references: [hrDepartments.id],
    relationName: "employeeDepartment",
  }),
  manager: one(hrEmployees, {
    fields: [hrEmployees.managerId],
    references: [hrEmployees.id],
    relationName: "employeeManager",
  }),
  currentContract: one(hrContracts, {
    fields: [hrEmployees.contractId],
    references: [hrContracts.id],
  }),

  directReports: many(hrEmployees, {
    relationName: "employeeManager",
  }),
  contracts: many(hrContracts),
  payslips: many(hrPayslips),
  leaveRequests: many(hrLeaveRequests),
  leaveAllocations: many(hrLeaveAllocations),
}));
