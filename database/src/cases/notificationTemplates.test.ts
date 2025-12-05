import { describe, it, expect } from "vitest";
import {
  interpolateTemplate,
  buildNotificationFromTemplate,
  NOTIFICATION_TEMPLATES,
} from "./notificationTemplates.js";

describe("Notification Templates", () => {
  describe("interpolateTemplate", () => {
    it("should replace single variable", () => {
      const result = interpolateTemplate("Hello {{name}}", { name: "John" });
      expect(result).toBe("Hello John");
    });

    it("should replace multiple variables", () => {
      const result = interpolateTemplate("{{greeting}} {{name}}, your order {{orderId}} is ready", {
        greeting: "Hello",
        name: "Jane",
        orderId: "12345",
      });
      expect(result).toBe("Hello Jane, your order 12345 is ready");
    });

    it("should handle numeric variables", () => {
      const result = interpolateTemplate("You have {{count}} unread messages", { count: 42 });
      expect(result).toBe("You have 42 unread messages");
    });

    it("should leave undefined variables unchanged", () => {
      const result = interpolateTemplate("Hello {{name}}, {{greeting}}", { name: "John" });
      expect(result).toBe("Hello John, {{greeting}}");
    });

    it("should handle empty template", () => {
      const result = interpolateTemplate("", { name: "John" });
      expect(result).toBe("");
    });

    it("should handle template with no variables", () => {
      const result = interpolateTemplate("Hello World", { name: "John" });
      expect(result).toBe("Hello World");
    });

    it("should handle empty variables object", () => {
      const result = interpolateTemplate("Hello {{name}}", {});
      expect(result).toBe("Hello {{name}}");
    });

    it("should handle repeated variables", () => {
      const result = interpolateTemplate("{{name}} loves {{name}}", { name: "Alice" });
      expect(result).toBe("Alice loves Alice");
    });
  });

  describe("buildNotificationFromTemplate", () => {
    it("should build notification from CASE_CREATED template", () => {
      const notification = buildNotificationFromTemplate("CASE_CREATED", {
        caseNumber: "CASE-001",
        clientName: "Acme Corp",
        caseId: "abc-123",
      });

      expect(notification).toEqual({
        type: "case_created",
        title: "New case created",
        description: "Case CASE-001 for Acme Corp has been created",
        actionLabel: "View Case",
        actionUrl: "/audit/cases/abc-123",
        relatedEntityType: "case",
      });
    });

    it("should build notification from CASE_ASSIGNED template", () => {
      const notification = buildNotificationFromTemplate("CASE_ASSIGNED", {
        caseNumber: "CASE-002",
        clientName: "Beta Inc",
        caseId: "def-456",
      });

      expect(notification).toEqual({
        type: "assignment",
        title: "Case assigned to you",
        description: "You have been assigned to case CASE-002 for Beta Inc",
        actionLabel: "View Case",
        actionUrl: "/audit/cases/def-456",
        relatedEntityType: "case",
      });
    });

    it("should build notification from DEADLINE_APPROACHING template", () => {
      const notification = buildNotificationFromTemplate("DEADLINE_APPROACHING", {
        caseNumber: "CASE-003",
        clientName: "Gamma LLC",
        daysRemaining: 3,
        caseId: "ghi-789",
      });

      expect(notification).toEqual({
        type: "deadline",
        title: "Case deadline approaching",
        description: "Case CASE-003 for Gamma LLC is due in 3 days",
        actionLabel: "View Case",
        actionUrl: "/audit/cases/ghi-789",
        relatedEntityType: "case",
      });
    });

    it("should build notification from CASE_COMPLETED template", () => {
      const notification = buildNotificationFromTemplate("CASE_COMPLETED", {
        userName: "John Doe",
        caseNumber: "CASE-004",
        clientName: "Delta Corp",
        caseId: "jkl-012",
      });

      expect(notification).toEqual({
        type: "completed",
        title: "Case completed",
        description: "John Doe completed case CASE-004 for Delta Corp",
        actionLabel: "View Case",
        actionUrl: "/audit/cases/jkl-012",
        relatedEntityType: "case",
      });
    });

    it("should build notification from REVIEW_REQUIRED template", () => {
      const notification = buildNotificationFromTemplate("REVIEW_REQUIRED", {
        caseNumber: "CASE-005",
        caseId: "mno-345",
      });

      expect(notification).toEqual({
        type: "review",
        title: "Review required",
        description: "Case CASE-005 requires your review",
        actionLabel: "Review Now",
        actionUrl: "/audit/cases/mno-345",
        relatedEntityType: "case",
      });
    });

    it("should build notification from DOCUMENT_UPLOADED template", () => {
      const notification = buildNotificationFromTemplate("DOCUMENT_UPLOADED", {
        userName: "Jane Smith",
        caseNumber: "CASE-006",
        caseId: "pqr-678",
      });

      expect(notification).toEqual({
        type: "document",
        title: "Document uploaded",
        description: "Jane Smith uploaded a document to case CASE-006",
        actionLabel: "View Document",
        actionUrl: "/audit/cases/pqr-678/documents",
        relatedEntityType: "document",
      });
    });

    it("should build notification from APPROVAL_PENDING template", () => {
      const notification = buildNotificationFromTemplate("APPROVAL_PENDING", {
        itemDescription: "Budget Request #123",
        approvalId: "apr-001",
      });

      expect(notification).toEqual({
        type: "approval_requested",
        title: "Approval required",
        description: "Budget Request #123 requires your approval",
        actionLabel: "Review",
        actionUrl: "/approvals/apr-001",
        relatedEntityType: "approval",
      });
    });

    it("should handle missing variables gracefully", () => {
      const notification = buildNotificationFromTemplate("CASE_CREATED", {
        caseNumber: "CASE-007",
      });

      expect(notification.description).toBe("Case CASE-007 for {{clientName}} has been created");
      expect(notification.actionUrl).toBe("/audit/cases/{{caseId}}");
    });
  });

  describe("NOTIFICATION_TEMPLATES", () => {
    it("should have all required templates", () => {
      const expectedTemplates = [
        "CASE_CREATED",
        "CASE_ASSIGNED",
        "CASE_STATUS_CHANGED",
        "CASE_COMPLETED",
        "DEADLINE_APPROACHING",
        "DEADLINE_OVERDUE",
        "REVIEW_REQUIRED",
        "REVIEW_COMPLETED",
        "DOCUMENT_UPLOADED",
        "TEAM_MEMBER_ADDED",
        "APPROVAL_PENDING",
        "APPROVAL_APPROVED",
        "APPROVAL_REJECTED",
      ];

      for (const templateKey of expectedTemplates) {
        expect(NOTIFICATION_TEMPLATES[templateKey]).toBeDefined();
        expect(NOTIFICATION_TEMPLATES[templateKey].type).toBeDefined();
        expect(NOTIFICATION_TEMPLATES[templateKey].title).toBeDefined();
        expect(NOTIFICATION_TEMPLATES[templateKey].description).toBeDefined();
      }
    });

    it("should have unique types for each template category", () => {
      expect(NOTIFICATION_TEMPLATES.CASE_CREATED.type).toBe("case_created");
      expect(NOTIFICATION_TEMPLATES.CASE_ASSIGNED.type).toBe("assignment");
      expect(NOTIFICATION_TEMPLATES.DEADLINE_APPROACHING.type).toBe("deadline");
      expect(NOTIFICATION_TEMPLATES.REVIEW_REQUIRED.type).toBe("review");
      expect(NOTIFICATION_TEMPLATES.DOCUMENT_UPLOADED.type).toBe("document");
      expect(NOTIFICATION_TEMPLATES.TEAM_MEMBER_ADDED.type).toBe("team");
      expect(NOTIFICATION_TEMPLATES.APPROVAL_PENDING.type).toBe("approval_requested");
    });

    it("should have action labels for all case-related templates", () => {
      const caseTemplates = [
        "CASE_CREATED",
        "CASE_ASSIGNED",
        "CASE_STATUS_CHANGED",
        "CASE_COMPLETED",
        "DEADLINE_APPROACHING",
        "DEADLINE_OVERDUE",
      ];

      for (const templateKey of caseTemplates) {
        const template = NOTIFICATION_TEMPLATES[templateKey];
        expect(template.actionLabel).toBeDefined();
        expect(template.actionUrlPattern).toBeDefined();
      }
    });

    it("should have consistent URL patterns for case templates", () => {
      const caseTemplates = [
        "CASE_CREATED",
        "CASE_ASSIGNED",
        "CASE_STATUS_CHANGED",
        "CASE_COMPLETED",
        "DEADLINE_APPROACHING",
        "DEADLINE_OVERDUE",
        "REVIEW_REQUIRED",
        "REVIEW_COMPLETED",
      ];

      for (const templateKey of caseTemplates) {
        const template = NOTIFICATION_TEMPLATES[templateKey];
        expect(template.actionUrlPattern).toContain("/audit/cases/{{caseId}}");
      }
    });

    it("should have correct related entity types", () => {
      expect(NOTIFICATION_TEMPLATES.CASE_CREATED.relatedEntityType).toBe("case");
      expect(NOTIFICATION_TEMPLATES.DOCUMENT_UPLOADED.relatedEntityType).toBe("document");
      expect(NOTIFICATION_TEMPLATES.TEAM_MEMBER_ADDED.relatedEntityType).toBe("user");
      expect(NOTIFICATION_TEMPLATES.APPROVAL_PENDING.relatedEntityType).toBe("approval");
    });
  });
});
