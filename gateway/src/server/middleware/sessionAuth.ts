import { Request, Response, NextFunction } from "express";
import jwt from "jsonwebtoken";
import { sessionService } from "@safee/database";
import { getServerContext } from "../serverContext.js";
import { getAuthConfig } from "../../config/index.js";

interface JWTPayload {
  userId: string;
  organizationId: string;
  email: string;
  sessionId?: string;
  roles: string[];
  permissions: string[];
  iat?: number;
  exp?: number;
}

export async function sessionAuthMiddleware(req: Request, res: Response, next: NextFunction) {
  try {
    const authHeader = req.headers.authorization;

    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      return res.status(401).json({ error: "Missing or invalid authorization header" });
    }

    const token = authHeader.substring(7);
    const config = getAuthConfig();

    // Verify JWT token
    let decoded: JWTPayload;
    try {
      decoded = jwt.verify(token, config.jwtSecret) as JWTPayload;
    } catch (err) {
      const context = getServerContext();
      context.logger.debug({ error: err }, "JWT verification failed");
      return res.status(401).json({ error: "Invalid token" });
    }

    // If token has sessionId, validate the session
    if (decoded.sessionId) {
      const context = getServerContext();
      const deps = { drizzle: context.drizzle, logger: context.logger };

      const session = await sessionService.getSessionById(deps, decoded.sessionId);

      if (!session) {
        return res.status(401).json({ error: "Session not found or expired" });
      }

      if (!session.isActive) {
        return res.status(401).json({ error: "Session has been revoked" });
      }

      if (session.userId !== decoded.userId) {
        return res.status(401).json({ error: "Session user mismatch" });
      }

      // Update session activity
      await sessionService.updateSessionActivity(deps, decoded.sessionId);

      // Add session info to request
      req.user = {
        ...decoded,
        sessionInfo: {
          id: session.id,
          deviceName: session.deviceName,
          ipAddress: session.ipAddress,
          lastActivity: session.lastActivity,
          loginMethod: session.loginMethod,
        },
      };
    } else {
      // Token without session (legacy or service token)
      req.user = decoded;
    }

    return next();
  } catch (error) {
    const context = getServerContext();
    context.logger.error({ error }, "Session auth middleware error");
    return res.status(500).json({ error: "Internal server error" });
  }
}

// Enhanced auth middleware that also logs security events
export async function enhancedSessionAuthMiddleware(req: Request, res: Response, next: NextFunction) {
  const startTime = Date.now();
  const ipAddress = req.ip || req.socket?.remoteAddress || "unknown";
  const userAgent = req.get("User-Agent") || "unknown";

  try {
    return await sessionAuthMiddleware(req, res, (err) => {
      if (err) {
        return next(err);
      }

      if (req.user) {
        const context = getServerContext();
        const deps = { drizzle: context.drizzle, logger: context.logger };

        const isSensitiveOperation =
          req.method !== "GET" ||
          req.path.includes("admin") ||
          req.path.includes("settings") ||
          req.path.includes("delete");

        if (isSensitiveOperation) {
          sessionService
            .logSecurityEvent(deps, {
              userId: req.user.userId,
              organizationId: req.user.organizationId,
              eventType: "login_success", // This represents an authenticated action
              resource: req.path,
              action: req.method,
              ipAddress,
              userAgent,
              success: true,
              riskLevel: "low",
              metadata: {
                responseTime: Date.now() - startTime,
                endpoint: `${req.method} ${req.path}`,
              },
            })
            .catch((err) => {
              context.logger.error({ error: err }, "Failed to log security event");
            });
        }
      }

      return next();
    });
  } catch (error) {
    const context = getServerContext();
    context.logger.error({ error, ipAddress, userAgent }, "Enhanced session auth middleware error");
    return res.status(500).json({ error: "Internal server error" });
  }
}

// Middleware to check specific permissions
export function requirePermission(resource: string, action: string) {
  return (req: Request, res: Response, next: NextFunction) => {
    if (!req.user) {
      res.status(401).json({ error: "Authentication required" });
      return;
    }

    // Check if user has the specific permission
    const hasPermission =
      req.user.permissions.includes(`${resource}.${action}`) || req.user.permissions.includes("*"); // Admin permission

    if (!hasPermission) {
      const context = getServerContext();
      const deps = { drizzle: context.drizzle, logger: context.logger };

      // Log unauthorized access attempt
      sessionService
        .logSecurityEvent(deps, {
          userId: req.user.userId,
          organizationId: req.user.organizationId,
          eventType: "permission_changed", // Reusing this for permission denied
          resource,
          action,
          ipAddress: req.ip || "unknown",
          userAgent: req.get("User-Agent") || "unknown",
          success: false,
          riskLevel: "medium",
          metadata: {
            requiredPermission: `${resource}.${action}`,
            userPermissions: req.user.permissions,
          },
        })
        .catch((err) => {
          context.logger.error({ error: err }, "Failed to log permission denied event");
        });

      res.status(403).json({
        error: "Insufficient permissions",
        required: `${resource}.${action}`,
      });
      return;
    }

    next();
  };
}

// Middleware to check roles
export function requireRole(role: string) {
  return (req: Request, res: Response, next: NextFunction) => {
    if (!req.user) {
      res.status(401).json({ error: "Authentication required" });
      return;
    }

    const hasRole = req.user.roles.includes(role) || req.user.roles.includes("admin");

    if (!hasRole) {
      res.status(403).json({
        error: "Insufficient role",
        required: role,
      });
      return;
    }

    next();
  };
}

declare global {
  // eslint-disable-next-line @typescript-eslint/no-namespace
  namespace Express {
    interface Request {
      user?: JWTPayload & {
        sessionInfo?: {
          id: string;
          deviceName?: string | null;
          ipAddress: string;
          lastActivity: Date;
          loginMethod: string;
        };
      };
    }
  }
}
