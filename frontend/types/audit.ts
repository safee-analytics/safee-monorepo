/**
 * DEPRECATED: Use centralized types from @/lib/types/cases for case-related types
 * This file contains only non-case types for backwards compatibility
 */

// Re-export case types from centralized location
export type { CaseStatus, CasePriority, CaseType } from "@/lib/types/cases";

// Non-case types (kept here for backwards compatibility)
export type NotificationType = "deadline" | "review" | "completed" | "team" | "warning";

export interface Notification {
  id: string;
  type: NotificationType;
  title: string;
  description: string;
  timestamp: string;
  read: boolean;
}

export interface TeamActivity {
  id: string;
  userId: string;
  userName: string;
  userAvatar: string;
  action: string;
  description: string;
  timestamp: string;
  icon: "check" | "play" | "edit" | "upload" | "comment";
}

export interface AuditStats {
  activeCases: number;
  activeCasesChange: string;
  activeCasesChangePositive: boolean;
  pendingReviews: number;
  pendingReviewsOverdue: boolean;
  completedAudits: number;
  completionRate: string;
  teamMembers: number;
  teamMembersActive: number;
}

export interface MonthlyAuditData {
  month: string;
  completed: number;
  inProgress: number;
  pending: number;
}

export interface Document {
  id: string;
  name: string;
  type: "pdf" | "docx" | "xlsx" | "pptx" | "zip" | "folder";
  size: string;
  modified: string;
  owner: {
    name: string;
    avatar: string;
  };
  company?: string;
}

export interface Folder {
  id: string;
  name: string;
  type: "folder";
  icon: string;
}
