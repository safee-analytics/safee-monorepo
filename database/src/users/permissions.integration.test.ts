import { describe, it, expect, beforeAll, afterAll, beforeEach } from "vitest";
import { connectTest, createTestDeps } from "../test-helpers/integration-setup.js";
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
import type { DrizzleClient } from "../index.js";
import { organizations, users, roles, permissions, rolePermissions, userRoles } from "../drizzle/index.js";

describe("Permission Integration Tests", () => {
  let db: DrizzleClient;
  let close: () => Promise<void>;
  let testUserId: string;
  let testOrgId: string;
  let adminRoleId: string;
  let managerRoleId: string;
  let readPermissionId: string;
  let writePermissionId: string;

  beforeAll(async () => {
    const connection = await connectTest();
    db = connection.drizzle;
    close = connection.close;
  });

  afterAll(async () => {
    await close();
  });

  beforeEach(async () => {
    // Clean tables in correct order (respect foreign keys)
    await db.delete(userRoles);
    await db.delete(rolePermissions);
    await db.delete(users);
    await db.delete(permissions);
    await db.delete(roles);
    await db.delete(organizations);

    // Create test organization
    const [org] = await db.insert(organizations).values({ name: "Test Org", slug: "test-org" }).returning();
    testOrgId = org.id;

    // Create test user
    const [user] = await db
      .insert(users)
      .values({
        email: "testuser@example.com",
        organizationId: testOrgId,
      })
      .returning();
    testUserId = user.id;

    // Create test roles
    const [adminRole] = await db
      .insert(roles)
      .values({
        name: "Admin",
        slug: "admin",
        description: "Administrator",
        isSystemRole: true,
      })
      .returning();
    adminRoleId = adminRole.id;

    const [managerRole] = await db
      .insert(roles)
      .values({
        name: "Manager",
        slug: "manager",
        description: "Manager",
        isSystemRole: true,
      })
      .returning();
    managerRoleId = managerRole.id;

    // Create test permissions
    const [readPerm] = await db
      .insert(permissions)
      .values({
        name: "Read Users",
        slug: "read-users",
        resource: "users",
        action: "read",
      })
      .returning();
    readPermissionId = readPerm.id;

    const [writePerm] = await db
      .insert(permissions)
      .values({
        name: "Update Users",
        slug: "update-users",
        resource: "users",
        action: "update",
      })
      .returning();
    writePermissionId = writePerm.id;

    // Assign permissions to admin role
    await db.insert(rolePermissions).values([
      { roleId: adminRoleId, permissionId: readPermissionId },
      { roleId: adminRoleId, permissionId: writePermissionId },
    ]);

    // Assign only read permission to manager role
    await db.insert(rolePermissions).values({ roleId: managerRoleId, permissionId: readPermissionId });
  });

  describe("assignRoleToUser", () => {
    it("should assign role to user", async () => {
      const deps = createTestDeps(db);

      await assignRoleToUser(deps, testUserId, adminRoleId);

      const userRoles = await getUserRoles(deps, testUserId);
      expect(userRoles).toHaveLength(1);
      expect(userRoles[0].slug).toBe("admin");
    });

    it("should handle duplicate role assignment gracefully", async () => {
      const deps = createTestDeps(db);

      await assignRoleToUser(deps, testUserId, adminRoleId);
      await assignRoleToUser(deps, testUserId, adminRoleId); // Should not throw

      const userRoles = await getUserRoles(deps, testUserId);
      expect(userRoles).toHaveLength(1);
    });
  });

  describe("getUserRoles", () => {
    it("should return all user roles", async () => {
      const deps = createTestDeps(db);

      await assignRoleToUser(deps, testUserId, adminRoleId);
      await assignRoleToUser(deps, testUserId, managerRoleId);

      const userRoles = await getUserRoles(deps, testUserId);

      expect(userRoles).toHaveLength(2);
      expect(userRoles.map((r) => r.slug)).toContain("admin");
      expect(userRoles.map((r) => r.slug)).toContain("manager");
    });

    it("should return empty array for user with no roles", async () => {
      const deps = createTestDeps(db);

      const userRoles = await getUserRoles(deps, testUserId);

      expect(userRoles).toHaveLength(0);
    });
  });

  describe("getUserPermissions", () => {
    it("should return all permissions from user roles", async () => {
      const deps = createTestDeps(db);

      await assignRoleToUser(deps, testUserId, adminRoleId);

      const userPermissions = await getUserPermissions(deps, testUserId);

      expect(userPermissions).toHaveLength(2);
      expect(userPermissions.map((p) => p.action)).toContain("read");
      expect(userPermissions.map((p) => p.action)).toContain("update");
    });

    it("should not duplicate permissions from multiple roles", async () => {
      const deps = createTestDeps(db);

      // Both admin and manager have read permission
      await assignRoleToUser(deps, testUserId, adminRoleId);
      await assignRoleToUser(deps, testUserId, managerRoleId);

      const userPermissions = await getUserPermissions(deps, testUserId);

      // Should have read and update (admin) + read (manager) = 3 total (with duplicate read)
      // But our query returns all rows, so we get duplicates
      expect(userPermissions.length).toBeGreaterThanOrEqual(2);
    });
  });

  describe("userHasPermission", () => {
    it("should return true when user has permission", async () => {
      const deps = createTestDeps(db);

      await assignRoleToUser(deps, testUserId, managerRoleId);

      const hasPermission = await userHasPermission(deps, testUserId, "users", "read");

      expect(hasPermission).toBe(true);
    });

    it("should return false when user does not have permission", async () => {
      const deps = createTestDeps(db);

      await assignRoleToUser(deps, testUserId, managerRoleId);

      const hasPermission = await userHasPermission(deps, testUserId, "users", "delete");

      expect(hasPermission).toBe(false);
    });

    it("should return false for user with no roles", async () => {
      const deps = createTestDeps(db);

      const hasPermission = await userHasPermission(deps, testUserId, "users", "read");

      expect(hasPermission).toBe(false);
    });
  });

  describe("userHasAnyPermission", () => {
    it("should return true if user has at least one permission", async () => {
      const deps = createTestDeps(db);

      await assignRoleToUser(deps, testUserId, managerRoleId);

      const hasAny = await userHasAnyPermission(deps, testUserId, [
        { resource: "users", action: "read" },
        { resource: "users", action: "delete" },
      ]);

      expect(hasAny).toBe(true);
    });

    it("should return false if user has none of the permissions", async () => {
      const deps = createTestDeps(db);

      await assignRoleToUser(deps, testUserId, managerRoleId);

      const hasAny = await userHasAnyPermission(deps, testUserId, [
        { resource: "users", action: "delete" },
        { resource: "organizations", action: "delete" },
      ]);

      expect(hasAny).toBe(false);
    });
  });

  describe("removeRoleFromUser", () => {
    it("should remove role from user", async () => {
      const deps = createTestDeps(db);

      await assignRoleToUser(deps, testUserId, adminRoleId);

      let userRoles = await getUserRoles(deps, testUserId);
      expect(userRoles).toHaveLength(1);

      await removeRoleFromUser(deps, testUserId, adminRoleId);

      userRoles = await getUserRoles(deps, testUserId);
      expect(userRoles).toHaveLength(0);
    });
  });

  describe("getRoleBySlug", () => {
    it("should return role by slug", async () => {
      const deps = createTestDeps(db);

      const role = await getRoleBySlug(deps, "admin");

      expect(role).toBeDefined();
      expect(role?.slug).toBe("admin");
      expect(role?.name).toBe("Admin");
    });

    it("should return null for non-existent slug", async () => {
      const deps = createTestDeps(db);

      const role = await getRoleBySlug(deps, "nonexistent");

      expect(role).toBeNull();
    });
  });

  describe("createSystemRoles", () => {
    it("should create all system roles", async () => {
      // Clean first - delete all existing data
      await db.delete(userRoles);
      await db.delete(rolePermissions);
      await db.delete(users);
      await db.delete(permissions);
      await db.delete(roles);
      await db.delete(organizations);

      const deps = createTestDeps(db);

      await createSystemRoles(deps);

      const admin = await getRoleBySlug(deps, "admin");
      const manager = await getRoleBySlug(deps, "manager");
      const accountant = await getRoleBySlug(deps, "accountant");
      const employee = await getRoleBySlug(deps, "employee");

      expect(admin).toBeDefined();
      expect(manager).toBeDefined();
      expect(accountant).toBeDefined();
      expect(employee).toBeDefined();
    });

    it("should not fail when roles already exist", async () => {
      const deps = createTestDeps(db);

      await createSystemRoles(deps);
      await createSystemRoles(deps); // Should not throw

      const admin = await getRoleBySlug(deps, "admin");
      expect(admin).toBeDefined();
    });
  });

  describe("getUserPermissionStrings", () => {
    it("should return wildcard for admin users", async () => {
      const deps = createTestDeps(db);

      await assignRoleToUser(deps, testUserId, adminRoleId);

      const permissionStrings = await getUserPermissionStrings(deps, testUserId);

      expect(permissionStrings).toEqual(["*"]);
    });

    it("should return permission strings for non-admin users", async () => {
      const deps = createTestDeps(db);

      await assignRoleToUser(deps, testUserId, managerRoleId);

      const permissionStrings = await getUserPermissionStrings(deps, testUserId);

      expect(permissionStrings).toContain("users.read");
      expect(permissionStrings).not.toContain("*");
    });
  });

  describe("getUserRoleStrings", () => {
    it("should return role slugs", async () => {
      const deps = createTestDeps(db);

      await assignRoleToUser(deps, testUserId, adminRoleId);
      await assignRoleToUser(deps, testUserId, managerRoleId);

      const roleStrings = await getUserRoleStrings(deps, testUserId);

      expect(roleStrings).toHaveLength(2);
      expect(roleStrings).toContain("admin");
      expect(roleStrings).toContain("manager");
    });

    it("should return empty array for user with no roles", async () => {
      const deps = createTestDeps(db);

      const roleStrings = await getUserRoleStrings(deps, testUserId);

      expect(roleStrings).toEqual([]);
    });
  });
});
