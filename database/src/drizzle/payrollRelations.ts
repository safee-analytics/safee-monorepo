import { relations } from "drizzle-orm";
import { payrollRecords } from "./payroll.js";
import { organizations } from "./organizations.js";
import { employees } from "./employees.js";

export const payrollRecordsRelations = relations(payrollRecords, ({ one }) => ({
  organization: one(organizations, {
    fields: [payrollRecords.organizationId],
    references: [organizations.id],
  }),
  employee: one(employees, {
    fields: [payrollRecords.employeeId],
    references: [employees.id],
  }),
}));
