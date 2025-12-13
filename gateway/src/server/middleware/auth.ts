import { Request as ExRequest } from "express";
import { fromNodeHeaders } from "better-auth/node";
import { type Session, type AuthUser, auth } from "../../auth/index.js";
import { getServerContext } from "../serverContext.js";
import { NoTokenProvided, InvalidToken, InsufficientPermissions, UnknownSecurityScheme } from "../errors.js";
import { addAuthContextToLogger } from "./logging.js";
import type { DrizzleClient } from "@safee/database";
import type { Logger } from "pino";

export interface AuthenticatedRequest extends ExRequest {
  betterAuthSession?: Session;
  drizzle: DrizzleClient;
  logger: Logger;
}

export async function expressAuthentication(
  request: ExRequest,
  securityName: string,
  scopes?: string[],
): Promise<AuthUser> {
  if (securityName === "jwt") {
    const context = getServerContext();

    try {
      const headers = fromNodeHeaders(request.headers);
      context.logger.info(
        {
          path: request.path,
          cookies: request.headers.cookie,
          hasAuthHeader: !!request.headers.authorization,
          origin: request.headers.origin,
          referer: request.headers.referer,
        },
        "Attempting to get session from Better Auth",
      );

      const session = await auth.api.getSession({
        headers,
      });
      context.logger.info(
        {
          hasSession: !!session,
          hasUser: !!session?.user,
          sessionData:
            session && session.user && session.session
              ? {
                  userId: session.user.id,
                  activeOrgId: session.session.activeOrganizationId,
                  fullSessionKeys: Object.keys(session.session),
                }
              : null,
        },
        "Better Auth session result",
      );

      // Note: Better Auth can return { user: null, session: null } at runtime
      // despite TypeScript types suggesting otherwise, so these checks are necessary
      // eslint-disable-next-line @typescript-eslint/prefer-optional-chain, @typescript-eslint/no-unnecessary-condition
      if (!session || !session.user || !session.session) {
        context.logger.warn(
          {
            path: request.path,
            hasCookies: !!request.headers.cookie,
            cookieHeader: request.headers.cookie,
          },
          "Authentication failed - No valid session",
        );
        throw new NoTokenProvided();
      }

      const user = session.user;

      if (scopes && scopes.length > 0) {
        const userRole = user.role ?? "user";
        const hasRole = scopes.includes(userRole) || userRole === "admin"; // admin can access all

        if (!hasRole) {
          context.logger.warn(
            {
              userId: user.id,
              requiredRoles: scopes,
              userRole,
            },
            "Authorization failed - Insufficient role",
          );

          throw new InsufficientPermissions();
        }
      }

      // Set Better Auth session on request for TSOA controllers
      (request as AuthenticatedRequest).betterAuthSession = session;

      // Add authentication context to request-scoped logger
      const organizationId = session.session.activeOrganizationId ?? null;
      addAuthContextToLogger(request, user.id, organizationId);

      context.logger.debug({ userId: user.id, organizationId }, "Extracted organization ID from session");

      context.logger.debug({ userId: user.id }, "Authentication successful");

      return user;
    } catch (err) {
      context.logger.warn({ error: err instanceof Error ? err.message : err }, "Authentication failed");

      if (
        err instanceof NoTokenProvided ||
        err instanceof InvalidToken ||
        err instanceof InsufficientPermissions
      ) {
        throw err;
      }

      throw new InvalidToken();
    }
  }

  throw new UnknownSecurityScheme(securityName);
}

export function requireRole(requiredRole: string) {
  return (request: AuthenticatedRequest): boolean => {
    const user = request.betterAuthSession?.user;
    if (!user) {
      return false;
    }

    // Admin can access everything
    if (user.role === "admin") {
      return true;
    }

    return user.role === requiredRole;
  };
}

export function requireAdmin() {
  return (request: AuthenticatedRequest): boolean => {
    const user = request.betterAuthSession?.user;
    return user !== undefined && user.role === "admin";
  };
}
