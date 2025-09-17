import { uuid, varchar, timestamp, decimal, date } from "drizzle-orm/pg-core";
import { hrSchema } from "./_common.js";
import { organizations } from "./organizations.js";

export const employees = hrSchema.table("employees", {
  id: uuid("id").primaryKey().defaultRandom(),
  employeeId: varchar("employee_id", { length: 50 }).notNull(),
  firstName: varchar("first_name", { length: 100 }).notNull(),
  lastName: varchar("last_name", { length: 100 }).notNull(),
  email: varchar("email", { length: 255 }),
  phone: varchar("phone", { length: 50 }),
  hireDate: date("hire_date").notNull(),
  department: varchar("department", { length: 100 }),
  position: varchar("position", { length: 100 }),
  salary: decimal("salary", { precision: 12, scale: 2 }),
  status: varchar("status", { length: 50 }).default("ACTIVE").notNull(),
  organizationId: uuid("organization_id")
    .references(() => organizations.id)
    .notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});
