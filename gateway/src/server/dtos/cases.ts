// TSOA explicit types - cannot import from @safee/database
// These must match the database enums exactly
export type AuditType =
  | "ICV"
  | "ISO_9001"
  | "ISO_14001"
  | "ISO_45001"
  | "financial_audit"
  | "internal_audit"
  | "compliance_audit"
  | "operational_audit";

export type AuditCategory = "certification" | "financial" | "operational" | "compliance";

export type CaseStatus = "pending" | "in-progress" | "under-review" | "completed" | "overdue" | "archived";

export type CasePriority = "low" | "medium" | "high" | "critical";

export type AssignmentRole = "lead" | "reviewer" | "team_member";

// Case DTOs
export interface CaseResponse {
  id: string;
  organizationId: string;
  caseNumber: string;
  clientName: string;
  auditType: AuditType;
  status: CaseStatus;
  priority: CasePriority;
  dueDate?: string;
  completedDate?: string;
  createdBy: string;
  createdAt: string;
  updatedAt: string;
  assignments?: Array<{
    userId: string;
    role: AssignmentRole;
    user?: {
      id: string;
      name: string | null;
      email: string;
    };
  }>;
}

export interface CreateCaseRequest {
  caseNumber?: string; // Optional - will be auto-generated if not provided
  clientName: string;
  auditType: AuditType;
  status?: CaseStatus;
  priority?: CasePriority;
  dueDate?: string;
}

export interface UpdateCaseRequest {
  caseNumber?: string;
  clientName?: string;
  auditType?: AuditType;
  status?: CaseStatus;
  priority?: CasePriority;
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
  auditType: AuditType;
  category?: AuditCategory;
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
  auditType: AuditType;
  category?: AuditCategory;
  version?: string;
  isActive?: boolean;
  isPublic?: boolean;
  structure: TemplateStructure;
}

export type AuditStatus = "draft" | "in-progress" | "under-review" | "completed" | "archived";

// Scope DTOs
export interface ScopeResponse {
  id: string;
  caseId: string;
  templateId?: string;
  name: string;
  description?: string;
  status: AuditStatus;
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
  status?: AuditStatus;
  metadata?: Record<string, unknown>;
}

export interface CreateScopeFromTemplateRequest {
  templateId: string;
}

export interface UpdateScopeStatusRequest {
  status: AuditStatus;
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

export type NoteType = "observation" | "review_comment" | "general" | "memo";

export type CaseEntityType = "case" | "scope" | "section" | "procedure" | "document" | "note";

export type CaseAction =
  | "created"
  | "updated"
  | "deleted"
  | "completed"
  | "archived"
  | "assigned"
  | "unassigned";

// Note DTOs
export interface NoteResponse {
  id: string;
  caseId: string;
  procedureId?: string;
  noteType: NoteType;
  content: string;
  createdBy: string;
  createdAt: string;
  updatedAt: string;
  isEdited: boolean;
}

export interface CreateNoteRequest {
  procedureId?: string;
  noteType: NoteType;
  content: string;
}

export interface UpdateNoteRequest {
  content: string;
}

// Assignment DTOs
export interface AssignmentResponse {
  caseId: string;
  userId: string;
  role: AssignmentRole;
  assignedBy: string;
  assignedAt: string;
}

export interface CreateAssignmentRequest {
  userId: string;
  role: AssignmentRole;
}

// History DTOs
export interface HistoryResponse {
  id: string;
  caseId: string;
  entityType: CaseEntityType;
  entityId: string;
  action: CaseAction;
  changesBefore?: Record<string, unknown>;
  changesAfter?: Record<string, unknown>;
  changedBy: string;
  changedAt: string;
}
