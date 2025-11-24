import { relations } from "drizzle-orm";
import { caseNotes } from "./caseNotes.js";
import { cases } from "./cases.js";
import { auditProcedures } from "./auditProcedures.js";
import { users } from "./users.js";

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
