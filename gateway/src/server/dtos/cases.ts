// TSOA explicit types - cannot import from @safee/database
// These must match the database enums exactly
export type CaseType =
  | "ICV_AUDIT"
  | "ISO_9001_AUDIT"
  | "ISO_14001_AUDIT"
  | "ISO_45001_AUDIT"
  | "FINANCIAL_AUDIT"
  | "INTERNAL_AUDIT"
  | "COMPLIANCE_AUDIT"
  | "OPERATIONAL_AUDIT";

export type CaseCategory = "certification" | "financial" | "operational" | "compliance";

export type CaseStatus = "draft" | "in_progress" | "under_review" | "completed" | "overdue" | "archived";

export type CasePriority = "low" | "medium" | "high" | "critical";

export type AssignmentRole = "lead" | "reviewer" | "team_member";

// Case DTOs
export interface CaseResponse {
  id: string;
  organizationId: string;
  caseNumber: string;
  title: string;
  description?: string | null;
  caseType: CaseType;
  status: CaseStatus;
  priority: CasePriority;
  dueDate?: string | null;
  completedDate?: string | null;
  createdBy: string;
  createdAt: string;
  updatedAt: string;
  assignments?: {
    userId: string | null;
    role: AssignmentRole;
    user?: {
      id: string | null;
      name: string | null;
      email: string;
    };
  }[];
}

export interface CreateCaseRequest {
  caseNumber?: string | null; // Optional - will be auto-generated if not provided
  title: string;
  description?: string | null;
  caseType: CaseType;
  status?: CaseStatus | null;
  priority?: CasePriority | null;
  dueDate?: string | null;
}

export interface UpdateCaseRequest {
  caseNumber?: string | null;
  title?: string | null;
  description?: string | null;
  caseType?: CaseType | null;
  status?: CaseStatus | null;
  priority?: CasePriority | null;
  dueDate?: string | null;
  completedDate?: string | null;
}

// Template DTOs
export type TemplateStructure = {
  sections: {
    name: string;
    description?: string;
    sortOrder: number;
    settings?: Record<string, unknown>;
    procedures: {
      referenceNumber: string;
      title: string;
      description?: string;
      requirements?: Record<string, unknown>;
      sortOrder: number;
    }[];
  }[];
  settings?: Record<string, unknown>;
};

export type TemplateType = "scope" | "form" | "checklist" | "report" | "plan";

export interface TemplateResponse {
  id: string;
  organizationId?: string | null;
  name: string;
  description?: string | null;
  templateType: TemplateType;
  category?: CaseCategory | null;
  version: string;
  isActive: boolean;
  isSystemTemplate: boolean;
  structure: TemplateStructure;
  createdBy: string;
  createdAt: string;
  updatedAt: string;
}

export interface CreateTemplateRequest {
  organizationId?: string | null;
  name: string;
  description?: string | null;
  templateType: TemplateType;
  category?: CaseCategory | null;
  version?: string;
  isActive?: boolean;
  isSystemTemplate?: boolean;
  structure: TemplateStructure;
}

export type AuditStatus = "draft" | "in_progress" | "under_review" | "completed" | "archived";

// Scope DTOs
export interface ScopeResponse {
  id: string;
  caseId: string;
  templateId?: string | null;
  name: string;
  description?: string | null;
  status: AuditStatus;
  data: Record<string, unknown>;
  createdBy: string;
  completedBy?: string | null;
  archivedBy?: string | null;
  createdAt: string;
  updatedAt: string;
  completedAt?: string | null;
  archivedAt?: string | null;
}

export interface CreateScopeRequest {
  name: string;
  description?: string | null;
  status?: AuditStatus | null;
  data?: Record<string, unknown> | null;
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
  description?: string | null;
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
  description?: string | null;
  requirements: Record<string, unknown>;
  sortOrder: number;
  isCompleted: boolean;
  completedBy?: string | null;
  completedAt?: string | null;
  memo?: string | null;
  fieldData: Record<string, unknown>;
  canEdit: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface CompleteProcedureRequest {
  fieldData?: Record<string, unknown> | null;
  memo?: string | null;
}

// Document DTOs
export interface DocumentResponse {
  id: string;
  caseId: string;
  procedureId?: string | null;
  fileName: string;
  fileSize: number;
  fileType: string;
  storagePath: string;
  version: number;
  parentDocumentId?: string | null;
  uploadedBy: string;
  uploadedAt: string;
  isDeleted: boolean;
}

export interface CreateDocumentRequest {
  procedureId?: string | null;
  fileName: string;
  fileSize: number;
  fileType: string;
  storagePath: string;
  version?: number | null;
  parentDocumentId?: string | null;
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
  procedureId?: string | null;
  noteType: NoteType;
  content: string;
  createdBy: string;
  createdAt: string;
  updatedAt: string;
  isEdited: boolean;
}

export interface CreateNoteRequest {
  procedureId?: string | null;
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
  changesBefore?: Record<string, unknown> | null;
  changesAfter?: Record<string, unknown> | null;
  changedBy: string;
  changedAt: string;
}
