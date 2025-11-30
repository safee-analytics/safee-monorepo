import type { AuditReport, NewAuditReport, AuditReportTemplate, NewAuditReportTemplate } from "../drizzle/index.js";

export type { AuditReport, AuditReportTemplate };

export type CreateAuditReportInput = Omit<NewAuditReport, "id" | "createdAt" | "updatedAt">;

export type UpdateAuditReportInput = Partial<
  Omit<NewAuditReport, "id" | "caseId" | "generatedBy" | "createdAt" | "updatedAt">
>;

export type CreateAuditReportTemplateInput = Omit<NewAuditReportTemplate, "id" | "createdAt" | "updatedAt">;
