import { relations } from "drizzle-orm";
import { hrDepartments } from "./hrDepartments.js";
import { hrEmployees } from "./hrEmployees.js";
import { organizations } from "./organizations.js";

export const hrDepartmentsRelations = relations(hrDepartments, ({ one, many }) => ({
  organization: one(organizations, {
    fields: [hrDepartments.organizationId],
    references: [organizations.id],
  }),
  manager: one(hrEmployees, {
    fields: [hrDepartments.managerId],
    references: [hrEmployees.id],
  }),
  parentDepartment: one(hrDepartments, {
    fields: [hrDepartments.parentId],
    references: [hrDepartments.id],
    relationName: "departmentHierarchy",
  }),

  subDepartments: many(hrDepartments, {
    relationName: "departmentHierarchy",
  }),
  employees: many(hrEmployees, {
    relationName: "employeeDepartment",
  }),
}));
