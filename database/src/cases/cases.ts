import { eq, and, desc, asc, sql } from "drizzle-orm";
import {
  cases,
  auditTemplates,
  auditScopes,
  auditSections,
  auditProcedures,
  caseDocuments,
  caseNotes,
  caseAssignments,
  caseHistory,
} from "../drizzle/index.js";
import type { DbDeps } from "../deps.js";
import type {
  CreateCaseInput,
  UpdateCaseInput,
  CreateTemplateInput,
  CreateScopeInput,
  CreateSectionInput,
  CreateProcedureInput,
  CompleteProcedureInput,
  CreateDocumentInput,
  CreateNoteInput,
  UpdateNoteInput,
  CreateAssignmentInput,
  Case,
  AuditTemplate,
  AuditScope,
  AuditSection,
  AuditProcedure,
  CaseDocument,
  CaseNote,
  CaseAssignment,
  CaseHistory,
} from "./types.js";

/**
 * Case Management Functions
 */

export async function createCase(deps: DbDeps, input: CreateCaseInput): Promise<Case> {
  const [newCase] = await deps.drizzle
    .insert(cases)
    .values({
      ...input,
      dueDate: input.dueDate ? sql`${input.dueDate}::date` : null,
    })
    .returning();
  return newCase;
}

export async function getCaseById(deps: DbDeps, caseId: string): Promise<Case | undefined> {
  const result = await deps.drizzle.query.cases.findFirst({
    where: eq(cases.id, caseId),
  });
  return result;
}

export async function getCasesByOrganization(deps: DbDeps, organizationId: string): Promise<Case[]> {
  return deps.drizzle.query.cases.findMany({
    where: eq(cases.organizationId, organizationId),
    orderBy: [desc(cases.createdAt)],
  });
}

export async function updateCase(deps: DbDeps, caseId: string, input: UpdateCaseInput): Promise<Case> {
  const [updatedCase] = await deps.drizzle
    .update(cases)
    .set({
      ...input,
      dueDate: input.dueDate ? sql`${input.dueDate}::date` : undefined,
      completedDate: input.completedDate ? sql`${input.completedDate}::date` : undefined,
      updatedAt: new Date(),
    })
    .where(eq(cases.id, caseId))
    .returning();
  return updatedCase;
}

export async function deleteCase(deps: DbDeps, caseId: string): Promise<void> {
  await deps.drizzle.delete(cases).where(eq(cases.id, caseId));
}

/**
 * Template Management Functions
 */

export async function createTemplate(deps: DbDeps, input: CreateTemplateInput): Promise<AuditTemplate> {
  const [template] = await deps.drizzle.insert(auditTemplates).values(input).returning();
  return template;
}

export async function getTemplateById(deps: DbDeps, templateId: string): Promise<AuditTemplate | undefined> {
  return deps.drizzle.query.auditTemplates.findFirst({
    where: eq(auditTemplates.id, templateId),
  });
}

export async function getTemplatesByOrganization(
  deps: DbDeps,
  organizationId: string,
): Promise<AuditTemplate[]> {
  return deps.drizzle.query.auditTemplates.findMany({
    where: eq(auditTemplates.organizationId, organizationId),
    orderBy: [desc(auditTemplates.createdAt)],
  });
}

export async function getPublicTemplates(deps: DbDeps): Promise<AuditTemplate[]> {
  return deps.drizzle.query.auditTemplates.findMany({
    where: and(eq(auditTemplates.isPublic, true), eq(auditTemplates.isActive, true)),
    orderBy: [asc(auditTemplates.name)],
  });
}

/**
 * Scope Management Functions
 */

export async function createScope(deps: DbDeps, input: CreateScopeInput): Promise<AuditScope> {
  const [scope] = await deps.drizzle.insert(auditScopes).values(input).returning();
  return scope;
}

export async function createScopeFromTemplate(
  deps: DbDeps,
  caseId: string,
  templateId: string,
  createdBy: string,
): Promise<AuditScope> {
  // Get the template
  const template = await getTemplateById(deps, templateId);
  if (!template) {
    throw new Error(`Template ${templateId} not found`);
  }

  // Create the scope
  const [scope] = await deps.drizzle
    .insert(auditScopes)
    .values({
      caseId,
      templateId,
      name: template.name,
      description: template.description ?? undefined,
      status: "draft",
      metadata: template.structure.settings ?? {},
      createdBy,
    })
    .returning();

  // Create sections and procedures from template
  for (const sectionData of template.structure.sections) {
    const [section] = await deps.drizzle
      .insert(auditSections)
      .values({
        scopeId: scope.id,
        name: sectionData.name,
        description: sectionData.description,
        sortOrder: sectionData.sortOrder,
        settings: sectionData.settings ?? {},
      })
      .returning();

    // Create procedures for this section
    for (const procedureData of sectionData.procedures) {
      await deps.drizzle.insert(auditProcedures).values({
        sectionId: section.id,
        referenceNumber: procedureData.referenceNumber,
        title: procedureData.title,
        description: procedureData.description,
        requirements: (procedureData.requirements ?? {}) as Record<string, unknown>,
        sortOrder: procedureData.sortOrder,
      });
    }
  }

  return scope;
}

