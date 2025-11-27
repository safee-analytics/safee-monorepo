import { relations } from "drizzle-orm";
import { auditReports } from "./auditReports.js";
import { cases } from "./cases.js";
import { auditReportTemplates } from "./auditReportTemplates.js";
import { users } from "./users.js";

export const auditReportsRelations = relations(auditReports, ({ one }) => ({
  case: one(cases, {
    fields: [auditReports.caseId],
    references: [cases.id],
  }),
  template: one(auditReportTemplates, {
    fields: [auditReports.templateId],
    references: [auditReportTemplates.id],
  }),
  generator: one(users, {
    fields: [auditReports.generatedBy],
    references: [users.id],
    relationName: "reportGenerator",
  }),
}));
