import { schema, eq, and, desc, count, isNull, DbDeps, NotificationType, RelatedEntityType } from "../index.js";

const { notifications } = schema;

export interface NotificationResponse {
  id: string;
  type: NotificationType;
  title: string;
  description: string;
  timestamp: string;
  isRead: boolean;
  relatedEntityType: RelatedEntityType | null;
  relatedEntityId: string | null;
  actionLabel: string | null;
  actionUrl: string | null;
}

export async function getRecentNotifications(
  deps: DbDeps,
  userId: string,
  organizationId: string,
  limit = 10,
): Promise<NotificationResponse[]> {
  const { drizzle } = deps;

  const results = await drizzle.query.notifications.findMany({
    where: and(
      eq(notifications.userId, userId),
      eq(notifications.organizationId, organizationId),
      isNull(notifications.deletedAt),
    ),
    orderBy: [desc(notifications.createdAt)],
    limit,
  });

  return results.map((n) => ({
    id: n.id,
    type: n.type,
    title: n.title,
    description: n.description,
    timestamp: n.createdAt.toISOString(),
    isRead: n.isRead,
    relatedEntityType: n.relatedEntityType,
    relatedEntityId: n.relatedEntityId,
    actionLabel: n.actionLabel,
    actionUrl: n.actionUrl,
  }));
}

export async function markNotificationAsRead(
  deps: DbDeps,
  notificationId: string,
  userId: string,
): Promise<void> {
  const { drizzle } = deps;

  await drizzle
    .update(notifications)
    .set({
      isRead: true,
      readAt: new Date(),
    })
    .where(and(eq(notifications.id, notificationId), eq(notifications.userId, userId)));
}

export async function markNotificationAsUnread(
  deps: DbDeps,
  notificationId: string,
  userId: string,
): Promise<void> {
  const { drizzle } = deps;

  await drizzle
    .update(notifications)
    .set({
      isRead: false,
      readAt: null,
    })
    .where(and(eq(notifications.id, notificationId), eq(notifications.userId, userId)));
}

export async function markNotificationAsDeleted(
  deps: DbDeps,
  notificationId: string,
  userId: string,
): Promise<void> {
  const { drizzle } = deps;

  await drizzle
    .update(notifications)
    .set({
      deletedAt: new Date(),
    })
    .where(and(eq(notifications.id, notificationId), eq(notifications.userId, userId)));
}

export async function getUnreadNotificationsCount(
  deps: DbDeps,
  userId: string,
  organizationId: string,
): Promise<number> {
  const { drizzle } = deps;

  const [result] = await drizzle
    .select({ count: count() })
    .from(notifications)
    .where(
      and(
        eq(notifications.userId, userId),
        eq(notifications.organizationId, organizationId),
        eq(notifications.isRead, false),
        isNull(notifications.deletedAt),
      ),
    );

  return result.count;
}
