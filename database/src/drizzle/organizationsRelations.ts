import { relations } from "drizzle-orm";
import { organizations } from "./organizations.js";
import { users } from "./users.js";
import { contacts } from "./contacts.js";
import { deals } from "./deals.js";
import { employees } from "./employees.js";
import { invoices } from "./invoices.js";
import { accounts } from "./accounts.js";
import { payrollRecords } from "./payroll.js";
import { odooDatabases } from "./odooDatabases.js";
import { organizationServices } from "./organizationServices.js";
import { members } from "./members.js";
import { invitations } from "./invitations.js";
import { teams } from "./teams.js";
import { organizationRoles } from "./organizationRoles.js";
import { cases } from "./cases.js";
import { auditTemplates } from "./auditTemplates.js";
import { approvalWorkflows } from "./approvalWorkflows.js";
import { approvalRules } from "./approvalRules.js";

export const organizationsRelations = relations(organizations, ({ many, one }) => ({
  users: many(users),
  members: many(members),
  invitations: many(invitations),
  contacts: many(contacts),
  deals: many(deals),
  employees: many(employees),
  invoices: many(invoices),
  accounts: many(accounts),
  payrollRecords: many(payrollRecords),
  odooDatabase: one(odooDatabases),
  organizationServices: many(organizationServices),
  teams: many(teams),
  organizationRoles: many(organizationRoles),
  // Audit/Cases relations
  cases: many(cases),
  auditTemplates: many(auditTemplates),
  // Approval relations
  approvalWorkflows: many(approvalWorkflows),
  approvalRules: many(approvalRules),
}));
