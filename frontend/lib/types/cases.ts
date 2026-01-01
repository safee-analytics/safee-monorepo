/**
 * Centralized Case Types - Single Source of Truth
 * All types are re-exported from gateway OpenAPI spec
 * DO NOT duplicate type definitions here
 */

import type { components } from "@/lib/api/types/audit";





export type CaseResponse = components["schemas"]["CaseResponse"];
export type CreateCaseRequest = components["schemas"]["CreateCaseRequest"];
export type UpdateCaseRequest = components["schemas"]["UpdateCaseRequest"];





export type CaseType = components["schemas"]["CaseType"];
export type CaseStatus = components["schemas"]["CaseStatus"];
export type CasePriority = components["schemas"]["CasePriority"];
export type AssignmentRole = components["schemas"]["AssignmentRole"];





export type TemplateType = components["schemas"]["TemplateType"];
export type CaseCategory = components["schemas"]["CaseCategory"];
export type TemplateStructure = components["schemas"]["TemplateStructure"];
export type TemplateResponse = components["schemas"]["TemplateResponse"];
export type CreateTemplateRequest = components["schemas"]["CreateTemplateRequest"];





export type AuditStatus = components["schemas"]["AuditStatus"];
export type ScopeResponse = components["schemas"]["ScopeResponse"];
export type CreateScopeRequest = components["schemas"]["CreateScopeRequest"];
export type CreateScopeFromTemplateRequest = components["schemas"]["CreateScopeFromTemplateRequest"];
export type UpdateScopeStatusRequest = components["schemas"]["UpdateScopeStatusRequest"];





export type SectionResponse = components["schemas"]["SectionResponse"];
export type ProcedureResponse = components["schemas"]["ProcedureResponse"];
export type CompleteProcedureRequest = components["schemas"]["CompleteProcedureRequest"];





export type DocumentResponse = components["schemas"]["DocumentResponse"];
export type CreateDocumentRequest = components["schemas"]["CreateDocumentRequest"];
export type NoteType = components["schemas"]["NoteType"];
export type NoteResponse = components["schemas"]["NoteResponse"];
export type CreateNoteRequest = components["schemas"]["CreateNoteRequest"];
export type UpdateNoteRequest = components["schemas"]["UpdateNoteRequest"];





export type AssignmentResponse = components["schemas"]["AssignmentResponse"];
export type CreateAssignmentRequest = components["schemas"]["CreateAssignmentRequest"];
export type CaseEntityType = components["schemas"]["CaseEntityType"];
export type CaseAction = components["schemas"]["CaseAction"];
export type HistoryResponse = components["schemas"]["HistoryResponse"];







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
