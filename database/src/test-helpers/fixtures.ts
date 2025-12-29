import type { DrizzleClient } from "../index.js";
import { createTestOrganization, type TestOrganization } from "./organizations.js";
import { createTestUser, type TestUser } from "./users.js";
import { addMemberToOrganization } from "./organizations.js";

export interface TestFixtures {
  organization: TestOrganization;
  user: TestUser;
  adminUser: TestUser;
}

/**
 * Create a complete test setup with org, users, and memberships
 */
export async function createTestFixtures(db: DrizzleClient): Promise<TestFixtures> {
  const organization = await createTestOrganization(db);

  const user = await createTestUser(db, {
    email: "user@test.com",
    name: "Test User",
    role: "user",
  });

  const adminUser = await createTestUser(db, {
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
