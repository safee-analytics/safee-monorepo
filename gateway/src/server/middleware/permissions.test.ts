import { describe, it, expect, beforeAll, afterAll, beforeEach, vi  } from "vitest";
import { type DrizzleClient, schema } from "@safee/database";
import { connectTest } from "@safee/database/test-helpers";
import {
  hasPermission,
  hasRole,
  requirePermission,
  canApprove,
  canSubmitForApproval,
} from "./permissions.js";
import type { AuthenticatedRequest } from "./auth.js";
import { InsufficientPermissions } from "../errors.js";

let testDrizzle: DrizzleClient;

vi.mock("../serverContext.js", () => ({
  getServerContext: vi.fn(() => ({
    logger: {
      info: vi.fn(),
      warn: vi.fn(),
      debug: vi.fn(),
      error: vi.fn(),
    },
    drizzle: testDrizzle,
  })),
}));

void describe("permissions middleware", () => {
  let drizzle: DrizzleClient;
  let close: () => Promise<void>;

  beforeAll(async () => {
    ({ drizzle, close } = await connectTest({ appName: "permissions-middleware-test" }));
    testDrizzle = drizzle;
  });

  beforeEach(async () => {
    await drizzle.delete(schema.members);
    await drizzle.delete(schema.users);
    await drizzle.delete(schema.organizations);
  });

  afterAll(async () => {
    await close();
  });

  void describe("hasPermission", () => {
    it("should return true for owner role", async () => {
      const timestamp = Date.now();
      const [org] = await drizzle
        .insert(schema.organizations)
        .values({
          name: `Test Org ${timestamp}`,
          slug: `test-org-${timestamp}`,
        })
        .returning();

      const [user] = await drizzle
        .insert(schema.users)
        .values({
          email: `owner-${timestamp}@example.com`,
          name: "Owner User",
        })
        .returning();

      await drizzle.insert(schema.members).values({
        userId: user.id,
        organizationId: org.id,
        role: "owner",
      });

      const result = await hasPermission(user.id, org.id, "delete", "users");
      expect(result).toBe(true);
    });

    it("should return true for admin role", async () => {
      const timestamp = Date.now();
      const [org] = await drizzle
        .insert(schema.organizations)
        .values({
          name: `Test Org ${timestamp}`,
          slug: `test-org-${timestamp}`,
        })
        .returning();

      const [user] = await drizzle
        .insert(schema.users)
        .values({
          email: `admin-${timestamp}@example.com`,
          name: "Admin User",
        })
        .returning();

      await drizzle.insert(schema.members).values({
        userId: user.id,
        organizationId: org.id,
        role: "admin",
      });

      const result = await hasPermission(user.id, org.id, "manage", "settings");
      expect(result).toBe(true);
    });

    it("should return false for member role with manage action", async () => {
      const timestamp = Date.now();
      const [org] = await drizzle
        .insert(schema.organizations)
        .values({
          name: `Test Org ${timestamp}`,
          slug: `test-org-${timestamp}`,
        })
        .returning();

      const [user] = await drizzle
        .insert(schema.users)
        .values({
          email: `member-${timestamp}@example.com`,
          name: "Member User",
        })
        .returning();

      await drizzle.insert(schema.members).values({
        userId: user.id,
        organizationId: org.id,
        role: "member",
      });

      const result = await hasPermission(user.id, org.id, "manage", "settings");
      expect(result).toBe(false);
    });

    it("should return true for member role with non-manage action", async () => {
      const timestamp = Date.now();
      const [org] = await drizzle
        .insert(schema.organizations)
        .values({
          name: `Test Org ${timestamp}`,
          slug: `test-org-${timestamp}`,
        })
        .returning();

      const [user] = await drizzle
        .insert(schema.users)
        .values({
          email: `member-${timestamp}@example.com`,
          name: "Member User",
        })
        .returning();

      await drizzle.insert(schema.members).values({
        userId: user.id,
        organizationId: org.id,
        role: "member",
      });

      const result = await hasPermission(user.id, org.id, "read", "invoices");
      expect(result).toBe(true);
    });

    it("should return false when user is not a member", async () => {
      const timestamp = Date.now();
      const [org] = await drizzle
        .insert(schema.organizations)
        .values({
          name: `Test Org ${timestamp}`,
          slug: `test-org-${timestamp}`,
        })
        .returning();

      const result = await hasPermission("00000000-0000-0000-0000-000000000999", org.id, "read", "users");
      expect(result).toBe(false);
    });
  });

  void describe("hasRole", () => {
    it("should return true when user has the specified role", async () => {
      const timestamp = Date.now();
      const [org] = await drizzle
        .insert(schema.organizations)
        .values({
          name: `Test Org ${timestamp}`,
          slug: `test-org-${timestamp}`,
        })
        .returning();

      const [user] = await drizzle
        .insert(schema.users)
        .values({
          email: `manager-${timestamp}@example.com`,
          name: "Manager User",
        })
        .returning();

      await drizzle.insert(schema.members).values({
        userId: user.id,
        organizationId: org.id,
        role: "manager",
      });

      const result = await hasRole(user.id, org.id, "manager");
      expect(result).toBe(true);
    });

    it("should return false when user has different role", async () => {
      const timestamp = Date.now();
      const [org] = await drizzle
        .insert(schema.organizations)
        .values({
          name: `Test Org ${timestamp}`,
          slug: `test-org-${timestamp}`,
        })
        .returning();

      const [user] = await drizzle
        .insert(schema.users)
        .values({
          email: `member-${timestamp}@example.com`,
          name: "Member User",
        })
        .returning();

      await drizzle.insert(schema.members).values({
        userId: user.id,
        organizationId: org.id,
        role: "member",
      });

      const result = await hasRole(user.id, org.id, "admin");
      expect(result).toBe(false);
    });

    it("should return false when user is not a member", async () => {
      const timestamp = Date.now();
      const [org] = await drizzle
        .insert(schema.organizations)
        .values({
          name: `Test Org ${timestamp}`,
          slug: `test-org-${timestamp}`,
        })
        .returning();

      const result = await hasRole("00000000-0000-0000-0000-000000000999", org.id, "admin");
      expect(result).toBe(false);
    });
  });

  void describe("requirePermission middleware", () => {
    it("should throw InsufficientPermissions when no session", async () => {
      const mockRequest = {} as AuthenticatedRequest;

      const middleware = requirePermission("read", "users");

      await expect(middleware(mockRequest)).rejects.toThrow(InsufficientPermissions);
    });

    it("should throw InsufficientPermissions when no organizationId", async () => {
      const mockRequest = {
        betterAuthSession: {
          user: { id: "user-123" },
          session: {},
        },
      } as AuthenticatedRequest;

      const middleware = requirePermission("read", "users");

      await expect(middleware(mockRequest)).rejects.toThrow(InsufficientPermissions);
    });

    it("should not throw when user has permission", async () => {
      const timestamp = Date.now();
      const [org] = await drizzle
        .insert(schema.organizations)
        .values({
          name: `Test Org ${timestamp}`,
          slug: `test-org-${timestamp}`,
        })
        .returning();

      const [user] = await drizzle
        .insert(schema.users)
        .values({
          email: `admin-${timestamp}@example.com`,
          name: "Admin User",
        })
        .returning();

      await drizzle.insert(schema.members).values({
        userId: user.id,
        organizationId: org.id,
        role: "admin",
      });

      const mockRequest = {
        betterAuthSession: {
          user: { id: user.id },
          session: { activeOrganizationId: org.id },
        },
      } as AuthenticatedRequest;

      const middleware = requirePermission("read", "users");

      await expect(middleware(mockRequest)).resolves.toBeUndefined();
    });
  });

  void describe("canApprove", () => {
    it("should return true for admin", async () => {
      const timestamp = Date.now();
      const [org] = await drizzle
        .insert(schema.organizations)
        .values({
          name: `Test Org ${timestamp}`,
          slug: `test-org-${timestamp}`,
        })
        .returning();

      const [user] = await drizzle
        .insert(schema.users)
        .values({
          email: `admin-${timestamp}@example.com`,
          name: "Admin User",
        })
        .returning();

      await drizzle.insert(schema.members).values({
        userId: user.id,
        organizationId: org.id,
        role: "admin",
      });

      const result = await canApprove(user.id, org.id, "invoices");
      expect(result).toBe(true);
    });
  });

  void describe("canSubmitForApproval", () => {
    it("should return true for member with create permission", async () => {
      const timestamp = Date.now();
      const [org] = await drizzle
        .insert(schema.organizations)
        .values({
          name: `Test Org ${timestamp}`,
          slug: `test-org-${timestamp}`,
        })
        .returning();

      const [user] = await drizzle
        .insert(schema.users)
        .values({
          email: `member-${timestamp}@example.com`,
          name: "Member User",
        })
        .returning();

      await drizzle.insert(schema.members).values({
        userId: user.id,
        organizationId: org.id,
        role: "member",
      });

      const result = await canSubmitForApproval(user.id, org.id, "invoices");
      expect(result).toBe(true);
    });
  });
});
