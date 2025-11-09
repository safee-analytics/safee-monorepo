import { describe, it, expect, beforeAll, afterAll, beforeEach } from "vitest";
import {
  connectTest,
  createTestDeps,
  createUser,
  getUserByEmail,
  getUserById,
  updateUserProfile,
  updateUserLocale,
  schema,
  type DrizzleClient,
} from "@safee/database";

const { organizations, users } = schema;

describe("User Integration Tests", () => {
  let db: DrizzleClient;
  let close: () => Promise<void>;

  beforeAll(async () => {
    const connection = await connectTest();
    db = connection.drizzle;
    close = connection.close;
  });

  afterAll(async () => {
    await close();
  });

  beforeEach(async () => {
    // Delete users first (child), then organizations (parent)
    await db.delete(users);
    await db.delete(organizations);
  });

  describe("createUser", () => {
    it("should create a user in the database", async () => {
      const deps = createTestDeps(db);

      // First create an organization
      const [org] = await db.insert(organizations).values({ name: "Test Org", slug: "test-org" }).returning();

      const userData = {
        email: "test@example.com",
        firstName: "John",
        lastName: "Doe",
        organizationId: org.id,
      };

      const user = await createUser(deps, userData);

      expect(user).toBeDefined();
      expect(user.email).toBe("test@example.com");
      expect(user.name).toBe("John Doe");
      expect(user.organizationId).toBe(org.id);
    });

    it("should throw error when creating duplicate email", async () => {
      const deps = createTestDeps(db);

      const [org] = await db.insert(organizations).values({ name: "Test Org", slug: "test-org" }).returning();

      const userData = {
        email: "duplicate@example.com",
        organizationId: org.id,
      };

      await createUser(deps, userData);

      await expect(createUser(deps, userData)).rejects.toThrow("User with this email already exists");
    });
  });

  describe("getUserByEmail", () => {
    it("should retrieve user by email", async () => {
      const deps = createTestDeps(db);

      const [org] = await db.insert(organizations).values({ name: "Test Org", slug: "test-org" }).returning();

      await createUser(deps, {
        email: "find@example.com",
        firstName: "Jane",
        organizationId: org.id,
      });

      const user = await getUserByEmail(deps, "find@example.com");

      expect(user).toBeDefined();
      expect(user?.email).toBe("find@example.com");
      expect(user?.name).toBe("Jane");
      expect(user?.organization).toBeDefined();
      expect(user?.organization?.name).toBe("Test Org");
    });

    it("should return null for non-existent email", async () => {
      const deps = createTestDeps(db);

      const user = await getUserByEmail(deps, "nonexistent@example.com");

      expect(user).toBeNull();
    });
  });

  describe("getUserById", () => {
    it("should retrieve user by ID", async () => {
      const deps = createTestDeps(db);

      const [org] = await db.insert(organizations).values({ name: "Test Org", slug: "test-org" }).returning();

      const createdUser = await createUser(deps, {
        email: "findbyid@example.com",
        organizationId: org.id,
      });

      const user = await getUserById(deps, createdUser.id);

      expect(user).toBeDefined();
      expect(user?.id).toBe(createdUser.id);
      expect(user?.email).toBe("findbyid@example.com");
    });

    it("should return null for non-existent ID", async () => {
      const deps = createTestDeps(db);

      const user = await getUserById(deps, "00000000-0000-0000-0000-000000000000");

      expect(user).toBeNull();
    });
  });

  describe("updateUserProfile", () => {
    it("should update user profile fields", async () => {
      const deps = createTestDeps(db);

      const [org] = await db.insert(organizations).values({ name: "Test Org", slug: "test-org" }).returning();

      const createdUser = await createUser(deps, {
        email: "update@example.com",
        firstName: "Old",
        lastName: "Name",
        organizationId: org.id,
      });

      const updatedUser = await updateUserProfile(deps, createdUser.id, {
        name: "New Name",
        preferredLocale: "ar",
      });

      expect(updatedUser.name).toBe("New Name");
      expect(updatedUser.preferredLocale).toBe("ar");
    });

    it("should throw error for non-existent user", async () => {
      const deps = createTestDeps(db);

      await expect(
        updateUserProfile(deps, "00000000-0000-0000-0000-000000000000", { name: "Test" }),
      ).rejects.toThrow("User not found");
    });
  });

  describe("updateUserLocale", () => {
    it("should update user locale", async () => {
      const deps = createTestDeps(db);

      const [org] = await db.insert(organizations).values({ name: "Test Org", slug: "test-org" }).returning();

      const createdUser = await createUser(deps, {
        email: "locale@example.com",
        organizationId: org.id,
      });

      await updateUserLocale(deps, createdUser.id, "ar");

      const user = await getUserById(deps, createdUser.id);
      expect(user?.preferredLocale).toBe("ar");
    });
  });
});
