import { Request as ExRequest } from "express";
import { jwtService, type JwtPayload } from "../services/jwt.js";
import { getServerContext } from "../serverContext.js";
import {
  NoTokenProvided,
  InvalidToken,
  TokenExpired,
  InsufficientPermissions,
  UnknownSecurityScheme,
} from "../errors.js";

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

    const token = jwtService.extractTokenFromHeader(request.headers.authorization);

    if (!token) {
      context.logger.warn("Authentication failed - No token provided");
      return Promise.reject(new NoTokenProvided());
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

            throw new InsufficientPermissions();
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

        if (
          error instanceof NoTokenProvided ||
          error instanceof InvalidToken ||
          error instanceof TokenExpired ||
          error instanceof InsufficientPermissions
        ) {
          throw error;
        }

        if (error.message === "Invalid token") {
          throw new InvalidToken();
        }

        if (error.message === "Token expired") {
          throw new TokenExpired();
        }

        throw new InvalidToken();
      });
  }

  return Promise.reject(new UnknownSecurityScheme(securityName));
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
