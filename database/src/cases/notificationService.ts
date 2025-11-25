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
  pubsub?: PubSub;
}

async function isNotificationEnabled(
  deps: DbDeps,
  userId: string,
  notificationType: string,
): Promise<boolean> {
  const { drizzle } = deps;

  const settings = await drizzle.query.notificationSettings.findFirst({
    where: eq(notificationSettings.userId, userId),
  });

  if (!settings) {
    return true;
  }
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

export async function createNotification(
  deps: NotificationServiceDeps,
  params: CreateNotificationParams,
): Promise<string | null> {
  const { drizzle, pubsub } = deps;
  const { organizationId, userId, templateKey, variables, relatedEntityId } = params;

  const notificationData = buildNotificationFromTemplate(templateKey, variables);

  const isEnabled = await isNotificationEnabled(deps, userId, notificationData.type);
  if (!isEnabled) {
    return null;
  }
  const [notification] = await drizzle
    .insert(schema.notifications)
    .values({
      organizationId,
      userId,
      type: notificationData.type,
      title: notificationData.title,
      description: notificationData.description,
      actionLabel: notificationData.actionLabel,
      actionUrl: notificationData.actionUrl,
      relatedEntityType: notificationData.relatedEntityType,
      relatedEntityId: relatedEntityId,
      isRead: false,
    })
    .returning({ id: notifications.id });

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
