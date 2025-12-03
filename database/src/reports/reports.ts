import { eq, and, desc, asc, isNull, or } from "drizzle-orm";
import { auditReports, auditReportTemplates } from "../drizzle/index.js";
import type { DbDeps } from "../deps.js";
import type {
  AuditReport,
  AuditReportTemplate,
  CreateAuditReportInput,
  UpdateAuditReportInput,
  CreateAuditReportTemplateInput,
} from "./types.js";

export async function createAuditReport(deps: DbDeps, input: CreateAuditReportInput): Promise<AuditReport> {
  const [newReport] = await deps.drizzle.insert(auditReports).values(input).returning();
  return newReport;
}

export async function getAuditReportById(deps: DbDeps, reportId: string): Promise<AuditReport | undefined> {
  return deps.drizzle.query.auditReports.findFirst({
    where: eq(auditReports.id, reportId),
    with: {
      case: true,
      template: true,
      generator: {
        columns: {
          id: true,
          name: true,
          email: true,
        },
      },
    },
  });
}

export async function getAuditReportsByCase(deps: DbDeps, caseId: string): Promise<AuditReport[]> {
  return deps.drizzle.query.auditReports.findMany({
    where: eq(auditReports.caseId, caseId),
    orderBy: [desc(auditReports.createdAt)],
    with: {
      template: true,
      generator: {
        columns: {
          id: true,
          name: true,
          email: true,
        },
      },
    },
  });
}

export async function getAuditReportsByStatus(
  deps: DbDeps,
  organizationId: string,
  status?: string,
): Promise<AuditReport[]> {
  const conditions = [];

  if (status) {
    conditions.push(eq(auditReports.status, status as AuditReport["status"]));
  }

  return deps.drizzle.query.auditReports.findMany({
    where: conditions.length > 0 ? and(...conditions) : undefined,
    orderBy: [desc(auditReports.createdAt)],
    with: {
      case: {
        columns: {
          id: true,
          caseNumber: true,
          clientName: true,
          organizationId: true,
        },
      },
      template: true,
      generator: {
        columns: {
          id: true,
          name: true,
          email: true,
        },
      },
    },
  });
}

export async function updateAuditReport(
  deps: DbDeps,
  reportId: string,
  input: UpdateAuditReportInput,
): Promise<AuditReport> {
  const [updatedReport] = await deps.drizzle
    .update(auditReports)
    .set({
      ...input,
      updatedAt: new Date(),
    })
    .where(eq(auditReports.id, reportId))
    .returning();
  return updatedReport;
}

export async function deleteAuditReport(deps: DbDeps, reportId: string): Promise<void> {
  await deps.drizzle.delete(auditReports).where(eq(auditReports.id, reportId));
}

export async function createAuditReportTemplate(
  deps: DbDeps,
  input: CreateAuditReportTemplateInput,
): Promise<AuditReportTemplate> {
  const [template] = await deps.drizzle.insert(auditReportTemplates).values(input).returning();
  return template;
}

export async function getAuditReportTemplateById(
  deps: DbDeps,
  templateId: string,
): Promise<AuditReportTemplate | undefined> {
  return deps.drizzle.query.auditReportTemplates.findFirst({
    where: eq(auditReportTemplates.id, templateId),
  });
}

export async function getAuditReportTemplates(
  deps: DbDeps,
  organizationId?: string,
): Promise<AuditReportTemplate[]> {
  if (organizationId) {
    return deps.drizzle.query.auditReportTemplates.findMany({
      where: and(
        eq(auditReportTemplates.isActive, true),
        or(
          eq(auditReportTemplates.organizationId, organizationId),
          isNull(auditReportTemplates.organizationId),
        ),
      ),
      orderBy: [desc(auditReportTemplates.isDefault), asc(auditReportTemplates.name)],
    });
  }

  return deps.drizzle.query.auditReportTemplates.findMany({
    where: eq(auditReportTemplates.isActive, true),
    orderBy: [desc(auditReportTemplates.isDefault), asc(auditReportTemplates.name)],
  });
}

export async function updateAuditReportTemplate(
  deps: DbDeps,
  templateId: string,
  input: Partial<CreateAuditReportTemplateInput>,
): Promise<AuditReportTemplate> {
  const [updatedTemplate] = await deps.drizzle
    .update(auditReportTemplates)
    .set({
      ...input,
      updatedAt: new Date(),
    })
    .where(eq(auditReportTemplates.id, templateId))
    .returning();
  return updatedTemplate;
}
