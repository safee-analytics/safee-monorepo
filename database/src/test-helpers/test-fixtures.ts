import type { InferSelectModel } from "drizzle-orm";
import type { DrizzleClient } from "../index.js";
import {
  organizations,
  users,
  roles,
  permissions,
  userRoles,
  rolePermissions,
} from "../drizzle/index.js";

export type TestOrganization = InferSelectModel<typeof organizations>;
export type TestUser = InferSelectModel<typeof users>;
export type TestRole = InferSelectModel<typeof roles>;
export type TestPermission = InferSelectModel<typeof permissions>;

export interface TestFixtures {
  organization: TestOrganization;
  user: TestUser;
  adminUser: TestUser;
  userRole: TestRole;
  adminRole: TestRole;
  permissions: {
    readUsers: TestPermission;
    updateUsers: TestPermission;
    manageUsers: TestPermission;
  };
}

/**
 * Create a test organization
 */
export async function createTestOrganization(
  db: DrizzleClient,
  data?: { name?: string; slug?: string },
): Promise<TestOrganization> {
  const [org] = await db
    .insert(organizations)
    .values({
      name: data?.name ?? "Test Organization",
      slug: data?.slug ?? `test-org-${Date.now()}`,
    })
    .returning();

  return org;
}

/**
 * Create a test user
 * Note: passwordHash should be pre-hashed. For tests, you can use any string.
 * Example with bcrypt: $2b$10$X...
 */
export async function createTestUser(
  db: DrizzleClient,
  organizationId: string,
  data?: {
    email?: string;
    firstName?: string;
    lastName?: string;
    passwordHash?: string;
  },
): Promise<TestUser> {
  const [user] = await db
    .insert(users)
    .values({
      email: data?.email ?? `user-${Date.now()}@test.com`,
      firstName: data?.firstName ?? "Test",
      lastName: data?.lastName ?? "User",
      passwordHash: data?.passwordHash ?? "test-password-hash",
      organizationId,
      isActive: true,
    })
    .returning();

  return user;
}

/**
 * Create a test role
 */
export async function createTestRole(
  db: DrizzleClient,
  data?: { name?: string; slug?: string; description?: string },
): Promise<TestRole> {
  const [role] = await db
    .insert(roles)
    .values({
      name: data?.name ?? "Test Role",
      slug: data?.slug ?? `test-role-${Date.now()}`,
      description: data?.description ?? "Test role description",
    })
    .returning();

  return role;
}

/**
 * Create a test permission
 */
export async function createTestPermission(
  db: DrizzleClient,
  data: {
    name?: string;
    slug: string;
    resource: string;
    action: string;
    description?: string;
  },
): Promise<TestPermission> {
  const [permission] = await db
    .insert(permissions)
    .values({
      name: data.name ?? `Test Permission ${data.slug}`,
      slug: data.slug,
      description: data.description ?? `Test permission for ${data.resource}:${data.action}`,
      resource: data.resource as any,
      action: data.action as any,
    })
    .returning();

  return permission;
}

/**
 * Assign a role to a user
 */
export async function assignRoleToUser(db: DrizzleClient, userId: string, roleId: string): Promise<void> {
  await db.insert(userRoles).values({ userId, roleId });
}

/**
 * Assign a permission to a role
 */
export async function assignPermissionToRole(
  db: DrizzleClient,
  roleId: string,
  permissionId: string,
): Promise<void> {
  await db.insert(rolePermissions).values({ roleId, permissionId });
}

/**
 * Create a complete test setup with organization, users, roles, and permissions
 */
export async function createTestFixtures(db: DrizzleClient): Promise<TestFixtures> {
  // Create organization
  const organization = await createTestOrganization(db);

  // Create roles
  const userRole = await createTestRole(db, {
    name: "User",
    slug: "user",
    description: "Regular user",
  });

  const adminRole = await createTestRole(db, {
    name: "Admin",
    slug: "admin",
    description: "Administrator",
  });

  // Create permissions
  const readUsers = await createTestPermission(db, {
    name: "Read Users",
    slug: "users:read",
    resource: "users",
    action: "read",
  });

  const updateUsers = await createTestPermission(db, {
    name: "Update Users",
    slug: "users:update",
    resource: "users",
    action: "update",
  });

  const manageUsers = await createTestPermission(db, {
    name: "Manage Users",
    slug: "users:manage",
    resource: "users",
    action: "manage",
  });

  // Assign permissions to roles
  await assignPermissionToRole(db, userRole.id, readUsers.id);
  await assignPermissionToRole(db, adminRole.id, readUsers.id);
  await assignPermissionToRole(db, adminRole.id, updateUsers.id);
  await assignPermissionToRole(db, adminRole.id, manageUsers.id);

  // Create users
  const user = await createTestUser(db, organization.id, {
    email: "user@test.com",
    firstName: "Test",
    lastName: "User",
  });

  const adminUser = await createTestUser(db, organization.id, {
    email: "admin@test.com",
    firstName: "Admin",
    lastName: "User",
  });

  // Assign roles to users
  await assignRoleToUser(db, user.id, userRole.id);
  await assignRoleToUser(db, adminUser.id, adminRole.id);

  return {
    organization,
    user,
    adminUser,
    userRole,
    adminRole,
    permissions: {
      readUsers,
      updateUsers,
      manageUsers,
    },
  };
}

/**
 * Clean all test data
 * Deletes in order: organizations (cascades to users, userRoles), rolePermissions, permissions, roles
 */
export async function cleanTestData(db: DrizzleClient): Promise<void> {
  // Delete organizations first (cascades to users and userRoles)
  await db.delete(organizations);

  // Delete role permissions junction table
  await db.delete(rolePermissions);

  // Delete permissions
  await db.delete(permissions);

  // Delete roles
  await db.delete(roles);
}
