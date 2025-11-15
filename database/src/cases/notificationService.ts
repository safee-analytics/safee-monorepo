import { schema, eq, DbDeps } from "../index.js";
import {
  buildNotificationFromTemplate,
  type TemplateVariables,
  NOTIFICATION_TEMPLATES,
} from "./notificationTemplates.js";
import type { PubSub } from "../pubsub/index.js";

const { notifications, notificationSettings } = schema;

export interface CreateNotificationParams {
  organizationId: string;
  userId: string;
  templateKey: keyof typeof NOTIFICATION_TEMPLATES;
  variables: TemplateVariables;
  relatedEntityId?: string;
}

export interface NotificationServiceDeps extends DbDeps {
  pubsub?: PubSub; // Optional: for real-time delivery
}

/**
 * Check if user has enabled this type of notification
 */
async function isNotificationEnabled(
  deps: DbDeps,
  userId: string,
  notificationType: string,
): Promise<boolean> {
  const { drizzle } = deps;

  const settings = await drizzle.query.notificationSettings.findFirst({
    where: eq(notificationSettings.userId, userId),
  });

  // If no settings found, default to enabled
  if (!settings) {
    return true;
  }

  // Map notification types to settings fields
  const typeToSettingMap: Record<string, keyof typeof settings> = {
    case_created: "auditCaseUpdates",
    case_update: "auditCaseUpdates",
    assignment: "taskAssignments",
    deadline: "deadlineReminders",
    review: "auditCaseUpdates",
    document: "documentUploads",
    team: "teamMentions",
    approval: "systemAlerts",
    completed: "auditCaseUpdates",
  };

  const settingKey = typeToSettingMap[notificationType];
  const value = settings[settingKey];
  return typeof value === "boolean" ? value : true;
}

/**
 * Create a notification with user preference checking
 */
export async function createNotification(
  deps: NotificationServiceDeps,
  params: CreateNotificationParams,
): Promise<string | null> {
  const { drizzle, pubsub } = deps;
  const { organizationId, userId, templateKey, variables, relatedEntityId } = params;

  // Build notification from template
  const notificationData = buildNotificationFromTemplate(templateKey, variables);

  // Check user preferences
  const isEnabled = await isNotificationEnabled(deps, userId, notificationData.type);
  if (!isEnabled) {
    // User has disabled this type of notification
    return null;
  }

  // Create notification in database
  const [notification] = await drizzle
    .insert(notifications)
    .values({
      organizationId,
      userId,
      type: notificationData.type,
      title: notificationData.title,
      description: notificationData.description,
      actionLabel: notificationData.actionLabel ?? null,
      actionUrl: notificationData.actionUrl ?? null,
      relatedEntityType: notificationData.relatedEntityType ?? null,
      relatedEntityId: relatedEntityId ?? null,
      isRead: false,
    })
    .returning({ id: notifications.id });

  // Publish to pubsub for real-time delivery (if available)
  if (pubsub) {
    await pubsub.publish("notifications", {
      notificationId: notification.id,
      userId,
      organizationId,
      type: notificationData.type,
      title: notificationData.title,
    });
  }

  return notification.id;
}

/**
 * Create notifications for multiple users (e.g., team members)
 */
export async function createNotificationsForUsers(
  deps: NotificationServiceDeps,
  params: Omit<CreateNotificationParams, "userId"> & { userIds: string[] },
): Promise<string[]> {
  const { userIds, ...restParams } = params;
  const notificationIds: string[] = [];

  for (const userId of userIds) {
    const id = await createNotification(deps, {
      ...restParams,
      userId,
    });
    if (id) {
      notificationIds.push(id);
    }
  }

  return notificationIds;
}

/**
 * Helper function to create case-related notifications
 */
export async function notifyCaseCreated(
  deps: NotificationServiceDeps,
  params: {
    organizationId: string;
    userId: string;
    caseId: string;
    caseNumber: string;
    clientName: string;
  },
): Promise<string | null> {
  return createNotification(deps, {
    organizationId: params.organizationId,
    userId: params.userId,
    templateKey: "CASE_CREATED",
    variables: {
      caseNumber: params.caseNumber,
      clientName: params.clientName,
      caseId: params.caseId,
    },
    relatedEntityId: params.caseId,
  });
}

export async function notifyCaseAssigned(
  deps: NotificationServiceDeps,
  params: {
    organizationId: string;
    userId: string;
    caseId: string;
    caseNumber: string;
    clientName: string;
  },
): Promise<string | null> {
  return createNotification(deps, {
    organizationId: params.organizationId,
    userId: params.userId,
    templateKey: "CASE_ASSIGNED",
    variables: {
      caseNumber: params.caseNumber,
      clientName: params.clientName,
      caseId: params.caseId,
    },
    relatedEntityId: params.caseId,
  });
}

export async function notifyDeadlineApproaching(
  deps: NotificationServiceDeps,
  params: {
    organizationId: string;
    userIds: string[];
    caseId: string;
    caseNumber: string;
    clientName: string;
    daysRemaining: number;
  },
): Promise<string[]> {
  return createNotificationsForUsers(deps, {
    organizationId: params.organizationId,
    userIds: params.userIds,
    templateKey: "DEADLINE_APPROACHING",
    variables: {
      caseNumber: params.caseNumber,
      clientName: params.clientName,
      daysRemaining: params.daysRemaining,
      caseId: params.caseId,
    },
    relatedEntityId: params.caseId,
  });
}

export async function notifyCaseCompleted(
  deps: NotificationServiceDeps,
  params: {
    organizationId: string;
    userIds: string[];
    caseId: string;
    caseNumber: string;
    clientName: string;
    userName: string;
  },
): Promise<string[]> {
  return createNotificationsForUsers(deps, {
    organizationId: params.organizationId,
    userIds: params.userIds,
    templateKey: "CASE_COMPLETED",
    variables: {
      caseNumber: params.caseNumber,
      clientName: params.clientName,
      userName: params.userName,
      caseId: params.caseId,
    },
    relatedEntityId: params.caseId,
  });
}
