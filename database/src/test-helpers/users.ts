import type { InferSelectModel } from "drizzle-orm";
import type { DrizzleClient } from "../index.js";
import { users } from "../drizzle/index.js";

export type TestUser = InferSelectModel<typeof users>;

export async function createTestUser(
  db: DrizzleClient,
  data?: {
    email?: string;
    name?: string;
    role?: string;
  },
): Promise<TestUser> {
  const [user] = await db
    .insert(users)
    .values({
      email: data?.email ?? `user-${crypto.randomUUID()}@test.com`,
      name: data?.name ?? "Test User",
      role: data?.role ?? "user",
      isActive: true,
    })
    .returning();

  return user;
}
