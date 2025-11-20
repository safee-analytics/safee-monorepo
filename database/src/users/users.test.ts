import { describe, it, beforeAll, afterAll, beforeEach, expect } from "vitest";
import { pino } from "pino";
import type { DrizzleClient } from "../drizzle.js";
import { testConnect } from "../drizzle/testConnect.js";
import type { DbDeps } from "../deps.js";
import { nukeDatabase } from "../test-helpers/test-fixtures.js";
import {
  createOrganization,
  createUser,
  createUserWithOrganization,
  getUserById,
  updateUserProfile,
  updateUserLocale,
  UserNotFoundError,
} from "./users.js";
import type { Locale } from "../drizzle/_common.js";

describe("Users Module", () => {
  let drizzle: DrizzleClient;
  let close: () => Promise<void>;
  const logger = pino({ level: "silent" });
  let deps: DbDeps;

  beforeAll(async () => {
    ({ drizzle, close } = testConnect("users-test"));
    deps = { drizzle, logger };
  });

  afterAll(async () => {
    await close();
  });

  beforeEach(async () => {
    await nukeDatabase(drizzle);
  });

  describe("createOrganization", () => {
    it("generates unique slugs for duplicate names", async () => {
      const first = await createOrganization(deps, { name: "Acme Co" });
      const second = await createOrganization(deps, { name: "Acme Co" });

      expect(first.slug).toBe("acme-co");
      expect(second.slug).not.toBe(first.slug);
      expect(second.slug).toMatch(/^acme-co-\d+$/);
    });
  });

  describe("createUser", () => {
    it("creates user successfully", async () => {
      const user = await createUser(deps, {
        email: "user1@example.com",
        firstName: "User",
        lastName: "One",
      });

      expect(user.email).toBe("user1@example.com");
      expect(user.name).toBe("User One");
    });

    it("throws when email already exists", async () => {
      await createUser(deps, {
        email: "duplicate@example.com",
        firstName: "Dupe",
      });

      await expect(
        createUser(deps, {
          email: "duplicate@example.com",
        }),
      ).rejects.toThrowError(/already exists/);
    });
  });

  describe("createUserWithOrganization", () => {
    it("creates user and organization together", async () => {
      const result = await createUserWithOrganization(deps, {
        email: "team@example.com",
        firstName: "Team",
        organizationName: "Team Org",
      });

      expect(result.user.email).toBe("team@example.com");
      expect(result.organization.name).toBe("Team Org");
      expect(result.organization.slug).toBe("team-org");
    });
  });

  describe("updateUserProfile", () => {
    it("updates name and locale", async () => {
      const user = await createUser(deps, {
        email: "profile@example.com",
        firstName: "Profile",
      });

      const updated = await updateUserProfile(deps, user.id, {
        name: "Updated User",
        preferredLocale: "ar" as Locale,
      });

      expect(updated.name).toBe("Updated User");
      expect(updated.preferredLocale).toBe("ar");
    });

    it("throws when user does not exist", async () => {
      await expect(
        updateUserProfile(deps, "00000000-0000-0000-0000-000000000000", {
          name: "Nobody",
        }),
      ).rejects.toBeInstanceOf(UserNotFoundError);
    });
  });

  describe("updateUserLocale", () => {
    it("persists locale preference", async () => {
      const user = await createUser(deps, {
        email: "locale@example.com",
        firstName: "Locale",
      });

      await updateUserLocale(deps, user.id, "ar");

      const refreshed = await getUserById(deps, user.id);
      expect(refreshed?.preferredLocale).toBe("ar");
    });
  });
});
