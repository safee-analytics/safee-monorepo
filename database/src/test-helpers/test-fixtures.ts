import type { InferSelectModel } from "drizzle-orm";
import type { DrizzleClient } from "../index.js";
import { organizations, users, members, jobs } from "../drizzle/index.js";

export type TestOrganization = InferSelectModel<typeof organizations>;
export type TestUser = InferSelectModel<typeof users>;
export type TestMember = InferSelectModel<typeof members>;

export interface TestFixtures {
  organization: TestOrganization;
  user: TestUser;
  adminUser: TestUser;
}

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

export async function createTestFixtures(db: DrizzleClient): Promise<TestFixtures> {
  const organization = await createTestOrganization(db);

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

  await addMemberToOrganization(db, user.id, organization.id, "member");
  await addMemberToOrganization(db, adminUser.id, organization.id, "admin");

  return {
    organization,
    user,
    adminUser,
  };
}

export async function cleanTestData(db: DrizzleClient): Promise<void> {
  await db.delete(users);
  await db.delete(jobs);
  await db.delete(organizations);
}
