export type CaseStatus = "in-progress" | "completed" | "overdue" | "pending" | "in-review";
export type CasePriority = "high" | "medium" | "low";
export type NotificationType = "deadline" | "review" | "completed" | "team" | "warning";

export interface AuditCase {
  id: string;
  companyName: string;
  auditType: string;
  status: CaseStatus;
  priority: CasePriority;
  dueDate: string;
  assignedTo: string[];
  completedDate?: string;
  icon?: string;
  color?: string;
}

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
