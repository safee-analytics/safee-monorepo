import { relations } from "drizzle-orm";
import { employees } from "./employees.js";
import { organizations } from "./organizations.js";
import { payrollRecords } from "./payroll.js";

export const employeesRelations = relations(employees, ({ one, many }) => ({
  organization: one(organizations, {
    fields: [employees.organizationId],
    references: [organizations.id],
  }),
  payrollRecords: many(payrollRecords),
}));
