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
  userId?: string | null;
  user?: {
    id: string | null;
    name: string | null;
    email: string;
  };
  metadata?: {
    caseName?: string | null;
    oldValue?: string | null;
    newValue?: string | null;
    documentName?: string | null;
    documentId?: string | null;
    userName?: string | null;
    assignedUserId?: string | null;
    assignedUserName?: string | null;
    commentId?: string | null;
    scopeId?: string | null;
    planId?: string | null;
    reportId?: string | null;
    [key: string]: unknown;
  } | null;
  isRead?: Record<string, boolean> | null;
  createdAt: Date;
}

export interface CreateCaseActivityRequest {
  caseId: string;
  activityType: ActivityType;
  metadata?: {
    caseName?: string | null;
    oldValue?: string | null;
    newValue?: string | null;
    documentName?: string | null;
    documentId?: string | null;
    userName?: string | null;
    assignedUserId?: string | null;
    assignedUserName?: string | null;
    commentId?: string | null;
    scopeId?: string | null;
    planId?: string | null;
    reportId?: string | null;
    [key: string]: unknown;
  };
}

export interface PresenceResponse {
  id: string;
  caseId: string;
  userId: string;
  user?: {
    id: string | null;
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
