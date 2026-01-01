import { describe, it, expect, beforeAll, afterAll, beforeEach } from "vitest";
import { type DrizzleClient, schema, eq } from "@safee/database";
import { connectTest } from "@safee/database/test-helpers";
import {
  createTestOrganization,
  createTestUser,
  cleanTestData,
  type TestOrganization,
  type TestUser,
} from "@safee/database/test-helpers";
import { pino } from "pino";

// Import the functions we're testing
import {
  getCaseStats,
  getRecentCaseActivity,
  getRecentNotifications,
  markNotificationAsRead,
  getUnreadNotificationsCount,
} from "@safee/database";

void describe("Dashboard Controller Database Functions", async () => {
  let drizzle: DrizzleClient;
  let close: () => Promise<void>;
  let testOrg: TestOrganization;
  let testUser: TestUser;
  const logger = pino({ level: "silent" });

  beforeAll(async () => {
    ({ drizzle, close } = await connectTest());
  });

  afterAll(async () => {
    await close();
  });

  beforeEach(async () => {
    await cleanTestData(drizzle);
    testOrg = await createTestOrganization(drizzle);
    testUser = await createTestUser(drizzle);
  });

  void describe("getCaseStats", () => {
    it("should return zero stats for organization with no cases", async () => {
      const deps = { drizzle, logger };
      const stats = await getCaseStats(deps, testOrg.id);

      expect(stats).toEqual({
        activeCases: 0,
        pendingReviews: 0,
        completedAudits: 0,
        totalCases: 0,
        completionRate: 0,
      });
    });

    it("should return correct stats when cases exist", async () => {
      const deps = { drizzle, logger };

      await drizzle.insert(schema.cases).values([
        {
          organizationId: testOrg.id,
          caseNumber: "CASE-001",
          title: "Client A",
          caseType: "FINANCIAL_AUDIT" as const,
          status: "in_progress",
          priority: "medium",
          createdBy: testUser.id,
        },
        {
          organizationId: testOrg.id,
          caseNumber: "CASE-002",
          title: "Client B",
          caseType: "COMPLIANCE_AUDIT" as const,
          status: "in_progress",
          priority: "high",
          createdBy: testUser.id,
        },
        {
          organizationId: testOrg.id,
          caseNumber: "CASE-003",
          title: "Client C",
          caseType: "ISO_9001_AUDIT" as const,
          status: "under_review",
          priority: "medium",
          createdBy: testUser.id,
        },
        {
          organizationId: testOrg.id,
          caseNumber: "CASE-004",
          title: "Client D",
          caseType: "ICV_AUDIT" as const,
          status: "completed",
          priority: "low",
          createdBy: testUser.id,
        },
        {
          organizationId: testOrg.id,
          caseNumber: "CASE-005",
          title: "Client E",
          caseType: "FINANCIAL_AUDIT" as const,
          status: "completed",
          priority: "medium",
          createdBy: testUser.id,
        },
      ]);

      const stats = await getCaseStats(deps, testOrg.id);

      expect(stats.activeCases).toBe(2);
      expect(stats.pendingReviews).toBe(1);
      expect(stats.completedAudits).toBe(2);
      expect(stats.totalCases).toBe(5);
      expect(stats.completionRate).toBe(40);
    });

    it("should calculate completion rate correctly", async () => {
      const deps = { drizzle, logger };

      await drizzle.insert(schema.cases).values([
        {
          organizationId: testOrg.id,
          caseNumber: "CASE-001",
          title: "Client A",
          caseType: "FINANCIAL_AUDIT" as const,
          status: "completed",
          priority: "medium",
          createdBy: testUser.id,
        },
        {
          organizationId: testOrg.id,
          caseNumber: "CASE-002",
          title: "Client B",
          caseType: "COMPLIANCE_AUDIT" as const,
          status: "completed",
          priority: "high",
          createdBy: testUser.id,
        },
        {
          organizationId: testOrg.id,
          caseNumber: "CASE-003",
          title: "Client C",
          caseType: "ISO_9001_AUDIT" as const,
          status: "completed",
          priority: "medium",
          createdBy: testUser.id,
        },
        {
          organizationId: testOrg.id,
          caseNumber: "CASE-004",
          title: "Client D",
          caseType: "ICV_AUDIT" as const,
          status: "in_progress",
          priority: "low",
          createdBy: testUser.id,
        },
      ]);

      const stats = await getCaseStats(deps, testOrg.id);

      expect(stats.completionRate).toBe(75);
    });

    it("should only count cases for the specified organization", async () => {
      const deps = { drizzle, logger };
      const otherOrg = await createTestOrganization(drizzle);

      await drizzle.insert(schema.cases).values({
        organizationId: testOrg.id,
        caseNumber: "CASE-001",
        title: "Client A",
        caseType: "FINANCIAL_AUDIT" as const,
        status: "in_progress",
        priority: "medium",
        createdBy: testUser.id,
      });

      await drizzle.insert(schema.cases).values({
        organizationId: otherOrg.id,
        caseNumber: "CASE-002",
        title: "Client B",
        caseType: "COMPLIANCE_AUDIT" as const,
        status: "in_progress",
        priority: "high",
        createdBy: testUser.id,
      });

      const stats = await getCaseStats(deps, testOrg.id);

      expect(stats.totalCases).toBe(1);
      expect(stats.activeCases).toBe(1);
    });
  });

  void describe("getRecentCaseActivity", () => {
    it("should return empty array when no cases exist", async () => {
      const deps = { drizzle, logger };
      const activity = await getRecentCaseActivity(deps, testOrg.id, 10);

      expect(activity).toEqual([]);
    });

    it("should return recent cases ordered by updatedAt desc", async () => {
      const deps = { drizzle, logger };

      const [case1] = await drizzle
        .insert(schema.cases)
        .values({
          organizationId: testOrg.id,
          caseNumber: "CASE-001",
          title: "Client A",
          caseType: "FINANCIAL_AUDIT" as const,
          status: "in_progress",
          priority: "medium",
          createdBy: testUser.id,
          updatedAt: new Date("2024-01-01"),
        })
        .returning();

      const [case2] = await drizzle
        .insert(schema.cases)
        .values({
          organizationId: testOrg.id,
          caseNumber: "CASE-002",
          title: "Client B",
          caseType: "COMPLIANCE_AUDIT" as const,
          status: "completed",
          priority: "high",
          createdBy: testUser.id,
          updatedAt: new Date("2024-01-03"),
        })
        .returning();

      const [case3] = await drizzle
        .insert(schema.cases)
        .values({
          organizationId: testOrg.id,
          caseNumber: "CASE-003",
          title: "Client C",
          caseType: "ISO_9001_AUDIT" as const,
          status: "under_review",
          priority: "low",
          createdBy: testUser.id,
          updatedAt: new Date("2024-01-02"),
        })
        .returning();

      const activity = await getRecentCaseActivity(deps, testOrg.id, 10);

      expect(activity).toHaveLength(3);
      expect(activity[0].caseId).toBe(case2.id);
      expect(activity[1].caseId).toBe(case3.id);
      expect(activity[2].caseId).toBe(case1.id);
    });

    it("should respect the limit parameter", async () => {
      const deps = { drizzle, logger };

      for (let i = 1; i <= 5; i++) {
        await drizzle.insert(schema.cases).values({
          organizationId: testOrg.id,
          caseNumber: `CASE-00${i}`,
          title: `Client ${i}`,
          caseType: "FINANCIAL_AUDIT" as const,
          status: "in_progress",
          priority: "medium",
          createdBy: testUser.id,
        });
      }

      const activity = await getRecentCaseActivity(deps, testOrg.id, 3);

      expect(activity).toHaveLength(3);
    });

    it("should include user information", async () => {
      const deps = { drizzle, logger };

      await drizzle.insert(schema.cases).values({
        organizationId: testOrg.id,
        caseNumber: "CASE-001",
        title: "Client A",
        caseType: "FINANCIAL_AUDIT" as const,
        status: "in_progress",
        priority: "medium",
        createdBy: testUser.id,
      });

      const activity = await getRecentCaseActivity(deps, testOrg.id, 10);

      expect(activity[0].updatedBy).toBeDefined();
      expect(activity[0].updatedBy.id).toBe(testUser.id);
      expect(activity[0].updatedBy.name).toBeDefined();
    });
  });

  void describe("getRecentNotifications", () => {
    it("should return empty array when no notifications exist", async () => {
      const deps = { drizzle, logger };
      const notifications = await getRecentNotifications(deps, testUser.id, testOrg.id, 10);

      expect(notifications).toEqual([]);
    });

    it("should return notifications for the user", async () => {
      const deps = { drizzle, logger };

      await drizzle.insert(schema.notifications).values({
        organizationId: testOrg.id,
        userId: testUser.id,
        type: "case_update",
        title: "Case Updated",
        description: "Case CASE-001 has been updated",
        isRead: false,
      });

      const notifications = await getRecentNotifications(deps, testUser.id, testOrg.id, 10);

      expect(notifications).toHaveLength(1);
      expect(notifications[0].title).toBe("Case Updated");
      expect(notifications[0].type).toBe("case_update");
      expect(notifications[0].isRead).toBe(false);
    });

    it("should order notifications by createdAt desc", async () => {
      const deps = { drizzle, logger };

      await drizzle.insert(schema.notifications).values([
        {
          organizationId: testOrg.id,
          userId: testUser.id,
          type: "case_update",
          title: "Notification 1",
          description: "First notification",
          isRead: false,
          createdAt: new Date("2024-01-01"),
        },
        {
          organizationId: testOrg.id,
          userId: testUser.id,
          type: "deadline",
          title: "Notification 2",
          description: "Second notification",
          isRead: false,
          createdAt: new Date("2024-01-03"),
        },
        {
          organizationId: testOrg.id,
          userId: testUser.id,
          type: "review",
          title: "Notification 3",
          description: "Third notification",
          isRead: false,
          createdAt: new Date("2024-01-02"),
        },
      ]);

      const notifications = await getRecentNotifications(deps, testUser.id, testOrg.id, 10);

      expect(notifications).toHaveLength(3);
      expect(notifications[0].title).toBe("Notification 2");
      expect(notifications[1].title).toBe("Notification 3");
      expect(notifications[2].title).toBe("Notification 1");
    });

    it("should include action button data", async () => {
      const deps = { drizzle, logger };

      await drizzle.insert(schema.notifications).values({
        organizationId: testOrg.id,
        userId: testUser.id,
        type: "case_update",
        title: "Case Updated",
        description: "Case CASE-001 has been updated",
        actionLabel: "View Case",
        actionUrl: "/audit/cases/123",
        isRead: false,
      });

      const notifications = await getRecentNotifications(deps, testUser.id, testOrg.id, 10);

      expect(notifications[0].actionLabel).toBe("View Case");
      expect(notifications[0].actionUrl).toBe("/audit/cases/123");
    });
  });

  void describe("markNotificationAsRead", () => {
    it("should mark notification as read", async () => {
      const deps = { drizzle, logger };

      const [notification] = await drizzle
        .insert(schema.notifications)
        .values({
          organizationId: testOrg.id,
          userId: testUser.id,
          type: "case_update",
          title: "Case Updated",
          description: "Test notification",
          isRead: false,
        })
        .returning();

      await markNotificationAsRead(deps, notification.id, testUser.id);

      const [updated] = await drizzle
        .select()
        .from(schema.notifications)
        .where(eq(schema.notifications.id, notification.id));

      expect(updated.isRead).toBe(true);
      expect(updated.readAt).toBeDefined();
      expect(updated.readAt).toBeInstanceOf(Date);
    });

    it("should only mark notification for the specific user", async () => {
      const deps = { drizzle, logger };
      const otherUser = await createTestUser(drizzle);

      const [notification] = await drizzle
        .insert(schema.notifications)
        .values({
          organizationId: testOrg.id,
          userId: otherUser.id,
          type: "case_update",
          title: "Case Updated",
          description: "Test notification",
          isRead: false,
        })
        .returning();

      await markNotificationAsRead(deps, notification.id, testUser.id);

      const [updated] = await drizzle
        .select()
        .from(schema.notifications)
        .where(eq(schema.notifications.id, notification.id));

      expect(updated.isRead).toBe(false);
    });
  });

  void describe("getUnreadNotificationsCount", () => {
    it("should return 0 when no unread notifications exist", async () => {
      const deps = { drizzle, logger };
      const count = await getUnreadNotificationsCount(deps, testUser.id, testOrg.id);

      expect(count).toBe(0);
    });

    it("should return correct count of unread notifications", async () => {
      const deps = { drizzle, logger };

      await drizzle.insert(schema.notifications).values([
        {
          organizationId: testOrg.id,
          userId: testUser.id,
          type: "case_update",
          title: "Notification 1",
          description: "Unread",
          isRead: false,
        },
        {
          organizationId: testOrg.id,
          userId: testUser.id,
          type: "deadline",
          title: "Notification 2",
          description: "Unread",
          isRead: false,
        },
        {
          organizationId: testOrg.id,
          userId: testUser.id,
          type: "review",
          title: "Notification 3",
          description: "Read",
          isRead: true,
        },
      ]);

      const count = await getUnreadNotificationsCount(deps, testUser.id, testOrg.id);

      expect(count).toBe(2);
    });

    it("should only count notifications for the specific user and organization", async () => {
      const deps = { drizzle, logger };
      const otherUser = await createTestUser(drizzle);
      const otherOrg = await createTestOrganization(drizzle);

      await drizzle.insert(schema.notifications).values([
        {
          organizationId: testOrg.id,
          userId: testUser.id,
          type: "case_update",
          title: "My Notification",
          description: "For me",
          isRead: false,
        },
        {
          organizationId: testOrg.id,
          userId: otherUser.id,
          type: "deadline",
          title: "Other User Notification",
          description: "For other user",
          isRead: false,
        },
        {
          organizationId: otherOrg.id,
          userId: testUser.id,
          type: "review",
          title: "Other Org Notification",
          description: "For other org",
          isRead: false,
        },
      ]);

      const count = await getUnreadNotificationsCount(deps, testUser.id, testOrg.id);

      expect(count).toBe(1);
    });
  });
});
