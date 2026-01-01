import { eq, and, desc, asc, sql } from "drizzle-orm";
import {
  cases,
  templates,
  templateInstances,
  auditSections,
  auditProcedures,
  caseDocuments,
  caseNotes,
  caseAssignments,
  caseHistory,
} from "../drizzle/index.js";
import type { DbDeps } from "../deps.js";
import type { CaseEntityType, CaseAction } from "../drizzle/index.js";
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
  Template,
  TemplateInstance,
  AuditSection,
  AuditProcedure,
  CaseDocument,
  CaseNote,
  CaseAssignment,
  CaseHistory,
} from "./types.js";
import {
  templateStructureSchema,
  sectionSettingsSchema,
  procedureRequirementsSchema,
  procedureFieldDataSchema,
} from "./types.js";

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

export async function getCasesByOrganization(deps: DbDeps, organizationId: string) {
  return deps.drizzle.query.cases.findMany({
    where: (t, { eq }) => eq(t.organizationId, organizationId),
    orderBy: (t, { desc }) => [desc(t.createdAt)],
    with: {
      assignments: {
        with: {
          user: true,
        },
      },
    },
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

export async function createTemplate(deps: DbDeps, input: CreateTemplateInput): Promise<Template> {
  // Validate structure JSONB field
  const validatedStructure = templateStructureSchema.parse(input.structure);
  const [template] = await deps.drizzle
    .insert(templates)
    .values({
      ...input,
      structure: validatedStructure,
    })
    .returning();
  return template;
}

export async function getTemplateById(deps: DbDeps, templateId: string): Promise<Template | undefined> {
  return deps.drizzle.query.templates.findFirst({
    where: eq(templates.id, templateId),
  });
}

export async function getTemplatesByOrganization(deps: DbDeps, organizationId: string): Promise<Template[]> {
  return deps.drizzle.query.templates.findMany({
    where: eq(templates.organizationId, organizationId),
    orderBy: [desc(templates.createdAt)],
  });
}

export async function getPublicTemplates(deps: DbDeps): Promise<Template[]> {
  return deps.drizzle.query.templates.findMany({
    where: and(eq(templates.isSystemTemplate, true), eq(templates.isActive, true)),
    orderBy: [asc(templates.name)],
  });
}

export async function createScope(deps: DbDeps, input: CreateScopeInput): Promise<TemplateInstance> {
  const [scope] = await deps.drizzle.insert(templateInstances).values(input).returning();
  return scope;
}

export async function createScopeFromTemplate(
  deps: DbDeps,
  caseId: string,
  templateId: string,
  createdBy: string,
): Promise<TemplateInstance> {
  const template = await getTemplateById(deps, templateId);
  if (!template) {
    throw new Error(`Template ${templateId} not found`);
  }
  const [scope] = await deps.drizzle
    .insert(templateInstances)
    .values({
      caseId,
      templateId,
      name: template.name,
      description: template.description ?? undefined,
      status: "draft",
      data: template.structure.settings ?? {},
      createdBy,
    })
    .returning();

  // Create sections and procedures from template
  for (const sectionData of template.structure.sections) {
    // Validate section settings JSONB field
    const validatedSettings = sectionSettingsSchema.parse(sectionData.settings ?? {});
    const [section] = await deps.drizzle
      .insert(auditSections)
      .values({
        scopeId: scope.id,
        name: sectionData.name,
        description: sectionData.description,
        sortOrder: sectionData.sortOrder,
        settings: validatedSettings,
      })
      .returning();

    // Create procedures for this section
    for (const procedureData of sectionData.procedures) {
      // Validate procedure requirements JSONB field
      const validatedRequirements = procedureRequirementsSchema.parse(procedureData.requirements ?? {});
      await deps.drizzle.insert(auditProcedures).values({
        sectionId: section.id,
        referenceNumber: procedureData.referenceNumber,
        title: procedureData.title,
        description: procedureData.description,
        requirements: validatedRequirements,
        sortOrder: procedureData.sortOrder,
      });
    }
  }

  return scope;
}

export async function getScopeById(deps: DbDeps, scopeId: string): Promise<TemplateInstance | undefined> {
  return deps.drizzle.query.templateInstances.findFirst({
    where: eq(templateInstances.id, scopeId),
  });
}

export async function getScopesByCase(deps: DbDeps, caseId: string): Promise<TemplateInstance[]> {
  return deps.drizzle.query.templateInstances.findMany({
    where: eq(templateInstances.caseId, caseId),
    orderBy: [asc(templateInstances.createdAt)],
  });
}

export async function updateScopeStatus(
  deps: DbDeps,
  scopeId: string,
  status: "draft" | "in_progress" | "under_review" | "completed" | "archived",
  userId: string,
): Promise<TemplateInstance> {
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
    .update(templateInstances)
    .set(updateData)
    .where(eq(templateInstances.id, scopeId))
    .returning();

  return updatedScope;
}

/**
 * Section Management Functions
 */

export async function createSection(deps: DbDeps, input: CreateSectionInput): Promise<AuditSection> {
  // Validate settings JSONB field
  const validatedSettings = sectionSettingsSchema.parse(input.settings ?? {});
  const [section] = await deps.drizzle
    .insert(auditSections)
    .values({
      ...input,
      settings: validatedSettings,
    })
    .returning();
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
  // Validate requirements JSONB field
  const validatedRequirements = procedureRequirementsSchema.parse(input.requirements ?? {});
  const [procedure] = await deps.drizzle
    .insert(auditProcedures)
    .values({
      ...input,
      requirements: validatedRequirements,
    })
    .returning();
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
  // Validate fieldData JSONB field if provided
  const validatedFieldData = input.fieldData ? procedureFieldDataSchema.parse(input.fieldData) : undefined;
  const [completed] = await deps.drizzle
    .update(auditProcedures)
    .set({
      isCompleted: true,
      completedBy: input.completedBy,
      completedAt: new Date(),
      fieldData: validatedFieldData,
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
  // Validate fieldData JSONB field
  const validatedFieldData = procedureFieldDataSchema.parse(fieldData);
  const [updated] = await deps.drizzle
    .update(auditProcedures)
    .set({
      fieldData: validatedFieldData,
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
    entityType: CaseEntityType;
    entityId: string;
    action: CaseAction;
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
  entityType: CaseEntityType,
  entityId: string,
): Promise<CaseHistory[]> {
  return deps.drizzle.query.caseHistory.findMany({
    where: and(eq(caseHistory.entityType, entityType), eq(caseHistory.entityId, entityId)),
    orderBy: [desc(caseHistory.changedAt)],
  });
}
