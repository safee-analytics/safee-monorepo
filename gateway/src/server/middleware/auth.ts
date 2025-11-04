import { Request as ExRequest } from "express";
import { fromNodeHeaders } from "better-auth/node";
import { auth } from "../../auth.js";
import { getServerContext } from "../serverContext.js";
import { NoTokenProvided, InvalidToken, InsufficientPermissions, UnknownSecurityScheme } from "../errors.js";

export interface AuthenticatedRequest extends ExRequest {
  user?: {
    userId: string;
    email: string;
    roles: string[];
    permissions: string[];
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
  // Add custom fields as needed
  roles?: string[];
  permissions?: string[];
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
      const session = await auth.api.getSession({
        headers: fromNodeHeaders(request.headers),
      });

      if (!session?.user) {
        context.logger.warn("Authentication failed - No valid session");
        throw new NoTokenProvided();
      }

      const user = session.user as BetterAuthUser;

      // Check permissions if scopes are provided
      if (scopes && scopes.length > 0) {
        const userPermissions = user.permissions || [];
        const hasPermission = scopes.some(
          (scope) =>
            userPermissions.includes("*") ||
            userPermissions.includes(scope) ||
            userPermissions.some(
              (permission) => permission.endsWith("*") && scope.startsWith(permission.slice(0, -1)),
            ),
        );

        if (!hasPermission) {
          context.logger.warn(
            {
              userId: user.id,
              requiredScopes: scopes,
              userPermissions,
            },
            "Authorization failed - Insufficient permissions",
          );

          throw new InsufficientPermissions();
        }
      }

      // Set user on request for TSOA controllers
      (request as AuthenticatedRequest).user = {
        userId: user.id,
        email: user.email,
        roles: user.roles || [],
        permissions: user.permissions || [],
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

export function requirePermissions(permissions: string[]) {
  return (request: AuthenticatedRequest): boolean => {
    const user = request.user;
    if (!user) {
      return false;
    }

    return permissions.some(
      (permission) =>
        user.permissions.includes("*") ||
        user.permissions.includes(permission) ||
        user.permissions.some(
          (userPerm) => userPerm.endsWith("*") && permission.startsWith(userPerm.slice(0, -1)),
        ),
    );
  };
}

export function requireRoles(roles: string[]) {
  return (request: AuthenticatedRequest): boolean => {
    const user = request.user;
    if (!user) {
      return false;
    }

    return roles.some((role) => user.roles.includes(role.toLowerCase()));
  };
}
