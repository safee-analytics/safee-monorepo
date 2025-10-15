import { Request as ExRequest } from "express";
import { jwtService, type JwtPayload } from "../services/jwt.js";
import { getServerContext } from "../serverContext.js";

export interface AuthenticatedRequest extends ExRequest {
  user?: {
    userId: string;
    email: string;
    roles: string[];
    permissions: string[];
    organizationId: string;
  };
}

export function expressAuthentication(
  request: ExRequest,
  securityName: string,
  scopes?: string[],
): Promise<JwtPayload> {
  if (securityName === "jwt") {
    const context = getServerContext();

    // Check if authentication is disabled (development mode)
    if (!jwtService.isAuthEnabled()) {
      context.logger.debug("🚨 Authentication bypassed - Development mode");

      // Return mock user for development (matches seeded dev user)
      const mockUser: JwtPayload = {
        userId: "00000000-0000-0000-0000-000000000001",
        organizationId: "00000000-0000-0000-0000-000000000002",
        email: "dev@safee.local",
        roles: ["admin"],
        permissions: ["*"],
      };

      // Attach mock user to request
      (request as AuthenticatedRequest).user = {
        userId: mockUser.userId,
        email: mockUser.email,
        roles: mockUser.roles,
        permissions: mockUser.permissions,
        organizationId: mockUser.organizationId,
      };

      return Promise.resolve(mockUser);
    }

    const token = jwtService.extractTokenFromHeader(request.headers.authorization);

    if (!token) {
      context.logger.warn("Authentication failed - No token provided");
      return Promise.reject(new Error("No token provided"));
    }

    return jwtService
      .verifyAccessToken(token)
      .then((decoded) => {
        if (scopes && scopes.length > 0) {
          const hasPermission = scopes.some(
            (scope) =>
              decoded.permissions.includes("*") ||
              decoded.permissions.includes(scope) ||
              decoded.permissions.some(
                (permission) => permission.endsWith("*") && scope.startsWith(permission.slice(0, -1)),
              ),
          );

          if (!hasPermission) {
            context.logger.warn(
              {
                userId: decoded.userId,
                requiredScopes: scopes,
                userPermissions: decoded.permissions,
              },
              "Authorization failed - Insufficient permissions",
            );

            return Promise.reject(new Error("Insufficient permissions"));
          }
        }

        (request as AuthenticatedRequest).user = {
          userId: decoded.userId,
          email: decoded.email,
          roles: decoded.roles,
          permissions: decoded.permissions,
          organizationId: decoded.organizationId,
        };

        context.logger.debug({ userId: decoded.userId }, "Authentication successful");

        return decoded;
      })
      .catch((error) => {
        context.logger.warn({ error: error.message }, "Authentication failed");
        return Promise.reject(error);
      });
  }

  return Promise.reject(new Error("Unknown security name"));
}

export function requirePermissions(permissions: string[]) {
  return (request: AuthenticatedRequest): boolean => {
    if (!jwtService.isAuthEnabled()) {
      return true; // Allow everything in development mode
    }

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
    if (!jwtService.isAuthEnabled()) {
      return true; // Allow everything in development mode
    }

    const user = request.user;
    if (!user) {
      return false;
    }

    return roles.some((role) => user.roles.includes(role.toLowerCase()));
  };
}
