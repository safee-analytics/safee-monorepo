import type { DrizzleClient } from "@safee/database";
import { logger } from "../server/utils/logger.js";

export function createSessionHooks(drizzle: DrizzleClient) {
  return {
    session: {
      create: {
        before: async (session: { userId: string; [key: string]: unknown }) => {
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
          } catch (err) {
            logger.error(
              { error: err, userId: session.userId },
              "Failed to set active organization on session",
            );
          }

          return { data: session };
        },
      },
    },
  };
}
