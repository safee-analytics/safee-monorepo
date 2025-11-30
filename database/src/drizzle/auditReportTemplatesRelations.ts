import { relations } from "drizzle-orm";
import { auditReportTemplates } from "./auditReportTemplates.js";
import { organizations } from "./organizations.js";
import { auditReports } from "./auditReports.js";

export const auditReportTemplatesRelations = relations(auditReportTemplates, ({ one, many }) => ({
  organization: one(organizations, {
    fields: [auditReportTemplates.organizationId],
    references: [organizations.id],
  }),
  reports: many(auditReports),
}));
