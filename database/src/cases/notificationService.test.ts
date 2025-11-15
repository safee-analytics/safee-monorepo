import { describe, it, expect, beforeAll, afterAll, beforeEach, vi } from "vitest";
import { type DrizzleClient, schema, eq, connectTest } from "../index.js";
import { pino } from "pino";
import {
  createTestOrganization,
  createTestUser,
  nukeDatabase,
  type TestOrganization,
  type TestUser,
} from "../test-helpers/test-fixtures.js";
import {
  createNotification,
  createNotificationsForUsers,
  notifyCaseCreated,
  notifyCaseAssigned,
  notifyDeadlineApproaching,
  notifyCaseCompleted,
  type NotificationServiceDeps,
} from "./notificationService.js";
import type { PubSub } from "../pubsub/index.js";

void describe("Notification Service", async () => {
  let drizzle: DrizzleClient;
  let close: () => Promise<void>;
  let testOrg: TestOrganization;
  let testUser: TestUser;
  let testUser2: TestUser;
  const logger = pino({ level: "silent" });

  beforeAll(async () => {
    ({ drizzle, close } = await connectTest({ appName: "notification-service-test" }));
  });

  afterAll(async () => {
    await close();
  });

  beforeEach(async () => {
    await nukeDatabase(drizzle);
    testOrg = await createTestOrganization(drizzle);
    testUser = await createTestUser(drizzle, testOrg.id);
    testUser2 = await createTestUser(drizzle, testOrg.id);
  });

  void describe("createNotification", () => {
    void it("should create notification from template", async () => {
      const deps: NotificationServiceDeps = { drizzle, logger };

      const notificationId = await createNotification(deps, {
        organizationId: testOrg.id,
        userId: testUser.id,
        templateKey: "CASE_CREATED",
        variables: {
          caseNumber: "CASE-001",
          clientName: "Test Client",
          caseId: "123",
        },
      });

      expect(notificationId).toBeDefined();
      expect(typeof notificationId).toBe("string");

      const notification = await drizzle.query.notifications.findFirst({
        where: eq(schema.notifications.id, notificationId!),
      });

      expect(notification).toBeDefined();
      expect(notification!.title).toBe("New case created");
      expect(notification!.description).toBe("Case CASE-001 for Test Client has been created");
      expect(notification!.type).toBe("case_created");
      expect(notification!.actionLabel).toBe("View Case");
      expect(notification!.actionUrl).toBe("/audit/cases/123");
    });

    void it("should return null when user has disabled notification type", async () => {
      const deps: NotificationServiceDeps = { drizzle, logger };

      // Create notification settings that disable case updates
      await drizzle.insert(schema.notificationSettings).values({
        userId: testUser.id,
        auditCaseUpdates: false, // Disable case updates
        taskAssignments: true,
        deadlineReminders: true,
        documentUploads: true,
        teamMentions: true,
        systemAlerts: true,
      });

      const notificationId = await createNotification(deps, {
        organizationId: testOrg.id,
        userId: testUser.id,
        templateKey: "CASE_CREATED",
        variables: {
          caseNumber: "CASE-001",
          clientName: "Test Client",
          caseId: "123",
        },
      });

      expect(notificationId).toBeNull();

      const notifications = await drizzle.query.notifications.findMany({
        where: eq(schema.notifications.userId, testUser.id),
      });
      expect(notifications).toHaveLength(0);
    });

    void it("should create notification when user has enabled notification type", async () => {
      const deps: NotificationServiceDeps = { drizzle, logger };

      await drizzle.insert(schema.notificationSettings).values({
        userId: testUser.id,
        auditCaseUpdates: true,
        taskAssignments: true,
        deadlineReminders: true,
        documentUploads: true,
        teamMentions: true,
        systemAlerts: true,
      });

      const notificationId = await createNotification(deps, {
        organizationId: testOrg.id,
        userId: testUser.id,
        templateKey: "CASE_CREATED",
        variables: {
          caseNumber: "CASE-001",
          clientName: "Test Client",
          caseId: "123",
        },
      });

      expect(notificationId).toBeDefined();
      expect(notificationId).not.toBeNull();
    });

    void it("should default to enabled when no settings exist", async () => {
      const deps: NotificationServiceDeps = { drizzle, logger };

      const notificationId = await createNotification(deps, {
        organizationId: testOrg.id,
        userId: testUser.id,
        templateKey: "CASE_CREATED",
        variables: {
          caseNumber: "CASE-001",
          clientName: "Test Client",
          caseId: "123",
        },
      });

      expect(notificationId).toBeDefined();
      expect(notificationId).not.toBeNull();
    });

    void it("should publish to pubsub when provided", async () => {
      const mockPubsub: PubSub = {
        publish: vi.fn().mockResolvedValue(undefined),
        subscribe: vi.fn(),
        createTopic: vi.fn(),
        createSubscription: vi.fn(),
        close: vi.fn(),
      };

      const deps: NotificationServiceDeps = { drizzle, logger, pubsub: mockPubsub };

      const notificationId = await createNotification(deps, {
        organizationId: testOrg.id,
        userId: testUser.id,
        templateKey: "CASE_CREATED",
        variables: {
          caseNumber: "CASE-001",
          clientName: "Test Client",
          caseId: "123",
        },
      });

      expect(notificationId).toBeDefined();
      expect(mockPubsub.publish).toHaveBeenCalledWith("notifications", {
        notificationId,
        userId: testUser.id,
        organizationId: testOrg.id,
        type: "case_created",
        title: "New case created",
      });
    });

    void it("should not publish to pubsub when notification is disabled", async () => {
      const mockPubsub: PubSub = {
        publish: vi.fn().mockResolvedValue(undefined),
        subscribe: vi.fn(),
        createTopic: vi.fn(),
        createSubscription: vi.fn(),
        close: vi.fn(),
      };

      const deps: NotificationServiceDeps = { drizzle, logger, pubsub: mockPubsub };

      // Disable notifications
      await drizzle.insert(schema.notificationSettings).values({
        userId: testUser.id,
        auditCaseUpdates: false,
        taskAssignments: true,
        deadlineReminders: true,
        documentUploads: true,
        teamMentions: true,
        systemAlerts: true,
      });

      const notificationId = await createNotification(deps, {
        organizationId: testOrg.id,
        userId: testUser.id,
        templateKey: "CASE_CREATED",
        variables: {
          caseNumber: "CASE-001",
          clientName: "Test Client",
          caseId: "123",
        },
      });

      expect(notificationId).toBeNull();
      expect(mockPubsub.publish).not.toHaveBeenCalled();
    });

    void it("should include relatedEntityId when provided", async () => {
      const deps: NotificationServiceDeps = { drizzle, logger };

      // Create a test case
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

      const notificationId = await createNotification(deps, {
        organizationId: testOrg.id,
        userId: testUser.id,
        templateKey: "CASE_CREATED",
        variables: {
          caseNumber: "CASE-001",
          clientName: "Test Client",
          caseId: testCase.id,
        },
        relatedEntityId: testCase.id,
      });

      const notification = await drizzle.query.notifications.findFirst({
        where: eq(schema.notifications.id, notificationId!),
      });

      expect(notification!.relatedEntityId).toBe(testCase.id);
      expect(notification!.relatedEntityType).toBe("case");
    });
  });

  void describe("createNotificationsForUsers", () => {
    void it("should create notifications for multiple users", async () => {
      const deps: NotificationServiceDeps = { drizzle, logger };

      const notificationIds = await createNotificationsForUsers(deps, {
        organizationId: testOrg.id,
        userIds: [testUser.id, testUser2.id],
        templateKey: "CASE_CREATED",
        variables: {
          caseNumber: "CASE-001",
          clientName: "Test Client",
          caseId: "123",
        },
      });

      expect(notificationIds).toHaveLength(2);

      const notifications = await drizzle.query.notifications.findMany({
        where: eq(schema.notifications.organizationId, testOrg.id),
      });

      expect(notifications).toHaveLength(2);
      expect(notifications.map((n) => n.userId).sort()).toEqual([testUser.id, testUser2.id].sort());
    });

    void it("should skip users who have disabled the notification type", async () => {
      const deps: NotificationServiceDeps = { drizzle, logger };

      // Disable notifications for testUser2
      await drizzle.insert(schema.notificationSettings).values({
        userId: testUser2.id,
        auditCaseUpdates: false,
        taskAssignments: true,
        deadlineReminders: true,
        documentUploads: true,
        teamMentions: true,
        systemAlerts: true,
      });

      const notificationIds = await createNotificationsForUsers(deps, {
        organizationId: testOrg.id,
        userIds: [testUser.id, testUser2.id],
        templateKey: "CASE_CREATED",
        variables: {
          caseNumber: "CASE-001",
          clientName: "Test Client",
          caseId: "123",
        },
      });

      expect(notificationIds).toHaveLength(1);

      const notifications = await drizzle.query.notifications.findMany({
        where: eq(schema.notifications.organizationId, testOrg.id),
      });

      expect(notifications).toHaveLength(1);
      expect(notifications[0].userId).toBe(testUser.id);
    });
  });

  void describe("notifyCaseCreated", () => {
    void it("should create case created notification", async () => {
      const deps: NotificationServiceDeps = { drizzle, logger };

      // Create a test case
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

      const notificationId = await notifyCaseCreated(deps, {
        organizationId: testOrg.id,
        userId: testUser.id,
        caseId: testCase.id,
        caseNumber: "CASE-001",
        clientName: "Test Client",
      });

      expect(notificationId).toBeDefined();

      const notification = await drizzle.query.notifications.findFirst({
        where: eq(schema.notifications.id, notificationId!),
      });

      expect(notification!.title).toBe("New case created");
      expect(notification!.description).toContain("CASE-001");
      expect(notification!.description).toContain("Test Client");
      expect(notification!.type).toBe("case_created");
    });
  });

  void describe("notifyCaseAssigned", () => {
    void it("should create case assigned notification", async () => {
      const deps: NotificationServiceDeps = { drizzle, logger };

      // Create a test case
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

      const notificationId = await notifyCaseAssigned(deps, {
        organizationId: testOrg.id,
        userId: testUser.id,
        caseId: testCase.id,
        caseNumber: "CASE-001",
        clientName: "Test Client",
      });

      expect(notificationId).toBeDefined();

      const notification = await drizzle.query.notifications.findFirst({
        where: eq(schema.notifications.id, notificationId!),
      });

      expect(notification!.title).toBe("Case assigned to you");
      expect(notification!.description).toContain("CASE-001");
      expect(notification!.description).toContain("Test Client");
      expect(notification!.type).toBe("assignment");
    });
  });

  void describe("notifyDeadlineApproaching", () => {
    void it("should create deadline notifications for multiple users", async () => {
      const deps: NotificationServiceDeps = { drizzle, logger };

      // Create a test case
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

      const notificationIds = await notifyDeadlineApproaching(deps, {
        organizationId: testOrg.id,
        userIds: [testUser.id, testUser2.id],
        caseId: testCase.id,
        caseNumber: "CASE-001",
        clientName: "Test Client",
        daysRemaining: 3,
      });

      expect(notificationIds).toHaveLength(2);

      const notifications = await drizzle.query.notifications.findMany({
        where: eq(schema.notifications.organizationId, testOrg.id),
      });

      expect(notifications).toHaveLength(2);
      expect(notifications[0].title).toBe("Case deadline approaching");
      expect(notifications[0].description).toContain("3 days");
      expect(notifications[0].type).toBe("deadline");
    });
  });

  void describe("notifyCaseCompleted", () => {
    void it("should create case completed notifications for multiple users", async () => {
      const deps: NotificationServiceDeps = { drizzle, logger };

      // Create a test case
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

      const notificationIds = await notifyCaseCompleted(deps, {
        organizationId: testOrg.id,
        userIds: [testUser.id, testUser2.id],
        caseId: testCase.id,
        caseNumber: "CASE-001",
        clientName: "Test Client",
        userName: "John Doe",
      });

      expect(notificationIds).toHaveLength(2);

      const notifications = await drizzle.query.notifications.findMany({
        where: eq(schema.notifications.organizationId, testOrg.id),
      });

      expect(notifications).toHaveLength(2);
      expect(notifications[0].title).toBe("Case completed");
      expect(notifications[0].description).toContain("John Doe");
      expect(notifications[0].description).toContain("CASE-001");
      expect(notifications[0].type).toBe("completed");
    });
  });
});
