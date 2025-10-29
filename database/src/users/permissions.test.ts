import { describe, it, expect, vi, beforeEach } from "vitest";
import {
  getUserRoles,
  getUserPermissions,
  userHasPermission,
  userHasAnyPermission,
  assignRoleToUser,
  removeRoleFromUser,
  getRoleBySlug,
  createSystemRoles,
  getUserPermissionStrings,
  getUserRoleStrings,
} from "./permissions.js";
import type { DbDeps } from "../deps.js";

describe("Permission Utilities", () => {
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
      roles: {
        findFirst: vi.fn(),
      },
    };

    const mockInsertChain = {
      values: vi.fn().mockReturnValue({
        onConflictDoNothing: vi.fn().mockResolvedValue(undefined),
      }),
    };

    const mockDeleteChain = {
      where: vi.fn().mockResolvedValue(undefined),
    };

    const mockSelectChain = {
      from: vi.fn().mockReturnValue({
        innerJoin: vi.fn().mockReturnThis(),
        where: vi.fn().mockResolvedValue([]),
      }),
    };

    const mockDrizzle = {
      insert: vi.fn().mockReturnValue(mockInsertChain),
      delete: vi.fn().mockReturnValue(mockDeleteChain),
      select: vi.fn().mockReturnValue(mockSelectChain),
      query: mockQuery,
    };

    mockDeps = {
      drizzle: mockDrizzle,
      logger: mockLogger,
    } as unknown as DbDeps;
  });

  describe("getUserRoles", () => {
    it("should return user roles", async () => {
      const mockRoles = [
        {
          role: {
            id: "role-1",
            name: "Admin",
            slug: "admin",
            description: "Administrator role",
            isSystemRole: true,
            organizationId: null,
            createdAt: new Date(),
            updatedAt: new Date(),
          },
        },
        {
          role: {
            id: "role-2",
            name: "Manager",
            slug: "manager",
            description: "Manager role",
            isSystemRole: true,
            organizationId: null,
            createdAt: new Date(),
            updatedAt: new Date(),
          },
        },
      ];

      vi.mocked(mockDeps.drizzle.select).mockReturnValue({
        from: vi.fn().mockReturnValue({
          innerJoin: vi.fn().mockReturnValue({
            where: vi.fn().mockResolvedValue(mockRoles),
          }),
        }),
      } as never);

      const result = await getUserRoles(mockDeps, "user-123");

      expect(result).toHaveLength(2);
      expect(result[0].name).toBe("Admin");
      expect(result[1].name).toBe("Manager");
    });

    it("should return empty array if user has no roles", async () => {
      vi.mocked(mockDeps.drizzle.select).mockReturnValue({
        from: vi.fn().mockReturnValue({
          innerJoin: vi.fn().mockReturnValue({
            where: vi.fn().mockResolvedValue([]),
          }),
        }),
      } as never);

      const result = await getUserRoles(mockDeps, "user-no-roles");

      expect(result).toEqual([]);
    });
  });

  describe("getUserPermissions", () => {
    it("should return user permissions", async () => {
      const mockPermissions = [
        {
          permission: {
            id: "perm-1",
            name: "Read Users",
            slug: "read-users",
            resource: "users" as const,
            action: "read" as const,
            description: "Can read users",
            createdAt: new Date(),
            updatedAt: new Date(),
          },
        },
        {
          permission: {
            id: "perm-2",
            name: "Write Users",
            slug: "write-users",
            resource: "users" as const,
            action: "update" as const,
            description: "Can write users",
            createdAt: new Date(),
            updatedAt: new Date(),
          },
        },
      ];

      vi.mocked(mockDeps.drizzle.select).mockReturnValue({
        from: vi.fn().mockReturnValue({
          innerJoin: vi.fn().mockReturnThis(),
          where: vi.fn().mockResolvedValue(mockPermissions),
        }),
      } as never);

      const result = await getUserPermissions(mockDeps, "user-123");

      expect(result).toHaveLength(2);
      expect(result[0].resource).toBe("users");
      expect(result[0].action).toBe("read");
      expect(result[1].action).toBe("update");
    });

    it("should return empty array if user has no permissions", async () => {
      vi.mocked(mockDeps.drizzle.select).mockReturnValue({
        from: vi.fn().mockReturnValue({
          innerJoin: vi.fn().mockReturnThis(),
          where: vi.fn().mockResolvedValue([]),
        }),
      } as never);

      const result = await getUserPermissions(mockDeps, "user-no-perms");

      expect(result).toEqual([]);
    });
  });

  describe("userHasPermission", () => {
    it("should return true if user has the permission", async () => {
      const mockPermissions = [
        {
          permission: {
            id: "perm-1",
            name: "Read Users",
            slug: "read-users",
            resource: "users" as const,
            action: "read" as const,
            description: "Can read users",
            createdAt: new Date(),
            updatedAt: new Date(),
          },
        },
      ];

      vi.mocked(mockDeps.drizzle.select).mockReturnValue({
        from: vi.fn().mockReturnValue({
          innerJoin: vi.fn().mockReturnThis(),
          where: vi.fn().mockResolvedValue(mockPermissions),
        }),
      } as never);

      const result = await userHasPermission(mockDeps, "user-123", "users", "read");

      expect(result).toBe(true);
    });

    it("should return false if user does not have the permission", async () => {
      vi.mocked(mockDeps.drizzle.select).mockReturnValue({
        from: vi.fn().mockReturnValue({
          innerJoin: vi.fn().mockReturnThis(),
          where: vi.fn().mockResolvedValue([]),
        }),
      } as never);

      const result = await userHasPermission(mockDeps, "user-123", "users", "delete");

      expect(result).toBe(false);
    });
  });

  describe("userHasAnyPermission", () => {
    it("should return true if user has at least one of the required permissions", async () => {
      const mockPermissions = [
        {
          permission: {
            id: "perm-1",
            name: "Read Users",
            slug: "read-users",
            resource: "users" as const,
            action: "read" as const,
            description: "Can read users",
            createdAt: new Date(),
            updatedAt: new Date(),
          },
        },
      ];

      vi.mocked(mockDeps.drizzle.select).mockReturnValue({
        from: vi.fn().mockReturnValue({
          innerJoin: vi.fn().mockReturnThis(),
          where: vi.fn().mockResolvedValue(mockPermissions),
        }),
      } as never);

      const result = await userHasAnyPermission(mockDeps, "user-123", [
        { resource: "users", action: "read" },
        { resource: "users", action: "update" },
      ]);

      expect(result).toBe(true);
    });

    it("should return false if user has none of the required permissions", async () => {
      vi.mocked(mockDeps.drizzle.select).mockReturnValue({
        from: vi.fn().mockReturnValue({
          innerJoin: vi.fn().mockReturnThis(),
          where: vi.fn().mockResolvedValue([]),
        }),
      } as never);

      const result = await userHasAnyPermission(mockDeps, "user-123", [
        { resource: "users", action: "delete" },
        { resource: "organizations", action: "delete" },
      ]);

      expect(result).toBe(false);
    });
  });

  describe("assignRoleToUser", () => {
    it("should assign role to user successfully", async () => {
      vi.mocked(mockDeps.drizzle.insert).mockReturnValue({
        values: vi.fn().mockReturnValue({
          onConflictDoNothing: vi.fn().mockResolvedValue(undefined),
        }),
      } as never);

      await assignRoleToUser(mockDeps, "user-123", "role-456");

      expect(mockDeps.drizzle.insert).toHaveBeenCalled();
      expect(mockDeps.logger.info).toHaveBeenCalledWith(
        { userId: "user-123", roleId: "role-456" },
        "Role assigned to user",
      );
    });

    it("should handle errors when assigning role", async () => {
      vi.mocked(mockDeps.drizzle.insert).mockReturnValue({
        values: vi.fn().mockReturnValue({
          onConflictDoNothing: vi.fn().mockRejectedValue(new Error("Database error")),
        }),
      } as never);

      await expect(assignRoleToUser(mockDeps, "user-123", "role-456")).rejects.toThrow("Database error");
      expect(mockDeps.logger.error).toHaveBeenCalled();
    });
  });

  describe("removeRoleFromUser", () => {
    it("should remove role from user successfully", async () => {
      vi.mocked(mockDeps.drizzle.delete).mockReturnValue({
        where: vi.fn().mockResolvedValue(undefined),
      } as never);

      await removeRoleFromUser(mockDeps, "user-123", "role-456");

      expect(mockDeps.drizzle.delete).toHaveBeenCalled();
      expect(mockDeps.logger.info).toHaveBeenCalledWith(
        { userId: "user-123", roleId: "role-456" },
        "Role removed from user",
      );
    });

    it("should handle errors when removing role", async () => {
      vi.mocked(mockDeps.drizzle.delete).mockReturnValue({
        where: vi.fn().mockRejectedValue(new Error("Database error")),
      } as never);

      await expect(removeRoleFromUser(mockDeps, "user-123", "role-456")).rejects.toThrow("Database error");
      expect(mockDeps.logger.error).toHaveBeenCalled();
    });
  });

  describe("getRoleBySlug", () => {
    it("should return role by slug", async () => {
      const mockRole = {
        id: "role-1",
        name: "Admin",
        slug: "admin",
        description: "Administrator role",
        isSystemRole: true,
        isActive: true,
        organizationId: null,
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      vi.mocked(mockDeps.drizzle.query.roles.findFirst).mockResolvedValue(mockRole);

      const result = await getRoleBySlug(mockDeps, "admin");

      expect(result).toBeDefined();
      expect(result?.slug).toBe("admin");
      expect(result?.name).toBe("Admin");
    });

    it("should return null if role not found", async () => {
      vi.mocked(mockDeps.drizzle.query.roles.findFirst).mockResolvedValue(undefined);

      const result = await getRoleBySlug(mockDeps, "nonexistent");

      expect(result).toBeNull();
    });
  });

  describe("createSystemRoles", () => {
    it("should create all system roles", async () => {
      vi.mocked(mockDeps.drizzle.insert).mockReturnValue({
        values: vi.fn().mockReturnValue({
          onConflictDoNothing: vi.fn().mockResolvedValue(undefined),
        }),
      } as never);

      await createSystemRoles(mockDeps);

      expect(mockDeps.drizzle.insert).toHaveBeenCalledTimes(4); // Admin, Manager, Accountant, Employee
      expect(mockDeps.logger.info).toHaveBeenCalledWith("System roles created successfully");
    });

    it("should handle errors when creating system roles", async () => {
      vi.mocked(mockDeps.drizzle.insert).mockReturnValue({
        values: vi.fn().mockReturnValue({
          onConflictDoNothing: vi.fn().mockRejectedValue(new Error("Database error")),
        }),
      } as never);

      await expect(createSystemRoles(mockDeps)).rejects.toThrow("Database error");
      expect(mockDeps.logger.error).toHaveBeenCalled();
    });
  });

  describe("getUserPermissionStrings", () => {
    it("should return wildcard for admin users", async () => {
      const mockRoles = [
        {
          role: {
            id: "role-1",
            name: "Admin",
            slug: "admin",
            description: "Administrator",
            isSystemRole: true,
            organizationId: null,
            createdAt: new Date(),
            updatedAt: new Date(),
          },
        },
      ];

      const mockPermissions = [
        {
          permission: {
            id: "perm-1",
            name: "Read Users",
            slug: "read-users",
            resource: "users" as const,
            action: "read" as const,
            description: "Can read users",
            createdAt: new Date(),
            updatedAt: new Date(),
          },
        },
      ];

      vi.mocked(mockDeps.drizzle.select)
        .mockReturnValueOnce({
          from: vi.fn().mockReturnValue({
            innerJoin: vi.fn().mockReturnThis(),
            where: vi.fn().mockResolvedValue(mockPermissions),
          }),
        } as never)
        .mockReturnValueOnce({
          from: vi.fn().mockReturnValue({
            innerJoin: vi.fn().mockReturnValue({
              where: vi.fn().mockResolvedValue(mockRoles),
            }),
          }),
        } as never);

      const result = await getUserPermissionStrings(mockDeps, "admin-user");

      expect(result).toEqual(["*"]);
    });

    it("should return permission strings for non-admin users", async () => {
      const mockRoles = [
        {
          role: {
            id: "role-2",
            name: "Manager",
            slug: "manager",
            description: "Manager",
            isSystemRole: true,
            organizationId: null,
            createdAt: new Date(),
            updatedAt: new Date(),
          },
        },
      ];

      const mockPermissions = [
        {
          permission: {
            id: "perm-1",
            name: "Read Users",
            slug: "read-users",
            resource: "users" as const,
            action: "read" as const,
            description: "Can read users",
            createdAt: new Date(),
            updatedAt: new Date(),
          },
        },
        {
          permission: {
            id: "perm-2",
            name: "Write Invoices",
            slug: "write-invoices",
            resource: "invoices" as const,
            action: "update" as const,
            description: "Can write invoices",
            createdAt: new Date(),
            updatedAt: new Date(),
          },
        },
      ];

      vi.mocked(mockDeps.drizzle.select)
        .mockReturnValueOnce({
          from: vi.fn().mockReturnValue({
            innerJoin: vi.fn().mockReturnThis(),
            where: vi.fn().mockResolvedValue(mockPermissions),
          }),
        } as never)
        .mockReturnValueOnce({
          from: vi.fn().mockReturnValue({
            innerJoin: vi.fn().mockReturnValue({
              where: vi.fn().mockResolvedValue(mockRoles),
            }),
          }),
        } as never);

      const result = await getUserPermissionStrings(mockDeps, "manager-user");

      expect(result).toEqual(["users.read", "invoices.update"]);
    });
  });

  describe("getUserRoleStrings", () => {
    it("should return role slugs", async () => {
      const mockRoles = [
        {
          role: {
            id: "role-1",
            name: "Admin",
            slug: "admin",
            description: "Administrator",
            isSystemRole: true,
            organizationId: null,
            createdAt: new Date(),
            updatedAt: new Date(),
          },
        },
        {
          role: {
            id: "role-2",
            name: "Manager",
            slug: "manager",
            description: "Manager",
            isSystemRole: true,
            organizationId: null,
            createdAt: new Date(),
            updatedAt: new Date(),
          },
        },
      ];

      vi.mocked(mockDeps.drizzle.select).mockReturnValue({
        from: vi.fn().mockReturnValue({
          innerJoin: vi.fn().mockReturnValue({
            where: vi.fn().mockResolvedValue(mockRoles),
          }),
        }),
      } as never);

      const result = await getUserRoleStrings(mockDeps, "user-123");

      expect(result).toEqual(["admin", "manager"]);
    });

    it("should return empty array if user has no roles", async () => {
      vi.mocked(mockDeps.drizzle.select).mockReturnValue({
        from: vi.fn().mockReturnValue({
          innerJoin: vi.fn().mockReturnValue({
            where: vi.fn().mockResolvedValue([]),
          }),
        }),
      } as never);

      const result = await getUserRoleStrings(mockDeps, "user-no-roles");

      expect(result).toEqual([]);
    });
  });
});
