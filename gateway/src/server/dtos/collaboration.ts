export type ActivityType =
  | "case_created"
  | "status_changed"
  | "priority_updated"
  | "document_uploaded"
  | "document_approved"
  | "document_rejected"
  | "comment_added"
  | "team_member_assigned"
  | "team_member_removed"
  | "case_completed"
  | "case_archived"
  | "scope_created"
  | "procedure_completed"
  | "plan_created"
  | "report_generated";

export interface CaseActivityResponse {
  id: string;
  caseId: string;
  activityType: ActivityType;
  userId?: string;
  user?: {
    id: string;
    name: string | null;
    email: string;
  };
  metadata?: {
    caseName?: string;
    oldValue?: string;
    newValue?: string;
    documentName?: string;
    documentId?: string;
    userName?: string;
    assignedUserId?: string;
    assignedUserName?: string;
    commentId?: string;
    scopeId?: string;
    planId?: string;
    reportId?: string;
    [key: string]: unknown;
  } | null;
  isRead?: Record<string, boolean> | null;
  createdAt: Date;
}

export interface CreateCaseActivityRequest {
  caseId: string;
  activityType: ActivityType;
  metadata?: {
    caseName?: string;
    oldValue?: string;
    newValue?: string;
    documentName?: string;
    documentId?: string;
    userName?: string;
    assignedUserId?: string;
    assignedUserName?: string;
    commentId?: string;
    scopeId?: string;
    planId?: string;
    reportId?: string;
    [key: string]: unknown;
  };
}

export interface PresenceResponse {
  id: string;
  caseId: string;
  userId: string;
  user?: {
    id: string;
    name: string | null;
    email: string;
  };
  lastSeenAt: Date;
}

export interface UpdatePresenceRequest {
  caseId: string;
}

export interface MarkAsReadRequest {
  activityIds: string[];
}
