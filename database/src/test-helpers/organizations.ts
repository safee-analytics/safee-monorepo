import type { InferSelectModel } from "drizzle-orm";
import type { DrizzleClient } from "../index.js";
import { organizations, members } from "../drizzle/index.js";

export type TestOrganization = InferSelectModel<typeof organizations>;
export type TestMember = InferSelectModel<typeof members>;

export async function createTestOrganization(
  db: DrizzleClient,
  data?: { name?: string; slug?: string },
): Promise<TestOrganization> {
  const [org] = await db
    .insert(organizations)
    .values({
      name: data?.name ?? "Test Organization",
      slug: data?.slug ?? `test-org-${crypto.randomUUID().slice(0, 8)}`,
    })
    .returning();

  return org;
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
