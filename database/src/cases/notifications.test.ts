import { describe, it, expect, beforeAll, afterAll, beforeEach } from "vitest";
import { type DrizzleClient, schema, eq, connectTest } from "../index.js";
import { pino } from "pino";
import { randomUUID } from "node:crypto";
import { createTestOrganization, type TestOrganization } from "../test-helpers/organizations.js";
import { createTestUser, type TestUser } from "../test-helpers/users.js";
import { nukeDatabase } from "../test-helpers/cleanup.js";
import {
  getRecentNotifications,
  markNotificationAsRead,
  getUnreadNotificationsCount,
} from "./notifications.js";

describe("Notification CRUD Functions", async () => {
  let drizzle: DrizzleClient;
  let close: () => Promise<void>;
  let testOrg: TestOrganization;
  let testUser: TestUser;
  let testUser2: TestUser;
  const logger = pino({ level: "silent" });

  beforeAll(async () => {
    ({ drizzle, close } = await connectTest({ appName: "notifications-test" }));
  });

  afterAll(async () => {
    await close();
  });

  beforeEach(async () => {
    await nukeDatabase(drizzle);
    testOrg = await createTestOrganization(drizzle);
    testUser = await createTestUser(drizzle);
    testUser2 = await createTestUser(drizzle);
  });

  describe("getRecentNotifications", () => {
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

    it("should respect the limit parameter", async () => {
      const deps = { drizzle, logger };

      for (let i = 1; i <= 5; i++) {
        await drizzle.insert(schema.notifications).values({
          organizationId: testOrg.id,
          userId: testUser.id,
          type: "case_update",
          title: `Notification ${i}`,
          description: `Description ${i}`,
          isRead: false,
        });
      }

      const notifications = await getRecentNotifications(deps, testUser.id, testOrg.id, 3);

      expect(notifications).toHaveLength(3);
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

    it("should only return notifications for the specific user", async () => {
      const deps = { drizzle, logger };

      await drizzle.insert(schema.notifications).values({
        organizationId: testOrg.id,
        userId: testUser.id,
        type: "case_update",
        title: "For User 1",
        description: "Test",
        isRead: false,
      });

      await drizzle.insert(schema.notifications).values({
        organizationId: testOrg.id,
        userId: testUser2.id,
        type: "case_update",
        title: "For User 2",
        description: "Test",
        isRead: false,
      });

      const notifications = await getRecentNotifications(deps, testUser.id, testOrg.id, 10);

      expect(notifications).toHaveLength(1);
      expect(notifications[0].title).toBe("For User 1");
    });

    it("should only return notifications for the specific organization", async () => {
      const deps = { drizzle, logger };
      const testOrg2 = await createTestOrganization(drizzle);

      await drizzle.insert(schema.notifications).values({
        organizationId: testOrg.id,
        userId: testUser.id,
        type: "case_update",
        title: "For Org 1",
        description: "Test",
        isRead: false,
      });

      await drizzle.insert(schema.notifications).values({
        organizationId: testOrg2.id,
        userId: testUser.id,
        type: "case_update",
        title: "For Org 2",
        description: "Test",
        isRead: false,
      });

      const notifications = await getRecentNotifications(deps, testUser.id, testOrg.id, 10);

      expect(notifications).toHaveLength(1);
      expect(notifications[0].title).toBe("For Org 1");
    });

    it("should include relatedEntity fields when provided", async () => {
      const deps = { drizzle, logger };

      const [testCase] = await drizzle
        .insert(schema.cases)
        .values({
          organizationId: testOrg.id,
          caseNumber: "CASE-001",
          clientName: "Test Client",
          auditType: "ICV",
          status: "pending",
          priority: "medium",
          createdBy: testUser.id,
        })
        .returning();

      await drizzle.insert(schema.notifications).values({
        organizationId: testOrg.id,
        userId: testUser.id,
        type: "case_update",
        title: "Case Updated",
        description: "Test",
        relatedEntityType: "case",
        relatedEntityId: testCase.id,
        isRead: false,
      });

      const notifications = await getRecentNotifications(deps, testUser.id, testOrg.id, 10);

      expect(notifications[0].relatedEntityType).toBe("case");
      expect(notifications[0].relatedEntityId).toBe(testCase.id);
    });
  });

  describe("markNotificationAsRead", () => {
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

      const [notification] = await drizzle
        .insert(schema.notifications)
        .values({
          organizationId: testOrg.id,
          userId: testUser2.id,
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

    it("should not throw error when marking non-existent notification", async () => {
      const deps = { drizzle, logger };

      const nonExistentId = randomUUID();
      await expect(markNotificationAsRead(deps, nonExistentId, testUser.id)).resolves.toBeUndefined();
    });

    it("should update readAt timestamp", async () => {
      const deps = { drizzle, logger };

      const [notification] = await drizzle
        .insert(schema.notifications)
        .values({
          organizationId: testOrg.id,
          userId: testUser.id,
          type: "case_update",
          title: "Test",
          description: "Test",
          isRead: false,
        })
        .returning();

      const beforeMark = new Date();
      await markNotificationAsRead(deps, notification.id, testUser.id);
      const afterMark = new Date();

      const [updated] = await drizzle
        .select()
        .from(schema.notifications)
        .where(eq(schema.notifications.id, notification.id));

      expect(updated.readAt).toBeDefined();
      expect(updated.readAt!.getTime()).toBeGreaterThanOrEqual(beforeMark.getTime());
      expect(updated.readAt!.getTime()).toBeLessThanOrEqual(afterMark.getTime());
    });
  });

  describe("getUnreadNotificationsCount", () => {
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
      const testOrg2 = await createTestOrganization(drizzle);

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
          userId: testUser2.id,
          type: "deadline",
          title: "Other User Notification",
          description: "For other user",
          isRead: false,
        },
        {
          organizationId: testOrg2.id,
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

    it("should not count read notifications", async () => {
      const deps = { drizzle, logger };

      await drizzle.insert(schema.notifications).values([
        {
          organizationId: testOrg.id,
          userId: testUser.id,
          type: "case_update",
          title: "Read 1",
          description: "Test",
          isRead: true,
        },
        {
          organizationId: testOrg.id,
          userId: testUser.id,
          type: "deadline",
          title: "Read 2",
          description: "Test",
          isRead: true,
        },
      ]);

      const count = await getUnreadNotificationsCount(deps, testUser.id, testOrg.id);

      expect(count).toBe(0);
    });

    it("should update count after marking notification as read", async () => {
      const deps = { drizzle, logger };

      const [notification] = await drizzle
        .insert(schema.notifications)
        .values({
          organizationId: testOrg.id,
          userId: testUser.id,
          type: "case_update",
          title: "Test",
          description: "Test",
          isRead: false,
        })
        .returning();

      let count = await getUnreadNotificationsCount(deps, testUser.id, testOrg.id);
      expect(count).toBe(1);

      await markNotificationAsRead(deps, notification.id, testUser.id);

      count = await getUnreadNotificationsCount(deps, testUser.id, testOrg.id);
      expect(count).toBe(0);
    });
  });
});