export async function getScopeById(deps: DbDeps, scopeId: string): Promise<AuditScope | undefined> {
  return deps.drizzle.query.auditScopes.findFirst({
    where: eq(auditScopes.id, scopeId),
  });
}

export async function getScopesByCase(deps: DbDeps, caseId: string): Promise<AuditScope[]> {
  return deps.drizzle.query.auditScopes.findMany({
    where: eq(auditScopes.caseId, caseId),
    orderBy: [asc(auditScopes.createdAt)],
  });
}

export async function updateScopeStatus(
  deps: DbDeps,
  scopeId: string,
  status: "draft" | "in-progress" | "under-review" | "completed" | "archived",
  userId: string,
): Promise<AuditScope> {
  const updateData: Record<string, unknown> = {
    status,
    updatedAt: new Date(),
  };

  if (status === "completed") {
    updateData.completedBy = userId;
    updateData.completedAt = new Date();
  } else if (status === "archived") {
    updateData.archivedBy = userId;
    updateData.archivedAt = new Date();
  }

  const [updatedScope] = await deps.drizzle
    .update(auditScopes)
    .set(updateData)
    .where(eq(auditScopes.id, scopeId))
    .returning();

  return updatedScope;
}

/**
 * Section Management Functions
 */

export async function createSection(deps: DbDeps, input: CreateSectionInput): Promise<AuditSection> {
  const [section] = await deps.drizzle.insert(auditSections).values(input).returning();
  return section;
}

export async function getSectionsByScopeId(deps: DbDeps, scopeId: string): Promise<AuditSection[]> {
  return deps.drizzle.query.auditSections.findMany({
    where: eq(auditSections.scopeId, scopeId),
    orderBy: [asc(auditSections.sortOrder)],
  });
}

/**
 * Procedure Management Functions
 */

export async function createProcedure(deps: DbDeps, input: CreateProcedureInput): Promise<AuditProcedure> {
  const [procedure] = await deps.drizzle.insert(auditProcedures).values(input).returning();
  return procedure;
}

export async function getProcedureById(
  deps: DbDeps,
  procedureId: string,
): Promise<AuditProcedure | undefined> {
  return deps.drizzle.query.auditProcedures.findFirst({
    where: eq(auditProcedures.id, procedureId),
  });
}

export async function getProceduresBySectionId(deps: DbDeps, sectionId: string): Promise<AuditProcedure[]> {
  return deps.drizzle.query.auditProcedures.findMany({
    where: eq(auditProcedures.sectionId, sectionId),
    orderBy: [asc(auditProcedures.sortOrder)],
  });
}

export async function completeProcedure(
  deps: DbDeps,
  procedureId: string,
  input: CompleteProcedureInput,
): Promise<AuditProcedure> {
  const [completed] = await deps.drizzle
    .update(auditProcedures)
    .set({
      isCompleted: true,
      completedBy: input.completedBy,
      completedAt: new Date(),
      fieldData: input.fieldData,
      memo: input.memo,
      updatedAt: new Date(),
    })
    .where(eq(auditProcedures.id, procedureId))
    .returning();

  return completed;
}

export async function updateProcedureFieldData(
  deps: DbDeps,
  procedureId: string,
  fieldData: Record<string, unknown>,
): Promise<AuditProcedure> {
  const [updated] = await deps.drizzle
    .update(auditProcedures)
    .set({
      fieldData,
      updatedAt: new Date(),
    })
    .where(eq(auditProcedures.id, procedureId))
    .returning();

  return updated;
}

/**
 * Document Management Functions
 */

export async function createDocument(deps: DbDeps, input: CreateDocumentInput): Promise<CaseDocument> {
  const [document] = await deps.drizzle.insert(caseDocuments).values(input).returning();
  return document;
}

export async function getDocumentById(deps: DbDeps, documentId: string): Promise<CaseDocument | undefined> {
  return deps.drizzle.query.caseDocuments.findFirst({
    where: eq(caseDocuments.id, documentId),
  });
}

