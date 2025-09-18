import { uuid, varchar, timestamp, decimal, date, index } from "drizzle-orm/pg-core";
import { hrSchema, idpk } from "./_common.js";
import { organizations } from "./organizations.js";
import { employees } from "./employees.js";

export const payrollRecords = hrSchema.table("payroll_records", {
  id: idpk("id"),
  employeeId: uuid("employee_id")
    .references(() => employees.id)
    .notNull(),
  payPeriod: varchar("pay_period", { length: 50 }).notNull(),
  baseSalary: decimal("base_salary", { precision: 12, scale: 2 }).notNull(),
  netPay: decimal("net_pay", { precision: 12, scale: 2 }).notNull(),
  payDate: date("pay_date").notNull(),
  organizationId: uuid("organization_id")
    .references(() => organizations.id)
    .notNull(),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).defaultNow().notNull(),
}, (table) => [
  index("payroll_records_organization_id_idx").on(table.organizationId),
  index("payroll_records_employee_id_idx").on(table.employeeId),
]);
