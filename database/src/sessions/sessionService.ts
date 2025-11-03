import { eq, and, gte, lt, desc, count, not } from "drizzle-orm";
import { v4 as uuidv4 } from "uuid";
import type { DbDeps } from "../deps.js";
import {
  userSessions,
  loginAttempts,
  securityEvents,
  type UserSession,
  type NewUserSession,
  type NewLoginAttempt,
  type NewSecurityEvent,
  type LoginMethod,
  type RevokedReason,
  type EventType,
  type RiskLevel,
} from "../drizzle/index.js";
import { notEqual } from "assert";
import { schema } from "../drizzle.js";

export interface CreateSessionData {
  userId: string;
  deviceFingerprint: string;
  deviceName?: string;
  ipAddress: string;
  userAgent: string;
  location?: string;
  loginMethod: LoginMethod;
  expiresIn?: number; // minutes, defaults to 24 hours
}

export interface SessionInfo {
  id: string;
  userId: string;
  deviceName?: string | null;
  ipAddress: string;
  location?: string | null;
  loginMethod: LoginMethod;
  lastActivity: Date;
  createdAt: Date;
  isActive: boolean;
}

export interface LoginAttemptData {
  identifier: string; // email or IP
  identifierType: "email" | "ip";
  userId?: string;
  ipAddress: string;
  userAgent: string;
  success: boolean;
  failureReason?: string;
  riskScore?: number;
}

export class SessionService {
  private readonly MAX_CONCURRENT_SESSIONS = 5;
  private readonly DEFAULT_SESSION_DURATION_MINUTES = 24 * 60; // 24 hours

  async createSession(deps: DbDeps, data: CreateSessionData): Promise<UserSession> {
    const { drizzle, logger } = deps;

    const expiresAt = new Date();
    expiresAt.setMinutes(expiresAt.getMinutes() + (data.expiresIn ?? this.DEFAULT_SESSION_DURATION_MINUTES));

    await this.enforceConcurrentSessionLimits(deps, data.userId);

    const sessionData: NewUserSession = {
      userId: data.userId,
      deviceFingerprint: data.deviceFingerprint,
      deviceName: data.deviceName,
      ipAddress: data.ipAddress,
      userAgent: data.userAgent,
      location: data.location,
      loginMethod: data.loginMethod,
      expiresAt,
    };

    const [session] = await drizzle.insert(userSessions).values(sessionData).returning();

    logger.info(
      { sessionId: session.id, userId: data.userId, deviceFingerprint: data.deviceFingerprint },
      "User session created",
    );

    return session;
  }

  async getSessionById(deps: DbDeps, sessionId: string): Promise<UserSession | null> {
    const { drizzle } = deps;

    const session = await drizzle.query.userSessions.findFirst({
      where: and(
        eq(userSessions.id, sessionId),
        eq(userSessions.isActive, true),
        gte(userSessions.expiresAt, new Date()),
      ),
    });

    return session ?? null;
  }

  async updateSessionActivity(deps: DbDeps, sessionId: string): Promise<void> {
    const { drizzle, logger } = deps;

    await drizzle
      .update(userSessions)
      .set({
        lastActivity: new Date(),
        updatedAt: new Date(),
      })
      .where(eq(userSessions.id, sessionId));

    logger.debug({ sessionId }, "Session activity updated");
  }

  async revokeSession(deps: DbDeps, sessionId: string, reason: RevokedReason): Promise<void> {
    const { drizzle, logger } = deps;

    await drizzle
      .update(userSessions)
      .set({
        isActive: false,
        revokedAt: new Date(),
        revokedReason: reason,
        updatedAt: new Date(),
      })
      .where(eq(userSessions.id, sessionId));

    logger.info({ sessionId, reason }, "User session revoked");
  }

  async revokeAllUserSessions(
    deps: DbDeps,
    userId: string,
    reason: RevokedReason,
    excludeSessionId?: string,
  ): Promise<number> {
    const { drizzle, logger } = deps;

    const whereClause = excludeSessionId
      ? and(
          eq(userSessions.userId, userId),
          eq(userSessions.isActive, true),
          not(eq(userSessions.id, excludeSessionId)), // NOT operator would be better, but this works
        )
      : and(eq(userSessions.userId, userId), eq(userSessions.isActive, true));

    const result = await drizzle
      .update(userSessions)
      .set({
        isActive: false,
        revokedAt: new Date(),
        revokedReason: reason,
        updatedAt: new Date(),
      })
      .where(whereClause);

    logger.info({ userId, reason, excludeSessionId }, "All user sessions revoked");

    return result.rowCount ?? 0;
  }

