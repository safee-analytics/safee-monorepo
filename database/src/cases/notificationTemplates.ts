import type { NotificationType, RelatedEntityType } from "../drizzle/index.js";

export interface NotificationTemplate {
  type: NotificationType;
  title: string;
  description: string;
  actionLabel?: string;
  actionUrlPattern?: string; // URL pattern with variables like /audit/cases/{{caseId}}
  relatedEntityType?: RelatedEntityType;
}

export type TemplateVariables = Record<string, string | number | undefined>;

export function interpolateTemplate(template: string, variables: TemplateVariables): string {
  return template.replace(/\{\{(\w+)\}\}/g, (match, key: string) => {
    const value = variables[key];
    return value !== undefined ? String(value) : match;
  });
}

export const NOTIFICATION_TEMPLATES: Record<string, NotificationTemplate> = {
  CASE_CREATED: {
    type: "case_created",
    title: "New case created",
    description: "Case {{caseNumber}} for {{clientName}} has been created",
    actionLabel: "View Case",
    actionUrlPattern: "/audit/cases/{{caseId}}",
    relatedEntityType: "case",
  },

  CASE_ASSIGNED: {
    type: "assignment",
    title: "Case assigned to you",
    description: "You have been assigned to case {{caseNumber}} for {{clientName}}",
    actionLabel: "View Case",
    actionUrlPattern: "/audit/cases/{{caseId}}",
    relatedEntityType: "case",
  },

  CASE_STATUS_CHANGED: {
    type: "case_update",
    title: "Case status updated",
    description: "Case {{caseNumber}} status changed to {{status}}",
    actionLabel: "View Case",
    actionUrlPattern: "/audit/cases/{{caseId}}",
    relatedEntityType: "case",
  },

  CASE_COMPLETED: {
    type: "completed",
    title: "Case completed",
    description: "{{userName}} completed case {{caseNumber}} for {{clientName}}",
    actionLabel: "View Case",
    actionUrlPattern: "/audit/cases/{{caseId}}",
    relatedEntityType: "case",
  },

  DEADLINE_APPROACHING: {
    type: "deadline",
    title: "Case deadline approaching",
    description: "Case {{caseNumber}} for {{clientName}} is due in {{daysRemaining}} days",
    actionLabel: "View Case",
    actionUrlPattern: "/audit/cases/{{caseId}}",
    relatedEntityType: "case",
  },

  DEADLINE_OVERDUE: {
    type: "deadline",
    title: "Case overdue",
    description: "Case {{caseNumber}} for {{clientName}} is now overdue",
    actionLabel: "Review Case",
    actionUrlPattern: "/audit/cases/{{caseId}}",
    relatedEntityType: "case",
  },

  REVIEW_REQUIRED: {
    type: "review",
    title: "Review required",
    description: "Case {{caseNumber}} requires your review",
    actionLabel: "Review Now",
    actionUrlPattern: "/audit/cases/{{caseId}}",
    relatedEntityType: "case",
  },

  REVIEW_COMPLETED: {
    type: "review",
    title: "Review completed",
    description: "{{userName}} completed review for case {{caseNumber}}",
    actionLabel: "View Case",
    actionUrlPattern: "/audit/cases/{{caseId}}",
    relatedEntityType: "case",
  },

  DOCUMENT_UPLOADED: {
    type: "document",
    title: "Document uploaded",
    description: "{{userName}} uploaded a document to case {{caseNumber}}",
    actionLabel: "View Document",
    actionUrlPattern: "/audit/cases/{{caseId}}/documents",
    relatedEntityType: "document",
  },

  TEAM_MEMBER_ADDED: {
    type: "team",
    title: "New team member",
    description: "{{userName}} joined the audit team",
    actionLabel: "View Team",
    actionUrlPattern: "/audit/team",
    relatedEntityType: "user",
  },

  APPROVAL_PENDING: {
    type: "approval_requested",
    title: "Approval required",
    description: "{{itemDescription}} requires your approval",
    actionLabel: "Review",
    actionUrlPattern: "/approvals/{{approvalId}}",
    relatedEntityType: "approval",
  },

  APPROVAL_APPROVED: {
    type: "approval_approved",
    title: "Approval granted",
    description: "{{userName}} approved {{itemDescription}}",
    actionLabel: "View Details",
    actionUrlPattern: "/approvals/{{approvalId}}",
    relatedEntityType: "approval",
  },

  APPROVAL_REJECTED: {
    type: "approval_rejected",
    title: "Approval rejected",
    description: "{{userName}} rejected {{itemDescription}}",
    actionLabel: "View Details",
    actionUrlPattern: "/approvals/{{approvalId}}",
    relatedEntityType: "approval",
  },
};

export function buildNotificationFromTemplate(
  templateKey: keyof typeof NOTIFICATION_TEMPLATES,
  variables: TemplateVariables,
): {
  type: NotificationType;
  title: string;
  description: string;
  actionLabel?: string;
  actionUrl?: string;
  relatedEntityType?: RelatedEntityType;
} {
  const template = NOTIFICATION_TEMPLATES[templateKey];

  return {
    type: template.type,
    title: interpolateTemplate(template.title, variables),
    description: interpolateTemplate(template.description, variables),
    actionLabel: template.actionLabel,
    actionUrl: template.actionUrlPattern
      ? interpolateTemplate(template.actionUrlPattern, variables)
      : undefined,
    relatedEntityType: template.relatedEntityType,
  };
}
