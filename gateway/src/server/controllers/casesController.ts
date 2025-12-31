import {
  Controller,
  Get,
  Post,
  Put,
  Delete,
  Route,
  Tags,
  Security,
  Body,
  Path,
  Request,
  SuccessResponse,
  OperationId,
} from "tsoa";
import type { AuthenticatedRequest } from "../middleware/auth.js";
import {
  getCaseById,
  getCasesByOrganization,
  createTemplate,
  getTemplateById,
  getPublicTemplates,
  createScope,
  getScopesByCase,
  updateScopeStatus,
  getSectionsByScopeId,
  getProceduresBySectionId,
  createDocument,
  getDocumentsByCase,
  softDeleteDocument,
  createNote,
  getNotesByCase,
  updateNote,
  createAssignment,
  getAssignmentsByCase,
  deleteAssignment,
  getHistoryByCase,
} from "@safee/database";
import { createCase as createCaseOp } from "../operations/cases/createCase.js";
import { updateCase as updateCaseOp } from "../operations/cases/updateCase.js";
import { deleteCase as deleteCaseOp } from "../operations/cases/deleteCase.js";
import { createScopeFromTemplate as createScopeFromTemplateOp } from "../operations/cases/createScopeFromTemplate.js";
import { completeProcedure as completeProcedureOp } from "../operations/cases/completeProcedure.js";
import type {
  CaseResponse,
  CreateCaseRequest,
  UpdateCaseRequest,
  TemplateResponse,
  CreateTemplateRequest,
  ScopeResponse,
  CreateScopeRequest,
  CreateScopeFromTemplateRequest,
  UpdateScopeStatusRequest,
  SectionResponse,
  ProcedureResponse,
  CompleteProcedureRequest,
  DocumentResponse,
  CreateDocumentRequest,
  NoteResponse,
  CreateNoteRequest,
  UpdateNoteRequest,
  AssignmentResponse,
  CreateAssignmentRequest,
  HistoryResponse,
  TemplateStructure,
} from "../dtos/cases.js";
import { z } from "zod";

const templateStructureSchema = z.object({
  sections: z
    .array(
      z.object({
        name: z.string(),
        description: z
          .string()
          .optional()
          .nullable()
          .transform((v) => v ?? undefined),
        sortOrder: z.number(),
        settings: z
          .record(z.string(), z.unknown())
          .optional()
          .nullable()
          .transform((v) => v ?? undefined),
        procedures: z.array(
          z.object({
            referenceNumber: z.string(),
            title: z.string(),
            description: z
              .string()
              .optional()
              .nullable()
              .transform((v) => v ?? undefined),
            requirements: z
              .record(z.string(), z.unknown())
              .optional()
              .nullable()
              .transform((v) => v ?? undefined),
            sortOrder: z.number(),
          }),
        ),
      }),
    )
    .default([]),
  settings: z
    .record(z.string(), z.unknown())
    .optional()
    .nullable()
    .transform((v) => v ?? undefined),
});

function sanitizeTemplateStructure(structure: unknown): TemplateStructure {
  return templateStructureSchema.parse(structure);
}

@Route("cases")
@Tags("Cases")
export class CasesController extends Controller {
  // ============= CASE MANAGEMENT =============

  @Get("/")
  @Security("jwt")
  public async listCases(@Request() req: AuthenticatedRequest): Promise<CaseResponse[]> {
    const organizationId = req.betterAuthSession?.session.activeOrganizationId ?? "";
    const deps = { drizzle: req.drizzle, logger: req.logger };

    const cases = await getCasesByOrganization(deps, organizationId);

    return cases.map((c) => ({
      id: c.id,
      organizationId: c.organizationId,
      caseNumber: c.caseNumber,
      title: c.title,
      caseType: c.caseType,
      status: c.status,
      priority: c.priority,
      dueDate: c.dueDate?.toISOString(),
      completedDate: c.completedDate?.toISOString(),
      createdBy: c.createdBy,
      createdAt: c.createdAt.toISOString(),
      updatedAt: c.updatedAt.toISOString(),
      assignments: c.assignments.map((a) => ({
        userId: a.userId,
        role: a.role,
        user: {
          id: a.user.id,
          name: a.user.name,
          email: a.user.email,
        },
      })),
    }));
  }

