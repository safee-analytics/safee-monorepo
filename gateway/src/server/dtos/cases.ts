// Case DTOs
export interface CaseResponse {
  id: string;
  organizationId: string;
  caseNumber: string;
  clientName: string;
  auditType: string;
  status: "pending" | "in-progress" | "under-review" | "completed" | "overdue" | "archived";
  priority: "low" | "medium" | "high" | "critical";
  dueDate?: string;
  completedDate?: string;
  createdBy: string;
  createdAt: string;
  updatedAt: string;
}

export interface CreateCaseRequest {
  caseNumber: string;
  clientName: string;
  auditType: string;
  status?: "pending" | "in-progress" | "under-review" | "completed" | "overdue" | "archived";
  priority?: "low" | "medium" | "high" | "critical";
  dueDate?: string;
}

export interface UpdateCaseRequest {
  caseNumber?: string;
  clientName?: string;
  auditType?: string;
  status?: "pending" | "in-progress" | "under-review" | "completed" | "overdue" | "archived";
  priority?: "low" | "medium" | "high" | "critical";
  dueDate?: string;
  completedDate?: string;
}

// Template DTOs
export type TemplateStructure = {
  sections: Array<{
    name: string;
    description?: string;
    sortOrder: number;
    settings?: Record<string, unknown>;
    procedures: Array<{
      referenceNumber: string;
      title: string;
      description?: string;
      requirements?: Record<string, unknown>;
      sortOrder: number;
    }>;
  }>;
  settings?: Record<string, unknown>;
};

export interface TemplateResponse {
  id: string;
  organizationId?: string;
  name: string;
  description?: string;
  auditType: string;
  category?: string;
  version: string;
  isActive: boolean;
  isPublic: boolean;
  structure: TemplateStructure;
  createdBy: string;
  createdAt: string;
  updatedAt: string;
}

export interface CreateTemplateRequest {
  organizationId?: string;
  name: string;
  description?: string;
  auditType: string;
  category?: string;
  version?: string;
  isActive?: boolean;
  isPublic?: boolean;
  structure: TemplateStructure;
}

// Scope DTOs
export interface ScopeResponse {
  id: string;
  caseId: string;
  templateId?: string;
  name: string;
  description?: string;
  status: "draft" | "in-progress" | "under-review" | "completed" | "archived";
  metadata: Record<string, unknown>;
  createdBy: string;
  completedBy?: string;
  archivedBy?: string;
  createdAt: string;
  updatedAt: string;
  completedAt?: string;
  archivedAt?: string;
}

export interface CreateScopeRequest {
  name: string;
  description?: string;
  status?: "draft" | "in-progress" | "under-review" | "completed" | "archived";
  metadata?: Record<string, unknown>;
}

export interface CreateScopeFromTemplateRequest {
  templateId: string;
}

export interface UpdateScopeStatusRequest {
  status: "draft" | "in-progress" | "under-review" | "completed" | "archived";
}

// Section DTOs
export interface SectionResponse {
  id: string;
  scopeId: string;
  name: string;
  description?: string;
  sortOrder: number;
  isCompleted: boolean;
  settings: Record<string, unknown>;
  createdAt: string;
  updatedAt: string;
}

// Procedure DTOs
export interface ProcedureResponse {
  id: string;
  sectionId: string;
  referenceNumber: string;
  title: string;
  description?: string;
  requirements: Record<string, unknown>;
  sortOrder: number;
  isCompleted: boolean;
  completedBy?: string;
  completedAt?: string;
  memo?: string;
  fieldData: Record<string, unknown>;
  canEdit: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface CompleteProcedureRequest {
  fieldData?: Record<string, unknown>;
  memo?: string;
}

// Document DTOs
export interface DocumentResponse {
  id: string;
  caseId: string;
  procedureId?: string;
  fileName: string;
  fileSize: number;
  fileType: string;
  storagePath: string;
  version: number;
  parentDocumentId?: string;
  uploadedBy: string;
  uploadedAt: string;
  isDeleted: boolean;
}

export interface CreateDocumentRequest {
  procedureId?: string;
  fileName: string;
  fileSize: number;
  fileType: string;
  storagePath: string;
  version?: number;
  parentDocumentId?: string;
}

// Note DTOs
export interface NoteResponse {
  id: string;
  caseId: string;
  procedureId?: string;
  noteType: "observation" | "review_comment" | "general" | "memo";
  content: string;
  createdBy: string;
  createdAt: string;
  updatedAt: string;
  isEdited: boolean;
}

export interface CreateNoteRequest {
  procedureId?: string;
  noteType: "observation" | "review_comment" | "general" | "memo";
  content: string;
}

export interface UpdateNoteRequest {
  content: string;
}

// Assignment DTOs
export interface AssignmentResponse {
  caseId: string;
  userId: string;
  role: "lead" | "reviewer" | "team_member";
  assignedBy: string;
  assignedAt: string;
}

export interface CreateAssignmentRequest {
  userId: string;
  role: "lead" | "reviewer" | "team_member";
}

// History DTOs
export interface HistoryResponse {
  id: string;
  caseId: string;
  entityType: string;
  entityId: string;
  action: string;
  changesBefore?: Record<string, unknown>;
  changesAfter?: Record<string, unknown>;
  changedBy: string;
  changedAt: string;
}
