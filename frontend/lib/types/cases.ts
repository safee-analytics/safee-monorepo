/**
 * Centralized Case Types - Single Source of Truth
 * All types are re-exported from gateway OpenAPI spec
 * DO NOT duplicate type definitions here
 */

import type { components } from "@/lib/api/types/audit";

// ============================================================================
// Core Case Types (from Gateway)
// ============================================================================

export type CaseResponse = components["schemas"]["CaseResponse"];
export type CreateCaseRequest = components["schemas"]["CreateCaseRequest"];
export type UpdateCaseRequest = components["schemas"]["UpdateCaseRequest"];

// ============================================================================
// Enums (from Gateway)
// ============================================================================

export type CaseType = components["schemas"]["CaseType"];
export type CaseStatus = components["schemas"]["CaseStatus"];
export type CasePriority = components["schemas"]["CasePriority"];
export type AssignmentRole = components["schemas"]["AssignmentRole"];

// ============================================================================
// Template Types (from Gateway)
// ============================================================================

export type TemplateType = components["schemas"]["TemplateType"];
export type CaseCategory = components["schemas"]["CaseCategory"];
export type TemplateStructure = components["schemas"]["TemplateStructure"];
export type TemplateResponse = components["schemas"]["TemplateResponse"];
export type CreateTemplateRequest = components["schemas"]["CreateTemplateRequest"];

// ============================================================================
// Scope Types (from Gateway)
// ============================================================================

export type AuditStatus = components["schemas"]["AuditStatus"];
export type ScopeResponse = components["schemas"]["ScopeResponse"];
export type CreateScopeRequest = components["schemas"]["CreateScopeRequest"];
export type CreateScopeFromTemplateRequest = components["schemas"]["CreateScopeFromTemplateRequest"];
export type UpdateScopeStatusRequest = components["schemas"]["UpdateScopeStatusRequest"];

// ============================================================================
// Section & Procedure Types (from Gateway)
// ============================================================================

export type SectionResponse = components["schemas"]["SectionResponse"];
export type ProcedureResponse = components["schemas"]["ProcedureResponse"];
export type CompleteProcedureRequest = components["schemas"]["CompleteProcedureRequest"];

// ============================================================================
// Document & Note Types (from Gateway)
// ============================================================================

export type DocumentResponse = components["schemas"]["DocumentResponse"];
export type CreateDocumentRequest = components["schemas"]["CreateDocumentRequest"];
export type NoteType = components["schemas"]["NoteType"];
export type NoteResponse = components["schemas"]["NoteResponse"];
export type CreateNoteRequest = components["schemas"]["CreateNoteRequest"];
export type UpdateNoteRequest = components["schemas"]["UpdateNoteRequest"];

// ============================================================================
// Assignment & History Types (from Gateway)
// ============================================================================

export type AssignmentResponse = components["schemas"]["AssignmentResponse"];
export type CreateAssignmentRequest = components["schemas"]["CreateAssignmentRequest"];
export type CaseEntityType = components["schemas"]["CaseEntityType"];
export type CaseAction = components["schemas"]["CaseAction"];
export type HistoryResponse = components["schemas"]["HistoryResponse"];

// ============================================================================
// UI-Specific Types (Derived from Gateway Types)
// ============================================================================

/**
 * Case assignment data for UI
 */
export type CaseAssignment = {
  userId: string | null;
  role: AssignmentRole;
  user?: {
    id: string | null;
    name: string | null;
    email: string;
  };
};

/**
 * Case data for display in lists/tables
 * Matches CaseResponse but simplified for UI
 */
export type CaseData = {
  id: string;
  caseNumber: string;
  title: string;
  caseType: CaseType;
  status: CaseStatus;
  priority: CasePriority;
  dueDate?: string | null;
  createdBy: string;
  createdAt: string;
  updatedAt: string;
  description?: string | null;
  completedDate?: string | null;
  assignments?: CaseAssignment[];
};

/**
 * Case row data for table/grid/kanban views
 * Extended with UI-specific fields
 */
export type CaseRow = {
  id: string;
  caseId: string;
  caseType: CaseType;
  companyName: string;
  industry: string;
  assignee: {
    name: string;
    avatar: string;
    id?: string;
  };
  status: CaseStatus;
  priority: CasePriority;
  dueDate: string;
  progress: number;
  icon: string;
  iconBg: string;
};

// ============================================================================
// Type Guards
// ============================================================================

export function isCaseStatus(value: string): value is CaseStatus {
  return ["draft", "in_progress", "under_review", "completed", "overdue", "archived"].includes(value);
}

export function isCasePriority(value: string): value is CasePriority {
  return ["low", "medium", "high", "critical"].includes(value);
}

export function isCaseType(value: string): value is CaseType {
  return [
    "ICV_AUDIT",
    "ISO_9001_AUDIT",
    "ISO_14001_AUDIT",
    "ISO_45001_AUDIT",
    "FINANCIAL_AUDIT",
    "INTERNAL_AUDIT",
    "COMPLIANCE_AUDIT",
    "OPERATIONAL_AUDIT",
  ].includes(value);
}

// ============================================================================
// Constants
// ============================================================================

export const CASE_STATUSES: CaseStatus[] = [
  "draft",
  "in_progress",
  "under_review",
  "completed",
  "overdue",
  "archived",
];

export const CASE_PRIORITIES: CasePriority[] = ["low", "medium", "high", "critical"];

export const CASE_TYPES: CaseType[] = [
  "ICV_AUDIT",
  "ISO_9001_AUDIT",
  "ISO_14001_AUDIT",
  "ISO_45001_AUDIT",
  "FINANCIAL_AUDIT",
  "INTERNAL_AUDIT",
  "COMPLIANCE_AUDIT",
  "OPERATIONAL_AUDIT",
];

export const TEMPLATE_TYPES: TemplateType[] = ["scope", "form", "checklist", "report", "plan"];

export const CASE_CATEGORIES: CaseCategory[] = ["certification", "financial", "operational", "compliance"];

// ============================================================================
// Display Helpers
// ============================================================================

export const CASE_TYPE_LABELS: Record<CaseType, string> = {
  ICV_AUDIT: "ICV Audit",
  ISO_9001_AUDIT: "ISO 9001 Audit",
  ISO_14001_AUDIT: "ISO 14001 Audit",
  ISO_45001_AUDIT: "ISO 45001 Audit",
  FINANCIAL_AUDIT: "Financial Audit",
  INTERNAL_AUDIT: "Internal Audit",
  COMPLIANCE_AUDIT: "Compliance Audit",
  OPERATIONAL_AUDIT: "Operational Audit",
};

export const CASE_STATUS_LABELS: Record<CaseStatus, string> = {
  draft: "Draft",
  in_progress: "In Progress",
  under_review: "Under Review",
  completed: "Completed",
  overdue: "Overdue",
  archived: "Archived",
};

export const CASE_PRIORITY_LABELS: Record<CasePriority, string> = {
  low: "Low",
  medium: "Medium",
  high: "High",
  critical: "Critical",
};
