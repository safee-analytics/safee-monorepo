import { relations } from "drizzle-orm";
import { organizations } from "./organizations.js";
import { users } from "./users.js";
import { contacts } from "./contacts.js";
import { deals } from "./deals.js";
import { employees } from "./employees.js";
import { invoices } from "./invoices.js";
import { accounts } from "./accounts.js";
import { payrollRecords } from "./payroll.js";

export const organizationsRelations = relations(organizations, ({ many }) => ({
  users: many(users),
  contacts: many(contacts),
  deals: many(deals),
  employees: many(employees),
  invoices: many(invoices),
  accounts: many(accounts),
  payrollRecords: many(payrollRecords),
}));