export async function getDocumentsByCase(deps: DbDeps, caseId: string): Promise<CaseDocument[]> {
  return deps.drizzle.query.caseDocuments.findMany({
    where: and(eq(caseDocuments.caseId, caseId), eq(caseDocuments.isDeleted, false)),
    orderBy: [desc(caseDocuments.uploadedAt)],
  });
}

export async function getDocumentsByProcedure(deps: DbDeps, procedureId: string): Promise<CaseDocument[]> {
  return deps.drizzle.query.caseDocuments.findMany({
    where: and(eq(caseDocuments.procedureId, procedureId), eq(caseDocuments.isDeleted, false)),
    orderBy: [desc(caseDocuments.uploadedAt)],
  });
}

export async function softDeleteDocument(deps: DbDeps, documentId: string): Promise<void> {
  await deps.drizzle.update(caseDocuments).set({ isDeleted: true }).where(eq(caseDocuments.id, documentId));
}

/**
 * Note Management Functions
 */

export async function createNote(deps: DbDeps, input: CreateNoteInput): Promise<CaseNote> {
  const [note] = await deps.drizzle.insert(caseNotes).values(input).returning();
  return note;
}

export async function getNoteById(deps: DbDeps, noteId: string): Promise<CaseNote | undefined> {
  return deps.drizzle.query.caseNotes.findFirst({
    where: eq(caseNotes.id, noteId),
  });
}

export async function getNotesByCase(deps: DbDeps, caseId: string): Promise<CaseNote[]> {
  return deps.drizzle.query.caseNotes.findMany({
    where: eq(caseNotes.caseId, caseId),
    orderBy: [desc(caseNotes.createdAt)],
  });
}

export async function getNotesByProcedure(deps: DbDeps, procedureId: string): Promise<CaseNote[]> {
  return deps.drizzle.query.caseNotes.findMany({
    where: eq(caseNotes.procedureId, procedureId),
    orderBy: [desc(caseNotes.createdAt)],
  });
}

export async function updateNote(deps: DbDeps, noteId: string, input: UpdateNoteInput): Promise<CaseNote> {
  const [updated] = await deps.drizzle
    .update(caseNotes)
    .set({
      content: input.content,
      isEdited: true,
      updatedAt: new Date(),
    })
    .where(eq(caseNotes.id, noteId))
    .returning();

  return updated;
}

export async function deleteNote(deps: DbDeps, noteId: string): Promise<void> {
  await deps.drizzle.delete(caseNotes).where(eq(caseNotes.id, noteId));
}

/**
 * Assignment Management Functions
 */

export async function createAssignment(deps: DbDeps, input: CreateAssignmentInput): Promise<CaseAssignment> {
  const [assignment] = await deps.drizzle.insert(caseAssignments).values(input).returning();
  return assignment;
}

export async function getAssignmentsByCase(deps: DbDeps, caseId: string): Promise<CaseAssignment[]> {
  return deps.drizzle.query.caseAssignments.findMany({
    where: eq(caseAssignments.caseId, caseId),
  });
}

export async function getAssignmentsByUser(deps: DbDeps, userId: string): Promise<CaseAssignment[]> {
  return deps.drizzle.query.caseAssignments.findMany({
    where: eq(caseAssignments.userId, userId),
  });
}

export async function deleteAssignment(deps: DbDeps, caseId: string, userId: string): Promise<void> {
  await deps.drizzle
    .delete(caseAssignments)
    .where(and(eq(caseAssignments.caseId, caseId), eq(caseAssignments.userId, userId)));
}

/**
 * History Management Functions
 */

export async function createHistoryEntry(
  deps: DbDeps,
  input: {
    caseId: string;
    entityType: string;
    entityId: string;
    action: string;
    changesBefore?: Record<string, unknown>;
    changesAfter?: Record<string, unknown>;
    changedBy: string;
  },
): Promise<CaseHistory> {
  const [history] = await deps.drizzle.insert(caseHistory).values(input).returning();
  return history;
}

export async function getHistoryByCase(deps: DbDeps, caseId: string): Promise<CaseHistory[]> {
  return deps.drizzle.query.caseHistory.findMany({
    where: eq(caseHistory.caseId, caseId),
    orderBy: [desc(caseHistory.changedAt)],
  });
}

export async function getHistoryByEntity(
  deps: DbDeps,
  entityType: string,
  entityId: string,
): Promise<CaseHistory[]> {
  return deps.drizzle.query.caseHistory.findMany({
    where: and(eq(caseHistory.entityType, entityType), eq(caseHistory.entityId, entityId)),
    orderBy: [desc(caseHistory.changedAt)],
  });
}