  @Post("/")
  @Security("jwt")
  @SuccessResponse("201", "Case created successfully")
  public async createCase(
    @Request() req: AuthenticatedRequest,
    @Body() request: CreateCaseRequest,
  ): Promise<CaseResponse> {
    const organizationId = req.betterAuthSession?.session.activeOrganizationId ?? "";
    const userId = req.betterAuthSession?.user.id ?? "";

    this.setStatus(201);

    return await createCaseOp(req.drizzle, organizationId, userId, request);
  }

  // ============= TEMPLATE MANAGEMENT =============
  // NOTE: Template routes must come BEFORE {caseId} routes to avoid route conflicts

  @Get("/templates")
  @Security("jwt")
  @OperationId("ListCaseTemplates")
  public async listPublicTemplates(@Request() req: AuthenticatedRequest): Promise<TemplateResponse[]> {
    const deps = { drizzle: req.drizzle, logger: req.logger };

    const templates = await getPublicTemplates(deps);

    return templates.map((t) => ({
      id: t.id,
      organizationId: t.organizationId,
      name: t.name,
      description: t.description,
      templateType: t.templateType,
      category: t.category,
      version: t.version,
      isActive: t.isActive,
      isSystemTemplate: t.isSystemTemplate,
      structure: sanitizeTemplateStructure(t.structure),
      createdBy: t.createdBy,
      createdAt: t.createdAt.toISOString(),
      updatedAt: t.updatedAt.toISOString(),
    }));
  }

  @Post("/templates")
  @Security("jwt")
  @SuccessResponse("201", "Template created successfully")
  @OperationId("CreateCaseTemplate")
  public async createTemplate(
    @Request() req: AuthenticatedRequest,
    @Body() request: CreateTemplateRequest,
  ): Promise<TemplateResponse> {
    const organizationId = req.betterAuthSession?.session.activeOrganizationId ?? "";
    const userId = req.betterAuthSession?.user.id ?? "";
    const deps = { drizzle: req.drizzle, logger: req.logger };

    this.setStatus(201);

    const template = await createTemplate(deps, {
      organizationId: request.organizationId ?? organizationId,
      name: request.name,
      description: request.description ?? undefined,
      templateType: request.templateType,
      category: request.category ?? undefined,
      version: request.version ?? undefined,
      isActive: request.isActive ?? undefined,
      isSystemTemplate: request.isSystemTemplate ?? undefined,
      structure: sanitizeTemplateStructure(request.structure),
      createdBy: userId,
    });

    return {
      id: template.id,
      organizationId: template.organizationId,
      name: template.name,
      description: template.description,
      templateType: template.templateType,
      category: template.category,
      version: template.version,
      isActive: template.isActive,
      isSystemTemplate: template.isSystemTemplate,
      structure: sanitizeTemplateStructure(template.structure),
      createdBy: template.createdBy,
      createdAt: template.createdAt.toISOString(),
      updatedAt: template.updatedAt.toISOString(),
    };
  }

  @Get("/templates/{templateId}")
  @Security("jwt")
  @OperationId("GetCaseTemplate")
  public async getTemplate(
    @Request() req: AuthenticatedRequest,
    @Path() templateId: string,
  ): Promise<TemplateResponse> {
    const deps = { drizzle: req.drizzle, logger: req.logger };

    const template = await getTemplateById(deps, templateId);
    if (!template) {
      this.setStatus(404);
      throw new Error("Template not found");
    }

    return {
      id: template.id,
      organizationId: template.organizationId,
      name: template.name,
      description: template.description,
      templateType: template.templateType,
      category: template.category,
      version: template.version,
      isActive: template.isActive,
      isSystemTemplate: template.isSystemTemplate,
      structure: template.structure as TemplateResponse["structure"],
      createdBy: template.createdBy,
      createdAt: template.createdAt.toISOString(),
      updatedAt: template.updatedAt.toISOString(),
    };
  }

