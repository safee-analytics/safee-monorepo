import { describe, it, expect, vi, beforeEach } from "vitest";
import { Request as ExRequest } from "express";
import { expressAuthentication, requireRole, requireAdmin, type AuthenticatedRequest } from "./auth.js";
import { NoTokenProvided, InvalidToken, InsufficientPermissions, UnknownSecurityScheme } from "../errors.js";
import { auth } from "../../auth/index.js";

vi.mock("../../auth/index.js", () => ({
  auth: {
    api: {
      getSession: vi.fn(),
    },
  },
}));

vi.mock("../serverContext.js", () => ({
  getServerContext: vi.fn(() => ({
    logger: {
      info: vi.fn(),
      warn: vi.fn(),
      debug: vi.fn(),
      error: vi.fn(),
    },
    drizzle: {},
  })),
}));

vi.mock("./logging.js", () => ({
  addAuthContextToLogger: vi.fn(),
}));

void describe("auth middleware", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  void describe("expressAuthentication", () => {
    it("should authenticate successfully with valid session", async () => {
      const mockSession = {
        user: {
          id: "user-123",
          email: "test@example.com",
          name: "Test User",
          role: "user",
        },
        session: {
          id: "session-123",
          userId: "user-123",
          createdAt: new Date(),
          updatedAt: new Date(),
          expiresAt: new Date(Date.now() + 86400000),
          token: "mock-token",
          activeOrganizationId: "org-123",
        },
      };

      vi.mocked(auth.api.getSession).mockResolvedValue(
        mockSession as unknown as Awaited<ReturnType<typeof auth.api.getSession>>,
      );

      const mockRequest = {
        headers: {
          authorization: "Bearer token",
        },
        path: "/api/test",
      } as unknown as ExRequest;

      const result = await expressAuthentication(mockRequest, "jwt");

      expect(result).toEqual(mockSession.user);
      expect((mockRequest as AuthenticatedRequest).betterAuthSession).toEqual(mockSession);
    });

    it("should throw NoTokenProvided when no session exists", async () => {
      vi.mocked(auth.api.getSession).mockResolvedValue(null);

      const mockRequest = {
        headers: {},
        path: "/api/test",
      } as unknown as ExRequest;

      await expect(expressAuthentication(mockRequest, "jwt")).rejects.toThrow(NoTokenProvided);
    });

    it("should throw NoTokenProvided when session has no user", async () => {
      vi.mocked(auth.api.getSession).mockResolvedValue({
        user: null,
        session: null,
      } as unknown as Awaited<ReturnType<typeof auth.api.getSession>>);

      const mockRequest = {
        headers: {},
        path: "/api/test",
      } as unknown as ExRequest;

      await expect(expressAuthentication(mockRequest, "jwt")).rejects.toThrow(NoTokenProvided);
    });

    it("should check role scopes correctly for admin", async () => {
      const mockSession = {
        user: {
          id: "user-123",
          email: "admin@example.com",
          name: "Admin User",
          role: "admin",
        },
        session: {
          id: "session-123",
          userId: "user-123",
          createdAt: new Date(),
          updatedAt: new Date(),
          expiresAt: new Date(Date.now() + 86400000),
          token: "mock-token",
          activeOrganizationId: "org-123",
        },
      };

      vi.mocked(auth.api.getSession).mockResolvedValue(
        mockSession as unknown as Awaited<ReturnType<typeof auth.api.getSession>>,
      );

      const mockRequest = {
        headers: {
          authorization: "Bearer token",
        },
        path: "/api/test",
      } as unknown as ExRequest;

      const result = await expressAuthentication(mockRequest, "jwt", ["manager"]);

      expect(result).toEqual(mockSession.user);
    });

    it("should throw InsufficientPermissions when role does not match scopes", async () => {
      const mockSession = {
        user: {
          id: "user-123",
          email: "test@example.com",
          name: "Test User",
          role: "user",
        },
        session: {
          id: "session-123",
          userId: "user-123",
          createdAt: new Date(),
          updatedAt: new Date(),
          expiresAt: new Date(Date.now() + 86400000),
          token: "mock-token",
          activeOrganizationId: "org-123",
        },
      };

      vi.mocked(auth.api.getSession).mockResolvedValue(
        mockSession as unknown as Awaited<ReturnType<typeof auth.api.getSession>>,
      );

      const mockRequest = {
        headers: {
          authorization: "Bearer token",
        },
        path: "/api/test",
      } as unknown as ExRequest;

      await expect(expressAuthentication(mockRequest, "jwt", ["admin", "manager"])).rejects.toThrow(
        InsufficientPermissions,
      );
    });

    it("should allow access when user role matches one of the scopes", async () => {
      const mockSession = {
        user: {
          id: "user-123",
          email: "manager@example.com",
          name: "Manager User",
          role: "manager",
        },
        session: {
          id: "session-123",
          userId: "user-123",
          createdAt: new Date(),
          updatedAt: new Date(),
          expiresAt: new Date(Date.now() + 86400000),
          token: "mock-token",
          activeOrganizationId: "org-123",
        },
      };

      vi.mocked(auth.api.getSession).mockResolvedValue(
        mockSession as unknown as Awaited<ReturnType<typeof auth.api.getSession>>,
      );

      const mockRequest = {
        headers: {
          authorization: "Bearer token",
        },
        path: "/api/test",
      } as unknown as ExRequest;

      const result = await expressAuthentication(mockRequest, "jwt", ["admin", "manager"]);

      expect(result).toEqual(mockSession.user);
    });

    it("should throw UnknownSecurityScheme for non-jwt security", async () => {
      const mockRequest = {
        headers: {},
        path: "/api/test",
      } as unknown as ExRequest;

      await expect(expressAuthentication(mockRequest, "apiKey")).rejects.toThrow(UnknownSecurityScheme);
    });

    it("should throw InvalidToken on authentication errors", async () => {
      vi.mocked(auth.api.getSession).mockRejectedValue(new Error("Invalid token"));

      const mockRequest = {
        headers: {
          authorization: "Bearer invalid",
        },
        path: "/api/test",
      } as unknown as ExRequest;

      await expect(expressAuthentication(mockRequest, "jwt")).rejects.toThrow(InvalidToken);
    });
  });

  void describe("requireRole", () => {
    it("should return true for matching role", () => {
      const mockRequest = {
        betterAuthSession: {
          user: {
            id: "user-123",
            role: "manager",
          },
          session: {},
        },
      } as AuthenticatedRequest;

      const checkRole = requireRole("manager");
      expect(checkRole(mockRequest)).toBe(true);
    });

    it("should return false for non-matching role", () => {
      const mockRequest = {
        betterAuthSession: {
          user: {
            id: "user-123",
            role: "user",
          },
          session: {},
        },
      } as AuthenticatedRequest;

      const checkRole = requireRole("manager");
      expect(checkRole(mockRequest)).toBe(false);
    });

    it("should return true for admin accessing any role", () => {
      const mockRequest = {
        betterAuthSession: {
          user: {
            id: "user-123",
            role: "admin",
          },
          session: {},
        },
      } as AuthenticatedRequest;

      const checkRole = requireRole("manager");
      expect(checkRole(mockRequest)).toBe(true);
    });

    it("should return false when no session exists", () => {
      const mockRequest = {} as AuthenticatedRequest;

      const checkRole = requireRole("manager");
      expect(checkRole(mockRequest)).toBe(false);
    });
  });

  void describe("requireAdmin", () => {
    it("should return true for admin role", () => {
      const mockRequest = {
        betterAuthSession: {
          user: {
            id: "user-123",
            role: "admin",
          },
          session: {},
        },
      } as AuthenticatedRequest;

      const checkAdmin = requireAdmin();
      expect(checkAdmin(mockRequest)).toBe(true);
    });

    it("should return false for non-admin role", () => {
      const mockRequest = {
        betterAuthSession: {
          user: {
            id: "user-123",
            role: "user",
          },
          session: {},
        },
      } as AuthenticatedRequest;

      const checkAdmin = requireAdmin();
      expect(checkAdmin(mockRequest)).toBe(false);
    });

    it("should return false when no session exists", () => {
      const mockRequest = {} as AuthenticatedRequest;

      const checkAdmin = requireAdmin();
      expect(checkAdmin(mockRequest)).toBe(false);
    });
  });
});
