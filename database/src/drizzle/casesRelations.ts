import { relations } from "drizzle-orm";
import { cases } from "./cases.js";
import { auditScopes } from "./auditScopes.js";
import { auditPlans } from "./auditPlans.js";
import { auditReports } from "./auditReports.js";
import { caseDocuments } from "./caseDocuments.js";
import { caseNotes } from "./caseNotes.js";
import { caseAssignments } from "./caseAssignments.js";
import { caseHistory } from "./caseHistory.js";
import { organizations } from "./organizations.js";
import { users } from "./users.js";

export const casesRelations = relations(cases, ({ one, many }) => ({
  organization: one(organizations, {
    fields: [cases.organizationId],
    references: [organizations.id],
  }),
  creator: one(users, {
    fields: [cases.createdBy],
    references: [users.id],
    relationName: "caseCreator",
  }),
  auditScopes: many(auditScopes),
  auditPlans: many(auditPlans),
  auditReports: many(auditReports),
  documents: many(caseDocuments),
  notes: many(caseNotes),
  assignments: many(caseAssignments),
  history: many(caseHistory),
}));