  @Get("/{caseId}")
  @Security("jwt")
  public async getCase(@Request() req: AuthenticatedRequest, @Path() caseId: string): Promise<CaseResponse> {
    const deps = { drizzle: req.drizzle, logger: req.logger };

    const foundCase = await getCaseById(deps, caseId);
    if (!foundCase) {
      this.setStatus(404);
      throw new Error("Case not found");
    }

    return {
      id: foundCase.id,
      organizationId: foundCase.organizationId,
      caseNumber: foundCase.caseNumber,
      title: foundCase.title,
      caseType: foundCase.caseType,
      status: foundCase.status,
      priority: foundCase.priority,
      dueDate: foundCase.dueDate?.toISOString(),
      completedDate: foundCase.completedDate?.toISOString(),
      createdBy: foundCase.createdBy,
      createdAt: foundCase.createdAt.toISOString(),
      updatedAt: foundCase.updatedAt.toISOString(),
    };
  }

  @Put("/{caseId}")
  @Security("jwt")
  public async updateCase(
    @Request() req: AuthenticatedRequest,
    @Path() caseId: string,
    @Body() request: UpdateCaseRequest,
  ): Promise<CaseResponse> {
    const organizationId = req.betterAuthSession?.session.activeOrganizationId ?? "";
    const userId = req.betterAuthSession?.user.id ?? "";

    return await updateCaseOp(req.drizzle, organizationId, userId, caseId, request);
  }

  @Delete("/{caseId}")
  @Security("jwt")
  public async deleteCase(
    @Request() req: AuthenticatedRequest,
    @Path() caseId: string,
  ): Promise<{ success: boolean }> {
    const organizationId = req.betterAuthSession?.session.activeOrganizationId ?? "";
    const userId = req.betterAuthSession?.user.id ?? "";

    return await deleteCaseOp(req.drizzle, organizationId, userId, caseId);
  }

  // ============= SCOPE MANAGEMENT =============

  @Get("/{caseId}/scopes")
  @Security("jwt")
  public async listScopes(
    @Request() req: AuthenticatedRequest,
    @Path() caseId: string,
  ): Promise<ScopeResponse[]> {
    const deps = { drizzle: req.drizzle, logger: req.logger };

    const scopes = await getScopesByCase(deps, caseId);

    return scopes.map((s) => ({
      id: s.id,
      caseId: s.caseId,
      templateId: s.templateId,
      name: s.name,
      description: s.description,
      status: s.status,
      data: s.data,
      createdBy: s.createdBy,
      completedBy: s.completedBy,
      archivedBy: s.archivedBy,
      createdAt: s.createdAt.toISOString(),
      updatedAt: s.updatedAt.toISOString(),
      completedAt: s.completedAt?.toISOString(),
      archivedAt: s.archivedAt?.toISOString(),
    }));
  }

  @Post("/{caseId}/scopes")
  @Security("jwt")
  @SuccessResponse("201", "Scope created successfully")
  public async createScope(
    @Request() req: AuthenticatedRequest,
    @Path() caseId: string,
    @Body() request: CreateScopeRequest,
  ): Promise<ScopeResponse> {
    const userId = req.betterAuthSession?.user.id ?? "";
    const deps = { drizzle: req.drizzle, logger: req.logger };

    this.setStatus(201);

    const scope = await createScope(deps, {
      caseId,
      name: request.name,
      description: request.description,
      status: request.status ?? "draft",
      data: request.data ?? {},
      createdBy: userId,
    });

    return {
      id: scope.id,
      caseId: scope.caseId,
      templateId: scope.templateId,
      name: scope.name,
      description: scope.description,
      status: scope.status,
      data: scope.data,
      createdBy: scope.createdBy,
      completedBy: scope.completedBy,
      archivedBy: scope.archivedBy,
      createdAt: scope.createdAt.toISOString(),
      updatedAt: scope.updatedAt.toISOString(),
      completedAt: scope.completedAt?.toISOString(),
      archivedAt: scope.archivedAt?.toISOString(),
    };
  }

