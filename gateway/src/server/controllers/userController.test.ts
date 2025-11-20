import { describe, it, expect, beforeAll, afterAll, beforeEach, vi } from "vitest";
import {
  type DrizzleClient,
  type RedisClient,
  type Storage,
  type PubSub,
  type JobScheduler,
  schema,
} from "@safee/database";
import { connectTest } from "@safee/database/test-helpers";
import { UserController } from "./userController.js";
import type { AuthenticatedRequest } from "../middleware/auth.js";
import { Unauthorized, UserNotFound } from "../errors.js";
import type { ServerContext } from "../serverContext.js";
import type { Logger } from "pino";
import type { OdooClientManager } from "../services/odoo/manager.service.js";

void describe("UserController", () => {
  let drizzle: DrizzleClient;
  let close: () => Promise<void>;
  let controller: UserController;
  let mockContext: ServerContext;

  beforeAll(async () => {
    ({ drizzle, close } = await connectTest({ appName: "user-controller-test" }));

    mockContext = {
      drizzle,
      logger: {
        info: vi.fn(),
        warn: vi.fn(),
        debug: vi.fn(),
        error: vi.fn(),
        child: vi.fn(() => mockContext.logger),
      } as unknown as Logger,
      redis: {} as RedisClient,
      storage: {} as Storage,
      pubsub: {} as PubSub,
      scheduler: {} as JobScheduler,
      odoo: {} as OdooClientManager,
    };

    controller = new UserController(mockContext);
  });

  beforeEach(async () => {
    await drizzle.delete(schema.members);
    await drizzle.delete(schema.users);
    await drizzle.delete(schema.organizations);
  });

  afterAll(async () => {
    await close();
  });

  void describe("getCurrentUser", () => {
    void it("should return current user profile", async () => {
      const timestamp = Date.now();
      await drizzle
        .insert(schema.organizations)
        .values({
          name: `Test Org ${timestamp}`,
          slug: `test-org-${timestamp}`,
        })
        .returning();

      const [user] = await drizzle
        .insert(schema.users)
        .values({
          email: `user-${timestamp}@example.com`,
          name: "Test User",
          preferredLocale: "en",
        })
        .returning();

      const mockRequest = {
        betterAuthSession: {
          user: { id: user.id },
          session: {},
        },
      } as AuthenticatedRequest;

      const result = await controller.getCurrentUser(mockRequest);

      expect(result.id).toBe(user.id);
      expect(result.email).toBe(user.email);
      expect(result.name).toBe("Test User");
      expect(result.preferredLocale).toBe("en");
    });

    void it("should throw Unauthorized when no session", async () => {
      const mockRequest = {} as AuthenticatedRequest;

      await expect(controller.getCurrentUser(mockRequest)).rejects.toThrow(Unauthorized);
    });

    void it("should throw UserNotFound when user does not exist", async () => {
      const mockRequest = {
        betterAuthSession: {
          user: { id: "00000000-0000-0000-0000-000000000999" },
          session: {},
        },
      } as AuthenticatedRequest;

      await expect(controller.getCurrentUser(mockRequest)).rejects.toThrow(UserNotFound);
    });

    void it("should return user without organization if not set", async () => {
      const timestamp = Date.now();
      const [user] = await drizzle
        .insert(schema.users)
        .values({
          email: `user-${timestamp}@example.com`,
          name: "Test User",
          preferredLocale: "en",
        })
        .returning();

      const mockRequest = {
        betterAuthSession: {
          user: { id: user.id },
          session: {},
        },
      } as AuthenticatedRequest;

      const result = await controller.getCurrentUser(mockRequest);

      expect(result.id).toBe(user.id);
    });

    void it("should handle Arabic locale", async () => {
      const timestamp = Date.now();
      const [user] = await drizzle
        .insert(schema.users)
        .values({
          email: `user-${timestamp}@example.com`,
          name: "مستخدم تجريبي",
          preferredLocale: "ar",
        })
        .returning();

      const mockRequest = {
        betterAuthSession: {
          user: { id: user.id },
          session: {},
        },
      } as AuthenticatedRequest;

      const result = await controller.getCurrentUser(mockRequest);

      expect(result.preferredLocale).toBe("ar");
      expect(result.name).toBe("مستخدم تجريبي");
    });
  });

  void describe("updateCurrentUser", () => {
    void it("should update user name", async () => {
      const timestamp = Date.now();
      const [user] = await drizzle
        .insert(schema.users)
        .values({
          email: `user-${timestamp}@example.com`,
          name: "Old Name",
          preferredLocale: "en",
        })
        .returning();

      const mockRequest = {
        betterAuthSession: {
          user: { id: user.id },
          session: {},
        },
      } as AuthenticatedRequest;

      const result = await controller.updateCurrentUser({ name: "New Name" }, mockRequest);

      expect(result.name).toBe("New Name");
      expect(result.email).toBe(user.email);
    });

    void it("should update user locale", async () => {
      const timestamp = Date.now();
      const [user] = await drizzle
        .insert(schema.users)
        .values({
          email: `user-${timestamp}@example.com`,
          name: "Test User",
          preferredLocale: "en",
        })
        .returning();

      const mockRequest = {
        betterAuthSession: {
          user: { id: user.id },
          session: {},
        },
      } as AuthenticatedRequest;

      const result = await controller.updateCurrentUser({ preferredLocale: "ar" }, mockRequest);

      expect(result.preferredLocale).toBe("ar");
      expect(result.name).toBe("Test User");
    });

    void it("should update both name and locale", async () => {
      const timestamp = Date.now();
      const [user] = await drizzle
        .insert(schema.users)
        .values({
          email: `user-${timestamp}@example.com`,
          name: "Old Name",
          preferredLocale: "en",
        })
        .returning();

      const mockRequest = {
        betterAuthSession: {
          user: { id: user.id },
          session: {},
        },
      } as AuthenticatedRequest;

      const result = await controller.updateCurrentUser(
        { name: "New Name", preferredLocale: "ar" },
        mockRequest,
      );

      expect(result.name).toBe("New Name");
      expect(result.preferredLocale).toBe("ar");
    });

    void it("should throw Unauthorized when no session", async () => {
      const mockRequest = {} as AuthenticatedRequest;

      await expect(controller.updateCurrentUser({ name: "New Name" }, mockRequest)).rejects.toThrow(
        Unauthorized,
      );
    });

    void it("should throw UserNotFound when user does not exist", async () => {
      const mockRequest = {
        betterAuthSession: {
          user: { id: "00000000-0000-0000-0000-000000000999" },
          session: {},
        },
      } as AuthenticatedRequest;

      await expect(controller.updateCurrentUser({ name: "New Name" }, mockRequest)).rejects.toThrow(
        UserNotFound,
      );
    });

    void it("should handle empty update request", async () => {
      const timestamp = Date.now();
      const [user] = await drizzle
        .insert(schema.users)
        .values({
          email: `user-${timestamp}@example.com`,
          name: "Test User",
          preferredLocale: "en",
        })
        .returning();

      const mockRequest = {
        betterAuthSession: {
          user: { id: user.id },
          session: {},
        },
      } as AuthenticatedRequest;

      const result = await controller.updateCurrentUser({}, mockRequest);

      expect(result.name).toBe("Test User");
      expect(result.preferredLocale).toBe("en");
    });
  });

  void describe("updateCurrentUserLocale", () => {
    void it("should update user locale to Arabic", async () => {
      const timestamp = Date.now();
      const [user] = await drizzle
        .insert(schema.users)
        .values({
          email: `user-${timestamp}@example.com`,
          name: "Test User",
          preferredLocale: "en",
        })
        .returning();

      const mockRequest = {
        betterAuthSession: {
          user: { id: user.id },
          session: {},
        },
      } as AuthenticatedRequest;

      const result = await controller.updateCurrentUserLocale({ locale: "ar" }, mockRequest);

      expect(result.message).toBe("Locale updated successfully");
      expect(result.locale).toBe("ar");

      const updatedUser = await drizzle.query.users.findFirst({
        where: (users, { eq }) => eq(users.id, user.id),
      });

      expect(updatedUser?.preferredLocale).toBe("ar");
    });

    void it("should update user locale to English", async () => {
      const timestamp = Date.now();
      const [user] = await drizzle
        .insert(schema.users)
        .values({
          email: `user-${timestamp}@example.com`,
          name: "Test User",
          preferredLocale: "ar",
        })
        .returning();

      const mockRequest = {
        betterAuthSession: {
          user: { id: user.id },
          session: {},
        },
      } as AuthenticatedRequest;

      const result = await controller.updateCurrentUserLocale({ locale: "en" }, mockRequest);

      expect(result.message).toBe("Locale updated successfully");
      expect(result.locale).toBe("en");
    });

    void it("should throw Unauthorized when no session", async () => {
      const mockRequest = {} as AuthenticatedRequest;

      await expect(controller.updateCurrentUserLocale({ locale: "ar" }, mockRequest)).rejects.toThrow(
        Unauthorized,
      );
    });

    void it("should handle non-existent user", async () => {
      const mockRequest = {
        betterAuthSession: {
          user: { id: "00000000-0000-0000-0000-000000000999" },
          session: {},
        },
      } as AuthenticatedRequest;

      await expect(controller.updateCurrentUserLocale({ locale: "ar" }, mockRequest)).rejects.toThrow();
    });

    void it("should allow switching locales multiple times", async () => {
      const timestamp = Date.now();
      const [user] = await drizzle
        .insert(schema.users)
        .values({
          email: `user-${timestamp}@example.com`,
          name: "Test User",
          preferredLocale: "en",
        })
        .returning();

      const mockRequest = {
        betterAuthSession: {
          user: { id: user.id },
          session: {},
        },
      } as AuthenticatedRequest;

      const result1 = await controller.updateCurrentUserLocale({ locale: "ar" }, mockRequest);
      expect(result1.locale).toBe("ar");

      const result2 = await controller.updateCurrentUserLocale({ locale: "en" }, mockRequest);
      expect(result2.locale).toBe("en");

      const finalUser = await drizzle.query.users.findFirst({
        where: (users, { eq }) => eq(users.id, user.id),
      });
      expect(finalUser?.preferredLocale).toBe("en");
    });
  });
});
