import { Request as ExRequest } from "express";
import { fromNodeHeaders } from "better-auth/node";
import { auth } from "../../auth/index.js";
import { getServerContext } from "../serverContext.js";
import { NoTokenProvided, InvalidToken, InsufficientPermissions, UnknownSecurityScheme } from "../errors.js";

export interface AuthenticatedRequest extends ExRequest {
  user?: {
    id: string;
    email: string;
    role: string;
    organizationId: string;
  };
}

export interface BetterAuthUser {
  id: string;
  email: string;
  name: string;
  emailVerified: boolean;
  createdAt: Date;
  updatedAt: Date;
  role?: string;
  organizationId?: string;
}

export async function expressAuthentication(
  request: ExRequest,
  securityName: string,
  scopes?: string[],
): Promise<BetterAuthUser> {
  if (securityName === "jwt") {
    const context = getServerContext();

    try {
      // Get session from Better Auth using request headers
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
          sessionData: session ? { userId: session.user?.id, hasSession: !!session.session } : null,
        },
        "Better Auth session result",
      );

      if (!session?.user) {
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

      const user = session.user as BetterAuthUser;

      // Check roles if scopes are provided (scopes map to roles in Better Auth)
      if (scopes && scopes.length > 0) {
        const userRole = user.role || "user";
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

      // Set user on request for TSOA controllers
      (request as AuthenticatedRequest).user = {
        id: user.id,
        email: user.email,
        role: user.role || "user",
        organizationId: user.organizationId || "",
      };

      context.logger.debug({ userId: user.id }, "Authentication successful");

      return user;
    } catch (error) {
      context.logger.warn({ error: error instanceof Error ? error.message : error }, "Authentication failed");

      if (
        error instanceof NoTokenProvided ||
        error instanceof InvalidToken ||
        error instanceof InsufficientPermissions
      ) {
        throw error;
      }

      throw new InvalidToken();
    }
  }

  throw new UnknownSecurityScheme(securityName);
}

export function requireRole(requiredRole: string) {
  return (request: AuthenticatedRequest): boolean => {
    const user = request.user;
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
    const user = request.user;
    return user?.role === "admin";
  };
}
