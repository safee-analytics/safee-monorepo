import { eq, and, gte, count } from "drizzle-orm";
import { v4 as uuidv4 } from "uuid";
import type { DbDeps } from "../deps.js";
import { loginAttempts, securityEvents, type NewLoginAttempt } from "../drizzle/index.js";
import { schema } from "../drizzle.js";

/**
 * Service for audit and security logging
 *
 * Note: Session management is now handled by Better Auth.
 * This service only provides audit logging functionality for:
 * - Login attempts (rate limiting, suspicious activity detection)
 * - Security events (audit trail for compliance)
 */

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
  /**
   * Log a login attempt for rate limiting and security monitoring
   */
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

  /**
   * Get count of recent failed login attempts for rate limiting
   */
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

  /**
   * Log a security event for audit trail and compliance
   */
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
}

export const sessionService = new SessionService();