  async getUserActiveSessions(deps: DbDeps, userId: string): Promise<SessionInfo[]> {
    const { drizzle } = deps;

    const sessions = await drizzle.query.userSessions.findMany({
      where: and(
        eq(userSessions.userId, userId),
        eq(userSessions.isActive, true),
        gte(userSessions.expiresAt, new Date()),
      ),
      orderBy: [desc(userSessions.lastActivity)],
    });

    return sessions.map((session) => ({
      id: session.id,
      userId: session.userId,
      deviceName: session.deviceName,
      ipAddress: session.ipAddress,
      location: session.location,
      loginMethod: session.loginMethod,
      lastActivity: session.lastActivity,
      createdAt: session.createdAt,
      isActive: session.isActive,
    }));
  }

  async cleanupExpiredSessions(deps: DbDeps): Promise<number> {
    const { drizzle, logger } = deps;

    const result = await drizzle
      .update(userSessions)
      .set({
        isActive: false,
        revokedAt: new Date(),
        revokedReason: "timeout",
        updatedAt: new Date(),
      })
      .where(and(eq(userSessions.isActive, true), lt(userSessions.expiresAt, new Date())));

    const cleanedCount = result.rowCount ?? 0;

    if (cleanedCount > 0) {
      logger.info({ cleanedCount }, "Expired sessions cleaned up");
    }

    return cleanedCount;
  }

  async logLoginAttempt(deps: DbDeps, data: LoginAttemptData): Promise<void> {
    const { drizzle, logger } = deps;

    const attemptData: NewLoginAttempt = {
      id: uuidv4(),
      identifier: data.identifier,
      identifierType: data.identifierType,
      userId: data.userId,
      ipAddress: data.ipAddress,
      userAgent: data.userAgent,
      success: data.success,
      failureReason: data.failureReason,
      riskScore: data.riskScore ?? 0,
    };

    await drizzle.insert(loginAttempts).values(attemptData);

    logger.debug(
      {
        identifier: data.identifier,
        success: data.success,
        riskScore: data.riskScore,
      },
      "Login attempt logged",
    );
  }

  async getRecentFailedAttempts(deps: DbDeps, identifier: string, windowMinutes = 15): Promise<number> {
    const { drizzle } = deps;

    const windowStart = new Date();
    windowStart.setMinutes(windowStart.getMinutes() - windowMinutes);

    const [result] = await drizzle
      .select({ count: count() })
      .from(loginAttempts)
      .where(
        and(
          eq(loginAttempts.identifier, identifier),
          eq(loginAttempts.success, false),
          gte(loginAttempts.attemptedAt, windowStart),
        ),
      );

    return result.count;
  }

  async logSecurityEvent(deps: DbDeps, data: typeof schema.securityEvents.$inferInsert): Promise<void> {
    const { drizzle, logger } = deps;

    await drizzle.insert(securityEvents).values(data);

    logger.info(
      {
        eventType: data.eventType,
        userId: data.userId,
        riskLevel: data.riskLevel,
        success: data.success,
      },
      "Security event logged",
    );
  }

  private async enforceConcurrentSessionLimits(deps: DbDeps, userId: string): Promise<void> {
    const { drizzle, logger } = deps;

    const activeSessions = await drizzle.query.userSessions.findMany({
      where: and(
        eq(userSessions.userId, userId),
        eq(userSessions.isActive, true),
        gte(userSessions.expiresAt, new Date()),
      ),
      orderBy: [desc(userSessions.lastActivity)],
    });

    if (activeSessions.length >= this.MAX_CONCURRENT_SESSIONS) {
      const sessionsToRevoke = activeSessions.slice(this.MAX_CONCURRENT_SESSIONS - 1);

      for (const session of sessionsToRevoke) {
        await this.revokeSession(deps, session.id, "new_device");
      }

      logger.info(
        {
          userId,
          revokedCount: sessionsToRevoke.length,
          maxSessions: this.MAX_CONCURRENT_SESSIONS,
        },
        "Old sessions revoked due to concurrent session limit",
      );
    }
  }
}

export const sessionService = new SessionService();