  @Post("/{caseId}/scopes/from-template")
  @Security("jwt")
  @SuccessResponse("201", "Scope created from template successfully")
  public async createScopeFromTemplate(
    @Request() req: AuthenticatedRequest,
    @Path() caseId: string,
    @Body() request: CreateScopeFromTemplateRequest,
  ): Promise<ScopeResponse> {
    const organizationId = req.betterAuthSession?.session.activeOrganizationId ?? "";
    const userId = req.betterAuthSession?.user.id ?? "";

    this.setStatus(201);

    return await createScopeFromTemplateOp(req.drizzle, organizationId, userId, caseId, request.templateId);
  }

  @Put("/{caseId}/scopes/{scopeId}/status")
  @Security("jwt")
  public async updateScopeStatus(
    @Request() req: AuthenticatedRequest,
    @Path() caseId: string,
    @Path() scopeId: string,
    @Body() request: UpdateScopeStatusRequest,
  ): Promise<ScopeResponse> {
    const userId = req.betterAuthSession?.user.id ?? "";
    const deps = { drizzle: req.drizzle, logger: req.logger };

    const scope = await updateScopeStatus(deps, scopeId, request.status, userId);

    return {
      id: scope.id,
      caseId: scope.caseId,
      templateId: scope.templateId,
      name: scope.name,
      description: scope.description,
      status: scope.status,
      data: scope.data,
      createdBy: scope.createdBy,
      completedBy: scope.completedBy,
      archivedBy: scope.archivedBy,
      createdAt: scope.createdAt.toISOString(),
      updatedAt: scope.updatedAt.toISOString(),
      completedAt: scope.completedAt?.toISOString(),
      archivedAt: scope.archivedAt?.toISOString(),
    };
  }

  // ============= SECTIONS =============

  @Get("/{caseId}/scopes/{scopeId}/sections")
  @Security("jwt")
  public async listSections(
    @Request() req: AuthenticatedRequest,
    @Path() caseId: string,
    @Path() scopeId: string,
  ): Promise<SectionResponse[]> {
    const deps = { drizzle: req.drizzle, logger: req.logger };

    const sections = await getSectionsByScopeId(deps, scopeId);

    return sections.map((s) => ({
      id: s.id,
      scopeId: s.scopeId,
      name: s.name,
      description: s.description,
      sortOrder: s.sortOrder,
      isCompleted: s.isCompleted,
      settings: s.settings as Record<string, unknown>,
      createdAt: s.createdAt.toISOString(),
      updatedAt: s.updatedAt.toISOString(),
    }));
  }

  // ============= PROCEDURES =============

  @Get("/{caseId}/scopes/{scopeId}/sections/{sectionId}/procedures")
  @Security("jwt")
  public async listProcedures(
    @Request() req: AuthenticatedRequest,
    @Path() caseId: string,
    @Path() scopeId: string,
    @Path() sectionId: string,
  ): Promise<ProcedureResponse[]> {
    const deps = { drizzle: req.drizzle, logger: req.logger };

    const procedures = await getProceduresBySectionId(deps, sectionId);

    return procedures.map((p) => ({
      id: p.id,
      sectionId: p.sectionId,
      referenceNumber: p.referenceNumber,
      title: p.title,
      description: p.description,
      requirements: p.requirements as Record<string, unknown>,
      sortOrder: p.sortOrder,
      isCompleted: p.isCompleted,
      completedBy: p.completedBy,
      completedAt: p.completedAt?.toISOString(),
      memo: p.memo,
      fieldData: p.fieldData!,
      canEdit: p.canEdit,
      createdAt: p.createdAt.toISOString(),
      updatedAt: p.updatedAt.toISOString(),
    }));
  }

