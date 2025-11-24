import { relations } from "drizzle-orm";
import { hrContracts } from "./hrContracts.js";
import { hrEmployees } from "./hrEmployees.js";
import { hrDepartments } from "./hrDepartments.js";
import { organizations } from "./organizations.js";

export const hrContractsRelations = relations(hrContracts, ({ one }) => ({
  organization: one(organizations, {
    fields: [hrContracts.organizationId],
    references: [organizations.id],
  }),
  employee: one(hrEmployees, {
    fields: [hrContracts.employeeId],
    references: [hrEmployees.id],
  }),
  department: one(hrDepartments, {
    fields: [hrContracts.departmentId],
    references: [hrDepartments.id],
  }),
}));
