import { describe, it, expect, vi, beforeEach } from "vitest";
import { SessionService } from "./sessionService.js";
import type { DbDeps } from "../deps.js";

describe("SessionService", () => {
  let sessionService: SessionService;
  let mockDeps: DbDeps;

  beforeEach(() => {
    const mockLogger = {
      info: vi.fn(),
      debug: vi.fn(),
      warn: vi.fn(),
      error: vi.fn(),
      fatal: vi.fn(),
      trace: vi.fn(),
      child: vi.fn(),
      level: "info",
    };

    const mockQuery = {
      userSessions: {
        findFirst: vi.fn(),
        findMany: vi.fn(),
      },
    };

    const mockInsertChain = {
      values: vi.fn().mockReturnValue({
        returning: vi.fn().mockResolvedValue([]),
      }),
    };

    const mockUpdateChain = {
      set: vi.fn().mockReturnValue({
        where: vi.fn().mockResolvedValue({ rowCount: 0 }),
      }),
    };

    const mockSelectChain = {
      from: vi.fn().mockReturnValue({
        where: vi.fn().mockResolvedValue([{ count: 0 }]),
      }),
    };

    const mockDrizzle = {
      insert: vi.fn().mockReturnValue(mockInsertChain),
      update: vi.fn().mockReturnValue(mockUpdateChain),
      select: vi.fn().mockReturnValue(mockSelectChain),
      query: mockQuery,
    };

    mockDeps = {
      drizzle: mockDrizzle,
      logger: mockLogger,
    } as unknown as DbDeps;

    sessionService = new SessionService();
  });

  describe("createSession", () => {
    it("should create a new session with default expiration", async () => {
      const sessionData = {
        userId: "user-123",
        deviceFingerprint: "fingerprint-abc",
        deviceName: "Chrome on Windows",
        ipAddress: "192.168.1.1",
        userAgent: "Mozilla/5.0...",
        location: "New York, US",
        loginMethod: "password" as const,
      };

      const mockSession = {
        id: "session-123",
        ...sessionData,
        isActive: true,
        expiresAt: new Date(),
        lastActivity: new Date(),
        createdAt: new Date(),
        updatedAt: new Date(),
        revokedAt: null,
        revokedReason: null,
      };

      vi.mocked(mockDeps.drizzle.query.userSessions.findMany).mockResolvedValue([]);
      vi.mocked(mockDeps.drizzle.insert).mockReturnValue({
        values: vi.fn().mockReturnValue({
          returning: vi.fn().mockResolvedValue([mockSession]),
        }),
      } as never);

      const result = await sessionService.createSession(mockDeps, sessionData);

      expect(result).toEqual(mockSession);
      expect(mockDeps.drizzle.insert).toHaveBeenCalled();
      expect(mockDeps.logger.info).toHaveBeenCalledWith(
        expect.objectContaining({
          sessionId: expect.any(String) as string,
          userId: "user-123",
          deviceFingerprint: "fingerprint-abc",
        }),
        "User session created",
      );
    });

    it("should create session with custom expiration time", async () => {
      const sessionData = {
        userId: "user-123",
        deviceFingerprint: "fingerprint-abc",
        ipAddress: "192.168.1.1",
        userAgent: "Mozilla/5.0...",
        loginMethod: "sso" as const,
        expiresIn: 60, // 1 hour
      };

      const mockSession = {
        id: "session-123",
        ...sessionData,
        deviceName: null,
        location: null,
        isActive: true,
        expiresAt: new Date(),
        lastActivity: new Date(),
        createdAt: new Date(),
        updatedAt: new Date(),
        revokedAt: null,
        revokedReason: null,
      };

      vi.mocked(mockDeps.drizzle.query.userSessions.findMany).mockResolvedValue([]);
      vi.mocked(mockDeps.drizzle.insert).mockReturnValue({
        values: vi.fn().mockReturnValue({
          returning: vi.fn().mockResolvedValue([mockSession]),
        }),
      } as never);

      const result = await sessionService.createSession(mockDeps, sessionData);

      expect(result).toBeDefined();
      expect(mockDeps.drizzle.insert).toHaveBeenCalled();
    });

    it("should enforce concurrent session limits", async () => {
      const sessionData = {
        userId: "user-123",
        deviceFingerprint: "fingerprint-new",
        ipAddress: "192.168.1.1",
        userAgent: "Mozilla/5.0...",
        loginMethod: "password" as const,
      };

      // Mock 5 existing active sessions
      const existingSessions = Array.from({ length: 5 }, (_, index) => ({
        id: `session-${index}`,
        userId: "user-123",
        deviceFingerprint: `fingerprint-${index}`,
        deviceName: `Device ${index}`,
        ipAddress: "192.168.1.1",
        userAgent: "Mozilla/5.0...",
        location: null,
        loginMethod: "password" as const,
        isActive: true,
        expiresAt: new Date(Date.now() + 1000 * 60 * 60),
        lastActivity: new Date(Date.now() - index * 1000),
        createdAt: new Date(),
        updatedAt: new Date(),
        revokedAt: null,
        revokedReason: null,
      }));

      vi.mocked(mockDeps.drizzle.query.userSessions.findMany).mockResolvedValue(existingSessions);
      vi.mocked(mockDeps.drizzle.update).mockReturnValue({
        set: vi.fn().mockReturnValue({
          where: vi.fn().mockResolvedValue({ rowCount: 1 }),
        }),
      } as never);

      const mockNewSession = {
        id: "session-new",
        ...sessionData,
        deviceName: null,
        location: null,
        isActive: true,
        expiresAt: new Date(),
        lastActivity: new Date(),
        createdAt: new Date(),
        updatedAt: new Date(),
        revokedAt: null,
        revokedReason: null,
      };

      vi.mocked(mockDeps.drizzle.insert).mockReturnValue({
        values: vi.fn().mockReturnValue({
          returning: vi.fn().mockResolvedValue([mockNewSession]),
        }),
      } as never);

      await sessionService.createSession(mockDeps, sessionData);

      expect(mockDeps.drizzle.update).toHaveBeenCalled();
      expect(mockDeps.logger.info).toHaveBeenCalledWith(
        expect.objectContaining({ revokedCount: 1, maxSessions: 5 }),
        "Old sessions revoked due to concurrent session limit",
      );
    });
  });

  describe("getSessionById", () => {
    it("should return active session when found", async () => {
      const mockSession = {
        id: "session-123",
        userId: "user-123",
        deviceFingerprint: "fingerprint-abc",
        deviceName: "Chrome",
        ipAddress: "192.168.1.1",
        userAgent: "Mozilla/5.0...",
        location: null,
        loginMethod: "password" as const,
        isActive: true,
        expiresAt: new Date(Date.now() + 1000 * 60 * 60),
        lastActivity: new Date(),
        createdAt: new Date(),
        updatedAt: new Date(),
        revokedAt: null,
        revokedReason: null,
      };

      vi.mocked(mockDeps.drizzle.query.userSessions.findFirst).mockResolvedValue(mockSession);

      const result = await sessionService.getSessionById(mockDeps, "session-123");

      expect(result).toEqual(mockSession);
    });

    it("should return null when session not found", async () => {
      vi.mocked(mockDeps.drizzle.query.userSessions.findFirst).mockResolvedValue(undefined);

      const result = await sessionService.getSessionById(mockDeps, "nonexistent-session");

      expect(result).toBeNull();
    });

    it("should only return active non-expired sessions", async () => {
      vi.mocked(mockDeps.drizzle.query.userSessions.findFirst).mockResolvedValue(undefined);

      const result = await sessionService.getSessionById(mockDeps, "expired-session");

      expect(result).toBeNull();
    });
  });

  describe("updateSessionActivity", () => {
    it("should update session last activity timestamp", async () => {
      const mockUpdate = {
        set: vi.fn().mockReturnValue({
          where: vi.fn().mockResolvedValue(undefined),
        }),
      };
      vi.mocked(mockDeps.drizzle.update).mockReturnValue(mockUpdate as never);

      await sessionService.updateSessionActivity(mockDeps, "session-123");

      expect(mockDeps.drizzle.update).toHaveBeenCalled();
      expect(mockUpdate.set).toHaveBeenCalledWith(
        expect.objectContaining({
          lastActivity: expect.any(Date) as Date,
          updatedAt: expect.any(Date) as Date,
        }),
      );
      expect(mockDeps.logger.debug).toHaveBeenCalledWith(
        { sessionId: "session-123" },
        "Session activity updated",
      );
    });
  });

  describe("revokeSession", () => {
    it("should revoke session with specified reason", async () => {
      const mockUpdate = {
        set: vi.fn().mockReturnValue({
          where: vi.fn().mockResolvedValue(undefined),
        }),
      };
      vi.mocked(mockDeps.drizzle.update).mockReturnValue(mockUpdate as never);

      await sessionService.revokeSession(mockDeps, "session-123", "logout");

      expect(mockDeps.drizzle.update).toHaveBeenCalled();
      expect(mockUpdate.set).toHaveBeenCalledWith(
        expect.objectContaining({
          isActive: false,
          revokedAt: expect.any(Date) as Date,
          revokedReason: "logout",
          updatedAt: expect.any(Date) as Date,
        }),
      );
      expect(mockDeps.logger.info).toHaveBeenCalledWith(
        { sessionId: "session-123", reason: "logout" },
        "User session revoked",
      );
    });

    it("should handle different revocation reasons", async () => {
      const mockUpdate = {
        set: vi.fn().mockReturnValue({
          where: vi.fn().mockResolvedValue(undefined),
        }),
      };
      vi.mocked(mockDeps.drizzle.update).mockReturnValue(mockUpdate as never);

      const reasons = ["logout", "admin", "timeout", "security", "new_device"] as const;

      for (const reason of reasons) {
        await sessionService.revokeSession(mockDeps, "session-123", reason);
        expect(mockUpdate.set).toHaveBeenCalledWith(
          expect.objectContaining({
            revokedReason: reason,
          }),
        );
      }
    });
  });

  describe("revokeAllUserSessions", () => {
    it("should revoke all sessions for a user", async () => {
      const mockUpdate = {
        set: vi.fn().mockReturnValue({
          where: vi.fn().mockResolvedValue({ rowCount: 3 }),
        }),
      };
      vi.mocked(mockDeps.drizzle.update).mockReturnValue(mockUpdate as never);

      const result = await sessionService.revokeAllUserSessions(mockDeps, "user-123", "admin");

      expect(result).toBe(3);
      expect(mockDeps.logger.info).toHaveBeenCalledWith(
        { userId: "user-123", reason: "admin", excludeSessionId: undefined },
        "All user sessions revoked",
      );
    });

    it("should revoke all sessions except excluded one", async () => {
      const mockUpdate = {
        set: vi.fn().mockReturnValue({
          where: vi.fn().mockResolvedValue({ rowCount: 2 }),
        }),
      };
      vi.mocked(mockDeps.drizzle.update).mockReturnValue(mockUpdate as never);

      const result = await sessionService.revokeAllUserSessions(
        mockDeps,
        "user-123",
        "security",
        "session-current",
      );

      expect(result).toBe(2);
      expect(mockDeps.logger.info).toHaveBeenCalledWith(
        { userId: "user-123", reason: "security", excludeSessionId: "session-current" },
        "All user sessions revoked",
      );
    });

    it("should handle case when no sessions to revoke", async () => {
      const mockUpdate = {
        set: vi.fn().mockReturnValue({
          where: vi.fn().mockResolvedValue({ rowCount: 0 }),
        }),
      };
      vi.mocked(mockDeps.drizzle.update).mockReturnValue(mockUpdate as never);

      const result = await sessionService.revokeAllUserSessions(mockDeps, "user-no-sessions", "admin");

      expect(result).toBe(0);
    });
  });

  describe("getUserActiveSessions", () => {
    it("should return list of active sessions", async () => {
      const mockSessions = [
        {
          id: "session-1",
          userId: "user-123",
          deviceFingerprint: "fp-1",
          deviceName: "Chrome",
          ipAddress: "192.168.1.1",
          userAgent: "Mozilla/5.0...",
          location: "New York",
          loginMethod: "password" as const,
          isActive: true,
          expiresAt: new Date(Date.now() + 1000 * 60 * 60),
          lastActivity: new Date(),
          createdAt: new Date(),
          updatedAt: new Date(),
          revokedAt: null,
          revokedReason: null,
        },
        {
          id: "session-2",
          userId: "user-123",
          deviceFingerprint: "fp-2",
          deviceName: "Safari",
          ipAddress: "192.168.1.2",
          userAgent: "Mozilla/5.0...",
          location: null,
          loginMethod: "sso" as const,
          isActive: true,
          expiresAt: new Date(Date.now() + 1000 * 60 * 60),
          lastActivity: new Date(),
          createdAt: new Date(),
          updatedAt: new Date(),
          revokedAt: null,
          revokedReason: null,
        },
      ];

      vi.mocked(mockDeps.drizzle.query.userSessions.findMany).mockResolvedValue(mockSessions);

      const result = await sessionService.getUserActiveSessions(mockDeps, "user-123");

      expect(result).toHaveLength(2);
      expect(result[0]).toEqual({
        id: "session-1",
        userId: "user-123",
        deviceName: "Chrome",
        ipAddress: "192.168.1.1",
        location: "New York",
        loginMethod: "password",
        lastActivity: mockSessions[0].lastActivity,
        createdAt: mockSessions[0].createdAt,
        isActive: true,
      });
    });

    it("should return empty array when no active sessions", async () => {
      vi.mocked(mockDeps.drizzle.query.userSessions.findMany).mockResolvedValue([]);

      const result = await sessionService.getUserActiveSessions(mockDeps, "user-no-sessions");

      expect(result).toEqual([]);
    });
  });

  describe("cleanupExpiredSessions", () => {
    it("should cleanup expired sessions and return count", async () => {
      const mockUpdate = {
        set: vi.fn().mockReturnValue({
          where: vi.fn().mockResolvedValue({ rowCount: 5 }),
        }),
      };
      vi.mocked(mockDeps.drizzle.update).mockReturnValue(mockUpdate as never);

      const result = await sessionService.cleanupExpiredSessions(mockDeps);

      expect(result).toBe(5);
      expect(mockDeps.drizzle.update).toHaveBeenCalled();
      expect(mockUpdate.set).toHaveBeenCalledWith(
        expect.objectContaining({
          isActive: false,
          revokedReason: "timeout",
        }),
      );
      expect(mockDeps.logger.info).toHaveBeenCalledWith({ cleanedCount: 5 }, "Expired sessions cleaned up");
    });

    it("should not log when no sessions to cleanup", async () => {
      const mockUpdate = {
        set: vi.fn().mockReturnValue({
          where: vi.fn().mockResolvedValue({ rowCount: 0 }),
        }),
      };
      vi.mocked(mockDeps.drizzle.update).mockReturnValue(mockUpdate as never);

      const result = await sessionService.cleanupExpiredSessions(mockDeps);

      expect(result).toBe(0);
      expect(mockDeps.logger.info).not.toHaveBeenCalled();
    });
  });

  describe("logLoginAttempt", () => {
    it("should log successful login attempt", async () => {
      const attemptData = {
        identifier: "user@example.com",
        identifierType: "email" as const,
        userId: "user-123",
        ipAddress: "192.168.1.1",
        userAgent: "Mozilla/5.0...",
        success: true,
        riskScore: 0,
      };

      vi.mocked(mockDeps.drizzle.insert).mockReturnValue({
        values: vi.fn().mockResolvedValue(undefined),
      } as never);

      await sessionService.logLoginAttempt(mockDeps, attemptData);

      expect(mockDeps.drizzle.insert).toHaveBeenCalled();
      expect(mockDeps.logger.debug).toHaveBeenCalledWith(
        expect.objectContaining({
          identifier: "user@example.com",
          success: true,
          riskScore: 0,
        }),
        "Login attempt logged",
      );
    });

    it("should log failed login attempt with reason", async () => {
      const attemptData = {
        identifier: "192.168.1.100",
        identifierType: "ip" as const,
        ipAddress: "192.168.1.100",
        userAgent: "Mozilla/5.0...",
        success: false,
        failureReason: "invalid_credentials",
        riskScore: 5,
      };

      vi.mocked(mockDeps.drizzle.insert).mockReturnValue({
        values: vi.fn().mockResolvedValue(undefined),
      } as never);

      await sessionService.logLoginAttempt(mockDeps, attemptData);

      expect(mockDeps.drizzle.insert).toHaveBeenCalled();
      expect(mockDeps.logger.debug).toHaveBeenCalledWith(
        expect.objectContaining({
          identifier: "192.168.1.100",
          success: false,
          riskScore: 5,
        }),
        "Login attempt logged",
      );
    });

    it("should default risk score to 0 when not provided", async () => {
      const attemptData = {
        identifier: "user@example.com",
        identifierType: "email" as const,
        ipAddress: "192.168.1.1",
        userAgent: "Mozilla/5.0...",
        success: true,
      };

      vi.mocked(mockDeps.drizzle.insert).mockReturnValue({
        values: vi.fn().mockResolvedValue(undefined),
      } as never);

      await sessionService.logLoginAttempt(mockDeps, attemptData);

      expect(mockDeps.drizzle.insert).toHaveBeenCalled();
    });
  });

  describe("getRecentFailedAttempts", () => {
    it("should return count of failed attempts in default window", async () => {
      const mockSelect = {
        from: vi.fn().mockReturnValue({
          where: vi.fn().mockResolvedValue([{ count: 3 }]),
        }),
      };
      vi.mocked(mockDeps.drizzle.select).mockReturnValue(mockSelect as never);

      const result = await sessionService.getRecentFailedAttempts(mockDeps, "user@example.com");

      expect(result).toBe(3);
      expect(mockDeps.drizzle.select).toHaveBeenCalled();
    });

    it("should use custom time window", async () => {
      const mockSelect = {
        from: vi.fn().mockReturnValue({
          where: vi.fn().mockResolvedValue([{ count: 5 }]),
        }),
      };
      vi.mocked(mockDeps.drizzle.select).mockReturnValue(mockSelect as never);

      const result = await sessionService.getRecentFailedAttempts(mockDeps, "192.168.1.100", 30);

      expect(result).toBe(5);
    });

    it("should return 0 when no failed attempts", async () => {
      const mockSelect = {
        from: vi.fn().mockReturnValue({
          where: vi.fn().mockResolvedValue([{ count: 0 }]),
        }),
      };
      vi.mocked(mockDeps.drizzle.select).mockReturnValue(mockSelect as never);

      const result = await sessionService.getRecentFailedAttempts(mockDeps, "user@example.com");

      expect(result).toBe(0);
    });
  });

  describe("logSecurityEvent", () => {
    it("should log security event with all data", async () => {
      const eventData = {
        userId: "user-123",
        organizationId: "org-456",
        eventType: "login_success" as const,
        resource: "user_account",
        action: "authenticate",
        ipAddress: "192.168.1.1",
        userAgent: "Mozilla/5.0...",
        location: "New York, US",
        riskLevel: "medium" as const,
        success: true,
        metadata: { method: "password", mfaUsed: true },
      };

      vi.mocked(mockDeps.drizzle.insert).mockReturnValue({
        values: vi.fn().mockResolvedValue(undefined),
      } as never);

      await sessionService.logSecurityEvent(mockDeps, eventData);

      expect(mockDeps.drizzle.insert).toHaveBeenCalled();
      expect(mockDeps.logger.info).toHaveBeenCalledWith(
        expect.objectContaining({
          eventType: "login_success",
          userId: "user-123",
          riskLevel: "medium",
          success: true,
        }),
        "Security event logged",
      );
    });

    it("should log security event with minimal data", async () => {
      const eventData = {
        organizationId: "org-456",
        eventType: "suspicious_activity" as const,
        ipAddress: "192.168.1.1",
        userAgent: "Mozilla/5.0...",
        success: false,
      };

      vi.mocked(mockDeps.drizzle.insert).mockReturnValue({
        values: vi.fn().mockResolvedValue(undefined),
      } as never);

      await sessionService.logSecurityEvent(mockDeps, eventData);

      expect(mockDeps.drizzle.insert).toHaveBeenCalled();
      expect(mockDeps.logger.info).toHaveBeenCalled();
    });

    it("should default risk level to low when not provided", async () => {
      const eventData = {
        organizationId: "org-456",
        eventType: "login_success" as const,
        ipAddress: "192.168.1.1",
        userAgent: "Mozilla/5.0...",
        success: true,
      };

      vi.mocked(mockDeps.drizzle.insert).mockReturnValue({
        values: vi.fn().mockResolvedValue(undefined),
      } as never);

      await sessionService.logSecurityEvent(mockDeps, eventData);

      expect(mockDeps.drizzle.insert).toHaveBeenCalled();
    });

    it("should stringify metadata", async () => {
      const eventData = {
        organizationId: "org-456",
        eventType: "permission_changed" as const,
        ipAddress: "192.168.1.1",
        userAgent: "Mozilla/5.0...",
        success: true,
        metadata: { sensitive: true, resourceId: "res-123" },
      };

      vi.mocked(mockDeps.drizzle.insert).mockReturnValue({
        values: vi.fn().mockResolvedValue(undefined),
      } as never);

      await sessionService.logSecurityEvent(mockDeps, eventData);

      expect(mockDeps.drizzle.insert).toHaveBeenCalled();
    });
  });
});
