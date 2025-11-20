import { relations } from "drizzle-orm";
import { caseDocuments } from "./caseDocuments.js";
import { cases } from "./cases.js";
import { auditProcedures } from "./auditProcedures.js";
import { users } from "./users.js";

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
