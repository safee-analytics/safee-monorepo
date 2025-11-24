import { relations } from "drizzle-orm";
import { auditProcedures } from "./auditProcedures.js";
import { auditSections } from "./auditSections.js";
import { caseDocuments } from "./caseDocuments.js";
import { caseNotes } from "./caseNotes.js";
import { users } from "./users.js";

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
