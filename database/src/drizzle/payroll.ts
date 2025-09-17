import { pgTable, uuid, varchar, timestamp, decimal, date } from "drizzle-orm/pg-core";
import { organizations } from "./organizations.js";
import { employees } from "./employees.js";

export const payrollRecords = pgTable("payroll_records", {
  id: uuid("id").primaryKey().defaultRandom(),
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
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});
