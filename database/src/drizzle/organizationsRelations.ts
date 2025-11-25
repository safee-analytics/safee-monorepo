import { relations } from "drizzle-orm";
import { organizations } from "./organizations.js";
import { users } from "./users.js";
import { hrEmployees } from "./hrEmployees.js";
import { accounts } from "./accounts.js";
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
  hrEmployees: many(hrEmployees),
  accounts: many(accounts),
  odooDatabase: one(odooDatabases),
  organizationServices: many(organizationServices),
  teams: many(teams),
  organizationRoles: many(organizationRoles),
  cases: many(cases),
  auditTemplates: many(auditTemplates),
  approvalWorkflows: many(approvalWorkflows),
  approvalRules: many(approvalRules),
}));
