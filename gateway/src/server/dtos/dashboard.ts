/**
 * Dashboard DTOs
 */

/**
 * Notification type - matches database enum
 */
export type NotificationType =
  | "deadline"
  | "review"
  | "completed"
  | "team"
  | "assignment"
  | "comment"
  | "mention"
  | "reminder"
  | "alert"
  | "warning"
  | "error"
  | "info"
  | "success"
  | "approval_requested"
  | "approval_approved"
  | "approval_rejected"
  | "approval_cancelled"
  | "approval_reminder"
  | "request_submitted"
  | "request_updated"
  | "request_withdrawn"
  | "request_escalated"
  | "case_update"
  | "case_created"
  | "case_assigned"
  | "case_completed"
  | "case_overdue"
  | "case_archived"
  | "document"
  | "document_uploaded"
  | "document_reviewed"
  | "document_approved"
  | "document_rejected"
  | "invoice_created"
  | "invoice_submitted"
  | "invoice_approved"
  | "invoice_rejected"
  | "invoice_paid"
  | "invoice_overdue"
  | "invoice_cancelled"
  | "payment_received"
  | "payment_sent"
  | "payment_failed"
  | "payment_pending"
  | "bill_created"
  | "bill_submitted"
  | "bill_approved"
  | "bill_rejected"
  | "bill_paid"
  | "bill_overdue"
  | "expense_submitted"
  | "expense_approved"
  | "expense_rejected"
  | "expense_reimbursed"
  | "leave_requested"
  | "leave_approved"
  | "leave_rejected"
  | "leave_cancelled"
  | "leave_reminder"
  | "payslip_generated"
  | "payslip_available"
  | "contract_created"
  | "contract_expiring"
  | "contract_expired"
  | "contract_renewed"
  | "employee_onboarded"
  | "employee_offboarded"
  | "timesheet_submitted"
  | "timesheet_approved"
  | "timesheet_rejected"
  | "deal_created"
  | "deal_updated"
  | "deal_won"
  | "deal_lost"
  | "deal_assigned"
  | "contact_added"
  | "contact_updated"
  | "task_assigned"
  | "task_completed"
  | "task_overdue"
  | "task_reminder"
  | "meeting_scheduled"
  | "meeting_reminder"
  | "meeting_cancelled"
  | "follow_up_due";

/**
 * Related entity type for notifications - matches database enum
 */
export type RelatedEntityType =
  | "case"
  | "document"
  | "audit_template"
  | "audit_scope"
  | "audit_section"
  | "audit_procedure"
  | "approval"
  | "approval_request"
  | "invoice"
  | "bill"
  | "payment"
  | "account"
  | "journal"
  | "employee"
  | "payslip"
  | "leave_request"
  | "leave_allocation"
  | "contract"
  | "department"
  | "contact"
  | "deal"
  | "task"
  | "organization"
  | "user"
  | "team";

/**
 * Dashboard statistics response
 */
export interface DashboardStatsResponse {
  activeCases: number;
  pendingReviews: number;
  completedAudits: number;
  totalCases: number;
  completionRate: number;
}

/**
 * Case activity item
 */
export interface RecentCaseUpdateResponse {
  id: string;
  type: "case_update";
  caseId: string;
  caseNumber: string;
  title: string;
  status: string;
  updatedAt: string;
  updatedBy: {
    id: string;
    name: string;
  };
}

/**
 * Notification response
 */
export interface NotificationResponse {
  id: string;
  /** Notification type: info, success, warning, or error */
  type: NotificationType;
  title: string;
  description: string;
  timestamp: string;
  isRead: boolean;
  /** Related entity type (case, user, document, etc.) */
  relatedEntityType: RelatedEntityType | null;
  relatedEntityId: string | null;
  actionLabel: string | null;
  actionUrl: string | null;
}

/**
 * Unread notifications count response
 */
export interface UnreadNotificationsCountResponse {
  count: number;
}
