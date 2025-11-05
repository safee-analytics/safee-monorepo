import type { DrizzleClient } from "@safee/database";
import { logger } from "../server/utils/logger.js";

/**
 * Session hooks for Better Auth
 * Sets active organization on session creation
 */
export function createSessionHooks(drizzle: DrizzleClient) {
  return {
    session: {
      create: {
        before: async (session: { userId: string; [key: string]: unknown }) => {
          // Set active organization on session creation
          try {
            const member = await drizzle.query.members.findFirst({
              where: (members, { eq }) => eq(members.userId, session.userId),
            });

            if (member) {
              return {
                data: {
                  ...session,
                  activeOrganizationId: member.organizationId,
                },
              };
            }
          } catch (error) {
            logger.error({ error, userId: session.userId }, "Failed to set active organization on session");
          }

          return { data: session };
        },
      },
    },
  };
}
