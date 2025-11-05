import type { InferSelectModel } from "drizzle-orm";
import type { DrizzleClient } from "../index.js";
import { organizations, users, members } from "../drizzle/index.js";

export type TestOrganization = InferSelectModel<typeof organizations>;
export type TestUser = InferSelectModel<typeof users>;
export type TestMember = InferSelectModel<typeof members>;

export interface TestFixtures {
  organization: TestOrganization;
  user: TestUser;
  adminUser: TestUser;
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
 * Note: Passwords are now handled by Better Auth
 */
export async function createTestUser(
  db: DrizzleClient,
  organizationId: string,
  data?: {
    email?: string;
    name?: string;
    role?: string;
  },
): Promise<TestUser> {
  const [user] = await db
    .insert(users)
    .values({
      email: data?.email ?? `user-${Date.now()}@test.com`,
      name: data?.name ?? "Test User",
      role: data?.role ?? "user",
      organizationId,
      isActive: true,
    })
    .returning();

  return user;
}

/**
 * Add a user as a member of an organization with a specific role
 */
export async function addMemberToOrganization(
  db: DrizzleClient,
  userId: string,
  organizationId: string,
  role = "member",
): Promise<TestMember> {
  const [member] = await db
    .insert(members)
    .values({
      userId,
      organizationId,
      role,
    })
    .returning();

  return member;
}

/**
 * Create a complete test setup with organization and users
 */
export async function createTestFixtures(db: DrizzleClient): Promise<TestFixtures> {
  // Create organization
  const organization = await createTestOrganization(db);

  // Create users
  const user = await createTestUser(db, organization.id, {
    email: "user@test.com",
    name: "Test User",
    role: "user",
  });

  const adminUser = await createTestUser(db, organization.id, {
    email: "admin@test.com",
    name: "Admin User",
    role: "admin",
  });

  // Add users as members
  await addMemberToOrganization(db, user.id, organization.id, "member");
  await addMemberToOrganization(db, adminUser.id, organization.id, "admin");

  return {
    organization,
    user,
    adminUser,
  };
}

/**
 * Clean all test data
 */
export async function cleanTestData(db: DrizzleClient): Promise<void> {
  // Delete organizations first (cascades to users and members)
  await db.delete(organizations);
}