  @Post("/{caseId}/scopes/{scopeId}/sections/{sectionId}/procedures/{procedureId}/complete")
  @Security("jwt")
  public async completeProcedure(
    @Request() req: AuthenticatedRequest,
    @Path() caseId: string,
    @Path() scopeId: string,
    @Path() sectionId: string,
    @Path() procedureId: string,
    @Body() request: CompleteProcedureRequest,
  ): Promise<ProcedureResponse> {
    const userId = req.betterAuthSession?.user.id ?? "";

    return await completeProcedureOp(req.drizzle, userId, caseId, procedureId, request);
  }

  // ============= DOCUMENTS =============

  @Get("/{caseId}/documents")
  @Security("jwt")
  public async listDocuments(
    @Request() req: AuthenticatedRequest,
    @Path() caseId: string,
  ): Promise<DocumentResponse[]> {
    const deps = { drizzle: req.drizzle, logger: req.logger };

    const documents = await getDocumentsByCase(deps, caseId);

    return documents.map((d) => ({
      id: d.id,
      caseId: d.caseId,
      procedureId: d.procedureId,
      fileName: d.fileName,
      fileSize: d.fileSize,
      fileType: d.fileType,
      storagePath: d.storagePath,
      version: d.version,
      parentDocumentId: d.parentDocumentId,
      uploadedBy: d.uploadedBy,
      uploadedAt: d.uploadedAt.toISOString(),
      isDeleted: d.isDeleted,
    }));
  }

  @Post("/{caseId}/documents")
  @Security("jwt")
  @SuccessResponse("201", "Document created successfully")
  public async createDocument(
    @Request() req: AuthenticatedRequest,
    @Path() caseId: string,
    @Body() request: CreateDocumentRequest,
  ): Promise<DocumentResponse> {
    const userId = req.betterAuthSession?.user.id ?? "";
    const deps = { drizzle: req.drizzle, logger: req.logger };

    this.setStatus(201);

    const document = await createDocument(deps, {
      caseId,
      procedureId: request.procedureId,
      fileName: request.fileName,
      fileSize: request.fileSize,
      fileType: request.fileType,
      storagePath: request.storagePath,
      version: request.version ?? undefined,
      parentDocumentId: request.parentDocumentId ?? undefined,
      uploadedBy: userId,
    });

    return {
      id: document.id,
      caseId: document.caseId,
      procedureId: document.procedureId,
      fileName: document.fileName,
      fileSize: document.fileSize,
      fileType: document.fileType,
      storagePath: document.storagePath,
      version: document.version,
      parentDocumentId: document.parentDocumentId,
      uploadedBy: document.uploadedBy,
      uploadedAt: document.uploadedAt.toISOString(),
      isDeleted: document.isDeleted,
    };
  }

  @Delete("/{caseId}/documents/{documentId}")
  @Security("jwt")
  public async deleteDocument(
    @Request() req: AuthenticatedRequest,
    @Path() caseId: string,
    @Path() documentId: string,
  ): Promise<{ success: boolean }> {
    const deps = { drizzle: req.drizzle, logger: req.logger };

    await softDeleteDocument(deps, documentId);

    return { success: true };
  }

  // ============= NOTES =============

  @Get("/{caseId}/notes")
  @Security("jwt")
  public async listNotes(
    @Request() req: AuthenticatedRequest,
    @Path() caseId: string,
  ): Promise<NoteResponse[]> {
    const deps = { drizzle: req.drizzle, logger: req.logger };

    const notes = await getNotesByCase(deps, caseId);

    return notes.map((n) => ({
      id: n.id,
      caseId: n.caseId,
      procedureId: n.procedureId,
      noteType: n.noteType,
      content: n.content,
      createdBy: n.createdBy,
      createdAt: n.createdAt.toISOString(),
      updatedAt: n.updatedAt.toISOString(),
      isEdited: n.isEdited,
    }));
  }

