import { relations } from "drizzle-orm";
import { cases } from "./cases.js";
import { auditScopes } from "./auditScopes.js";
import { caseDocuments } from "./caseDocuments.js";
import { caseNotes } from "./caseNotes.js";
import { caseAssignments } from "./caseAssignments.js";
import { caseHistory } from "./caseHistory.js";
import { organizations } from "./organizations.js";
import { users } from "./users.js";

/**
 * Relations for cases table
 */
export const casesRelations = relations(cases, ({ one, many }) => ({
  organization: one(organizations, {
    fields: [cases.organizationId],
    references: [organizations.id],
  }),
  creator: one(users, {
    fields: [cases.createdBy],
    references: [users.id],
  }),
  auditScopes: many(auditScopes),
  documents: many(caseDocuments),
  notes: many(caseNotes),
  assignments: many(caseAssignments),
  history: many(caseHistory),
}));
