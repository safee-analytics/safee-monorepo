import { Controller, Get, Post, Route, Tags, Security, SuccessResponse, Path, Request } from "tsoa";
import type { Request as ExpressRequest } from "express";
import { getServerContext, type ServerContext } from "../serverContext.js";
import { sessionService } from "@safee/database";

interface SessionInfo {
  id: string;
  userId: string;
  deviceName?: string | null;
  ipAddress: string;
  location?: string | null;
  loginMethod: string;
  lastActivity: Date;
  createdAt: Date;
  isActive: boolean;
}

interface SessionListResponse {
  sessions: SessionInfo[];
  currentSessionId?: string;
}

interface RevokeSessionResponse {
  message: string;
  revokedSessionId: string;
}

@Route("sessions")
@Tags("Session Management")
@Security("jwt")
export class SessionController extends Controller {
  private context: ServerContext;

  constructor(context?: ServerContext) {
    super();
    this.context = context ?? getServerContext();
  }

  /**
   * Get all active sessions for the current user
   */
  @Get("/")
  @Security("jwt")
  @SuccessResponse("200", "Sessions retrieved successfully")
  public async getUserSessions(@Request() req: ExpressRequest): Promise<SessionListResponse> {
    const deps = { drizzle: this.context.drizzle, logger: this.context.logger };

    try {
      if (!req.user?.userId) {
        this.setStatus(401);
        throw new Error("User not authenticated");
      }

      const sessions = await sessionService.getUserActiveSessions(deps, req.user.userId);

      this.context.logger.debug(
        { userId: req.user.userId, sessionCount: sessions.length },
        "Retrieved user sessions",
      );

      return {
        sessions,
        currentSessionId: req.user.sessionId,
      };
    } catch (error) {
      this.context.logger.error({ error, userId: req.user?.userId }, "Failed to retrieve user sessions");
      this.setStatus(500);
      throw new Error("Failed to retrieve sessions");
    }
  }

  /**
   * Revoke a specific session
   */
  @Post("/{sessionId}/revoke")
  @Security("jwt")
  @SuccessResponse("200", "Session revoked successfully")
  public async revokeSession(
    @Path() sessionId: string,
    @Request() req: ExpressRequest,
  ): Promise<RevokeSessionResponse> {
    const deps = { drizzle: this.context.drizzle, logger: this.context.logger };
    const ipAddress = req.ip || req.connection?.remoteAddress || "unknown";
    const userAgent = req.get("User-Agent") || "unknown";

    try {
      if (!req.user?.userId) {
        this.setStatus(401);
        throw new Error("User not authenticated");
      }

      // First, verify the session belongs to the current user
      const session = await sessionService.getSessionById(deps, sessionId);

      if (!session) {
        this.setStatus(404);
        throw new Error("Session not found");
      }

      if (session.userId !== req.user.userId) {
        this.setStatus(403);
        throw new Error("Cannot revoke another user's session");
      }

      // Revoke the session
      await sessionService.revokeSession(deps, sessionId, "admin");

      // Log security event
      await sessionService.logSecurityEvent(deps, {
        userId: req.user.userId,
        organizationId: req.user.organizationId,
        eventType: "session_revoked",
        ipAddress,
        userAgent,
        success: true,
        riskLevel: "low",
        metadata: {
          revokedSessionId: sessionId,
          reason: "user_requested",
        },
      });

      this.context.logger.info(
        {
          userId: req.user.userId,
          revokedSessionId: sessionId,
          currentSessionId: req.user.sessionId,
        },
        "Session revoked by user",
      );

      return {
        message: "Session revoked successfully",
        revokedSessionId: sessionId,
      };
    } catch (error) {
      this.context.logger.error(
        {
          error,
          userId: req.user?.userId,
          sessionId,
        },
        "Failed to revoke session",
      );

      if (error instanceof Error) {
        if (error.message.includes("not found")) {
          this.setStatus(404);
          throw error;
        }
        if (error.message.includes("Cannot revoke")) {
          this.setStatus(403);
          throw error;
        }
      }

      this.setStatus(500);
      throw new Error("Failed to revoke session");
    }
  }

  /**
   * Revoke all other sessions (keep current session active)
   */
  @Post("/revoke-all-others")
  @Security("jwt")
  @SuccessResponse("200", "All other sessions revoked successfully")
  public async revokeAllOtherSessions(
    @Request() req: ExpressRequest,
  ): Promise<{ message: string; revokedCount: number }> {
    const deps = { drizzle: this.context.drizzle, logger: this.context.logger };
    const ipAddress = req.ip || req.socket?.remoteAddress || "unknown";
    const userAgent = req.get("User-Agent") || "unknown";

    try {
      if (!req.user?.userId) {
        this.setStatus(401);
        throw new Error("User not authenticated");
      }

      const currentSessionId = req.user.sessionId;

      // Get all sessions first to count them
      const allSessions = await sessionService.getUserActiveSessions(deps, req.user.userId);
      const _otherSessionsCount = currentSessionId
        ? allSessions.filter((s) => s.id !== currentSessionId).length
        : allSessions.length;

      // Revoke all other sessions
      const revokedCount = await sessionService.revokeAllUserSessions(
        deps,
        req.user.userId,
        "security",
        currentSessionId,
      );

      // Log security event
      await sessionService.logSecurityEvent(deps, {
        userId: req.user.userId,
        organizationId: req.user.organizationId,
        eventType: "session_revoked",
        ipAddress,
        userAgent,
        success: true,
        riskLevel: "medium", // Higher risk level for bulk revocation
        metadata: {
          action: "revoke_all_others",
          revokedCount,
          currentSessionId,
        },
      });

      this.context.logger.info(
        {
          userId: req.user.userId,
          revokedCount,
          currentSessionId,
        },
        "All other sessions revoked by user",
      );

      return {
        message: `${revokedCount} other sessions revoked successfully`,
        revokedCount,
      };
    } catch (error) {
      this.context.logger.error(
        {
          error,
          userId: req.user?.userId,
        },
        "Failed to revoke all other sessions",
      );

      this.setStatus(500);
      throw new Error("Failed to revoke other sessions");
    }
  }

  /**
   * Get current session information
   */
  @Get("/current")
  @Security("jwt")
  @SuccessResponse("200", "Current session retrieved successfully")
  public async getCurrentSession(@Request() req: ExpressRequest): Promise<{
    sessionId?: string;
    sessionInfo?: unknown;
    userInfo: {
      userId: string;
      email: string;
      roles: string[];
      permissions: string[];
    };
  }> {
    try {
      if (!req.user?.userId) {
        this.setStatus(401);
        throw new Error("User not authenticated");
      }

      return {
        sessionId: req.user.sessionId,
        sessionInfo: req.user.sessionInfo,
        userInfo: {
          userId: req.user.userId,
          email: req.user.email,
          roles: req.user.roles,
          permissions: req.user.permissions,
        },
      };
    } catch (error) {
      this.context.logger.error({ error }, "Failed to get current session");
      this.setStatus(500);
      throw new Error("Failed to get current session");
    }
  }
}
