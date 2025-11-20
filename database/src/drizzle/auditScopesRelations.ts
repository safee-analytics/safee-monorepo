import { relations } from "drizzle-orm";
import { auditScopes } from "./auditScopes.js";
import { auditSections } from "./auditSections.js";
import { auditTemplates } from "./auditTemplates.js";
import { cases } from "./cases.js";
import { users } from "./users.js";

/**
 * Relations for auditScopes table
 */
export const auditScopesRelations = relations(auditScopes, ({ one, many }) => ({
  case: one(cases, {
    fields: [auditScopes.caseId],
    references: [cases.id],
  }),
  template: one(auditTemplates, {
    fields: [auditScopes.templateId],
    references: [auditTemplates.id],
  }),
  creator: one(users, {
    fields: [auditScopes.createdBy],
    references: [users.id],
    relationName: "auditScopeCreator",
  }),
  completor: one(users, {
    fields: [auditScopes.completedBy],
    references: [users.id],
    relationName: "auditScopeCompletor",
  }),
  archiver: one(users, {
    fields: [auditScopes.archivedBy],
    references: [users.id],
    relationName: "auditScopeArchiver",
  }),
  sections: many(auditSections),
}));
