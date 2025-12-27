import { eq, and, desc, sql, gte } from "drizzle-orm";
import { caseActivities, casePresence } from "../drizzle/index.js";
import type { DbDeps } from "../deps.js";
import type {
  CaseActivity,
  CaseActivityWithUser,
  CasePresence,
  CasePresenceWithUser,
  CreateCaseActivityInput,
  UpdatePresenceInput,
} from "./types.js";

export async function createActivity(deps: DbDeps, input: CreateCaseActivityInput): Promise<CaseActivity> {
  const [activity] = await deps.drizzle.insert(caseActivities).values(input).returning();
  return activity;
}

export async function getActivitiesByCase(
  deps: DbDeps,
  caseId: string,
  limit = 50,
): Promise<CaseActivityWithUser[]> {
  return deps.drizzle.query.caseActivities.findMany({
    where: eq(caseActivities.caseId, caseId),
    orderBy: [desc(caseActivities.createdAt)],
    limit,
    with: {
      user: {
        columns: {
          id: true,
          name: true,
          email: true,
        },
      },
    },
  });
}

export async function getActivitiesByOrganization(
  deps: DbDeps,
  organizationId: string,
  limit = 100,
): Promise<CaseActivityWithUser[]> {
  // TODO:make the find many use org id
  return deps.drizzle.query.caseActivities.findMany({
    orderBy: [desc(caseActivities.createdAt)],
    limit,
    with: {
      case: {
        columns: {
          id: true,
          caseNumber: true,
          clientName: true,
          organizationId: true,
        },
      },
      user: {
        columns: {
          id: true,
          name: true,
          email: true,
        },
      },
    },
  });
}

export async function markActivitiesAsRead(
  deps: DbDeps,
  userId: string,
  activityIds: string[],
): Promise<void> {
  //TODO: Use inarray
  for (const activityId of activityIds) {
    const activity = await deps.drizzle.query.caseActivities.findFirst({
      where: eq(caseActivities.id, activityId),
    });

    if (activity) {
      const updatedIsRead = { ...(activity.isRead ?? {}), [userId]: true };
      await deps.drizzle
        .update(caseActivities)
        .set({ isRead: updatedIsRead })
        .where(eq(caseActivities.id, activityId));
    }
  }
}

export async function updatePresence(deps: DbDeps, input: UpdatePresenceInput): Promise<CasePresence> {
  const existing = await deps.drizzle.query.casePresence.findFirst({
    where: and(eq(casePresence.caseId, input.caseId), eq(casePresence.userId, input.userId)),
  });

  if (existing) {
    const [updated] = await deps.drizzle
      .update(casePresence)
      .set({ lastSeenAt: new Date() })
      .where(eq(casePresence.id, existing.id))
      .returning();
    return updated;
  }

  const [created] = await deps.drizzle.insert(casePresence).values(input).returning();
  return created;
}

export async function getActiveViewers(deps: DbDeps, caseId: string): Promise<CasePresenceWithUser[]> {
  const fiveMinutesAgo = new Date(Date.now() - 5 * 60 * 1000);

  return deps.drizzle.query.casePresence.findMany({
    where: and(eq(casePresence.caseId, caseId), gte(casePresence.lastSeenAt, fiveMinutesAgo)),
    with: {
      user: {
        columns: {
          id: true,
          name: true,
          email: true,
        },
      },
    },
  });
}

export async function cleanupInactivePresence(deps: DbDeps): Promise<void> {
  const tenMinutesAgo = new Date(Date.now() - 10 * 60 * 1000);

  await deps.drizzle.delete(casePresence).where(sql`${casePresence.lastSeenAt} < ${tenMinutesAgo}`);
}
