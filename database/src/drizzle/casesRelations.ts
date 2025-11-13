import { relations } from "drizzle-orm";
import { cases } from "./cases.js";
import { auditTemplates } from "./auditTemplates.js";
import { auditScopes } from "./auditScopes.js";
import { auditSections } from "./auditSections.js";
import { auditProcedures } from "./auditProcedures.js";
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

/**
 * Relations for auditTemplates table
 */
export const auditTemplatesRelations = relations(auditTemplates, ({ one, many }) => ({
  organization: one(organizations, {
    fields: [auditTemplates.organizationId],
    references: [organizations.id],
  }),
  creator: one(users, {
    fields: [auditTemplates.createdBy],
    references: [users.id],
  }),
  auditScopes: many(auditScopes),
}));

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
  }),
  completor: one(users, {
    fields: [auditScopes.completedBy],
    references: [users.id],
  }),
  archiver: one(users, {
    fields: [auditScopes.archivedBy],
    references: [users.id],
  }),
  sections: many(auditSections),
}));

/**
 * Relations for auditSections table
 */
export const auditSectionsRelations = relations(auditSections, ({ one, many }) => ({
  scope: one(auditScopes, {
    fields: [auditSections.scopeId],
    references: [auditScopes.id],
  }),
  procedures: many(auditProcedures),
}));

/**
 * Relations for auditProcedures table
 */
export const auditProceduresRelations = relations(auditProcedures, ({ one, many }) => ({
  section: one(auditSections, {
    fields: [auditProcedures.sectionId],
    references: [auditSections.id],
  }),
  completor: one(users, {
    fields: [auditProcedures.completedBy],
    references: [users.id],
  }),
  documents: many(caseDocuments),
  notes: many(caseNotes),
}));

/**
 * Relations for caseDocuments table
 */
export const caseDocumentsRelations = relations(caseDocuments, ({ one }) => ({
  case: one(cases, {
    fields: [caseDocuments.caseId],
    references: [cases.id],
  }),
  procedure: one(auditProcedures, {
    fields: [caseDocuments.procedureId],
    references: [auditProcedures.id],
  }),
  parentDocument: one(caseDocuments, {
    fields: [caseDocuments.parentDocumentId],
    references: [caseDocuments.id],
    relationName: "documentVersions",
  }),
  uploader: one(users, {
    fields: [caseDocuments.uploadedBy],
    references: [users.id],
  }),
}));

/**
 * Relations for caseNotes table
 */
export const caseNotesRelations = relations(caseNotes, ({ one }) => ({
  case: one(cases, {
    fields: [caseNotes.caseId],
    references: [cases.id],
  }),
  procedure: one(auditProcedures, {
    fields: [caseNotes.procedureId],
    references: [auditProcedures.id],
  }),
  creator: one(users, {
    fields: [caseNotes.createdBy],
    references: [users.id],
  }),
}));

/**
 * Relations for caseAssignments table
 */
export const caseAssignmentsRelations = relations(caseAssignments, ({ one }) => ({
  case: one(cases, {
    fields: [caseAssignments.caseId],
    references: [cases.id],
  }),
  user: one(users, {
    fields: [caseAssignments.userId],
    references: [users.id],
  }),
  assigner: one(users, {
    fields: [caseAssignments.assignedBy],
    references: [users.id],
  }),
}));

/**
 * Relations for caseHistory table
 */
export const caseHistoryRelations = relations(caseHistory, ({ one }) => ({
  case: one(cases, {
    fields: [caseHistory.caseId],
    references: [cases.id],
  }),
  changer: one(users, {
    fields: [caseHistory.changedBy],
    references: [users.id],
  }),
}));

/**
 * Relations for organizations table (extending existing)
 */
export const organizationsAuditRelations = relations(organizations, ({ many }) => ({
  cases: many(cases),
  auditTemplates: many(auditTemplates),
}));

/**
 * Relations for users table (extending existing)
 */
export const usersAuditRelations = relations(users, ({ many }) => ({
  createdCases: many(cases),
  createdTemplates: many(auditTemplates),
  createdScopes: many(auditScopes),
  completedScopes: many(auditScopes),
  archivedScopes: many(auditScopes),
  completedSections: many(auditSections),
  completedProcedures: many(auditProcedures),
  uploadedDocuments: many(caseDocuments),
  createdNotes: many(caseNotes),
  caseAssignments: many(caseAssignments),
  madeAssignments: many(caseAssignments),
  historyChanges: many(caseHistory),
}));