  @Post("/{caseId}/notes")
  @Security("jwt")
  @SuccessResponse("201", "Note created successfully")
  public async createNote(
    @Request() req: AuthenticatedRequest,
    @Path() caseId: string,
    @Body() request: CreateNoteRequest,
  ): Promise<NoteResponse> {
    const userId = req.betterAuthSession?.user.id ?? "";
    const deps = { drizzle: req.drizzle, logger: req.logger };

    this.setStatus(201);

    const note = await createNote(deps, {
      caseId,
      procedureId: request.procedureId,
      noteType: request.noteType,
      content: request.content,
      createdBy: userId,
    });

    return {
      id: note.id,
      caseId: note.caseId,
      procedureId: note.procedureId,
      noteType: note.noteType,
      content: note.content,
      createdBy: note.createdBy,
      createdAt: note.createdAt.toISOString(),
      updatedAt: note.updatedAt.toISOString(),
      isEdited: note.isEdited,
    };
  }

  @Put("/{caseId}/notes/{noteId}")
  @Security("jwt")
  public async updateNote(
    @Request() req: AuthenticatedRequest,
    @Path() caseId: string,
    @Path() noteId: string,
    @Body() request: UpdateNoteRequest,
  ): Promise<NoteResponse> {
    const deps = { drizzle: req.drizzle, logger: req.logger };

    const note = await updateNote(deps, noteId, {
      content: request.content,
    });

    return {
      id: note.id,
      caseId: note.caseId,
      procedureId: note.procedureId,
      noteType: note.noteType,
      content: note.content,
      createdBy: note.createdBy,
      createdAt: note.createdAt.toISOString(),
      updatedAt: note.updatedAt.toISOString(),
      isEdited: note.isEdited,
    };
  }

  // ============= ASSIGNMENTS =============

  @Get("/{caseId}/assignments")
  @Security("jwt")
  public async listAssignments(
    @Request() req: AuthenticatedRequest,
    @Path() caseId: string,
  ): Promise<AssignmentResponse[]> {
    const deps = { drizzle: req.drizzle, logger: req.logger };

    const assignments = await getAssignmentsByCase(deps, caseId);

    return assignments.map((a) => ({
      caseId: a.caseId,
      userId: a.userId,
      role: a.role,
      assignedBy: a.assignedBy,
      assignedAt: a.assignedAt.toISOString(),
    }));
  }

  @Post("/{caseId}/assignments")
  @Security("jwt")
  @SuccessResponse("201", "Assignment created successfully")
  public async createAssignment(
    @Request() req: AuthenticatedRequest,
    @Path() caseId: string,
    @Body() request: CreateAssignmentRequest,
  ): Promise<AssignmentResponse> {
    const userId = req.betterAuthSession?.user.id ?? "";
    const deps = { drizzle: req.drizzle, logger: req.logger };

    this.setStatus(201);

    const assignment = await createAssignment(deps, {
      caseId,
      userId: request.userId,
      role: request.role,
      assignedBy: userId,
    });

    return {
      caseId: assignment.caseId,
      userId: assignment.userId,
      role: assignment.role,
      assignedBy: assignment.assignedBy,
      assignedAt: assignment.assignedAt.toISOString(),
    };
  }

  @Delete("/{caseId}/assignments/{userId}")
  @Security("jwt")
  public async deleteAssignment(
    @Request() req: AuthenticatedRequest,
    @Path() caseId: string,
    @Path() userId: string,
  ): Promise<{ success: boolean }> {
    const deps = { drizzle: req.drizzle, logger: req.logger };

    await deleteAssignment(deps, caseId, userId);

    return { success: true };
  }

  // ============= HISTORY =============

  @Get("/{caseId}/history")
  @Security("jwt")
  public async getHistory(
    @Request() req: AuthenticatedRequest,
    @Path() caseId: string,
  ): Promise<HistoryResponse[]> {
    const deps = { drizzle: req.drizzle, logger: req.logger };

    const history = await getHistoryByCase(deps, caseId);

    return history.map((h) => ({
      id: h.id,
      caseId: h.caseId,
      entityType: h.entityType,
      entityId: h.entityId,
      action: h.action,
      changesBefore: h.changesBefore as Record<string, unknown> | undefined,
      changesAfter: h.changesAfter as Record<string, unknown> | undefined,
      changedBy: h.changedBy,
      changedAt: h.changedAt.toISOString(),
    }));
  }
}
