import { describe, it, expect, vi, beforeEach } from "vitest";
import {
  createUser,
  createUserWithOrganization,
  getUserByEmail,
  getUserById,
  updateUserProfile,
  updateUserLocale,
} from "./users.js";
import type { DbDeps } from "../deps.js";

describe("User Utilities", () => {
  let mockDeps: DbDeps;

  beforeEach(() => {
    const mockLogger = {
      info: vi.fn(),
      debug: vi.fn(),
      warn: vi.fn(),
      error: vi.fn(),
      fatal: vi.fn(),
      trace: vi.fn(),
      child: vi.fn(),
      level: "info",
    };

    const mockQuery = {
      users: {
        findFirst: vi.fn(),
        findMany: vi.fn(),
      },
    };

    const mockInsertChain = {
      values: vi.fn().mockReturnValue({
        returning: vi.fn().mockResolvedValue([]),
      }),
    };

    const mockUpdateChain = {
      set: vi.fn().mockReturnValue({
        where: vi.fn().mockResolvedValue([]),
      }),
    };

    const mockSelectChain = {
      from: vi.fn().mockReturnValue({
        leftJoin: vi.fn().mockReturnValue({
          where: vi.fn().mockReturnValue({
            limit: vi.fn().mockResolvedValue([]),
          }),
        }),
      }),
    };

    const mockTransactionResult = {
      user: {
        id: "user-123",
        email: "test@example.com",
        firstName: "Test",
        lastName: "User",
        passwordHash: "hashed",
        organizationId: "org-123",
        preferredLocale: "en",
        isActive: true,
        emailVerified: false,
        emailVerifiedAt: null,
        createdAt: new Date(),
        updatedAt: new Date(),
      },
      organization: {
        id: "org-123",
        name: "Test Org",
        slug: "test-org",
        isActive: true,
        createdAt: new Date(),
        updatedAt: new Date(),
      },
    };

    const mockDrizzle = {
      insert: vi.fn().mockReturnValue(mockInsertChain),
      update: vi.fn().mockReturnValue(mockUpdateChain),
      select: vi.fn().mockReturnValue(mockSelectChain),
      query: mockQuery,
      transaction: vi.fn(async (callback: (tx: typeof mockDrizzle) => Promise<never>) =>
        callback(mockDrizzle as never),
      ),
    };

    (mockDrizzle as typeof mockDrizzle & { _txResult: typeof mockTransactionResult })._txResult =
      mockTransactionResult;

    mockDeps = {
      drizzle: mockDrizzle,
      logger: mockLogger,
    } as unknown as DbDeps;
  });

  describe("createUser", () => {
    it("should create a new user successfully", async () => {
      const userData = {
        email: "newuser@example.com",
        passwordHash: "hashed_password",
        firstName: "John",
        lastName: "Doe",
        organizationId: "org-456",
      };

      const mockUser = {
        id: "user-new",
        ...userData,
        preferredLocale: "en" as const,
        isActive: true,
        emailVerified: false,
        emailVerifiedAt: null,
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      vi.mocked(mockDeps.drizzle.select).mockReturnValue({
        from: vi.fn().mockReturnValue({
          leftJoin: vi.fn().mockReturnValue({
            where: vi.fn().mockReturnValue({
              limit: vi.fn().mockResolvedValue([]),
            }),
          }),
        }),
      } as never);

      vi.mocked(mockDeps.drizzle.insert).mockReturnValue({
        values: vi.fn().mockReturnValue({
          returning: vi.fn().mockResolvedValue([mockUser]),
        }),
      } as never);

      const result = await createUser(mockDeps, userData);

      expect(result).toEqual(mockUser);
      expect(mockDeps.drizzle.insert).toHaveBeenCalled();
      expect(mockDeps.logger.info).toHaveBeenCalledWith(
        { userId: mockUser.id, email: userData.email },
        "User created successfully",
      );
    });

    it("should throw error if user already exists", async () => {
      const userData = {
        email: "existing@example.com",
        passwordHash: "hashed_password",
        organizationId: "org-456",
      };

      const existingUser = {
        id: "user-existing",
        email: "existing@example.com",
        firstName: null,
        lastName: null,
        passwordHash: "old_hash",
        organizationId: "org-456",
        preferredLocale: "en" as const,
        isActive: true,
        emailVerified: false,
        emailVerifiedAt: null,
        createdAt: new Date(),
        updatedAt: new Date(),
        organization: undefined,
      };

      vi.mocked(mockDeps.drizzle.select).mockReturnValue({
        from: vi.fn().mockReturnValue({
          leftJoin: vi.fn().mockReturnValue({
            where: vi.fn().mockReturnValue({
              limit: vi.fn().mockResolvedValue([
                {
                  user: existingUser,
                  organization: null,
                },
              ]),
            }),
          }),
        }),
      } as never);

      await expect(createUser(mockDeps, userData)).rejects.toThrow("User with this email already exists");
      expect(mockDeps.logger.error).toHaveBeenCalled();
    });
  });

  describe("createUserWithOrganization", () => {
    it("should create user and organization successfully", async () => {
      const userData = {
        email: "neworg@example.com",
        passwordHash: "hashed_password",
        firstName: "Jane",
        lastName: "Smith",
        organizationName: "New Company",
      };

      const mockResult = {
        user: {
          id: "user-new",
          email: userData.email,
          firstName: userData.firstName,
          lastName: userData.lastName,
          passwordHash: userData.passwordHash,
          organizationId: "org-new",
          preferredLocale: "en" as const,
          isActive: true,
          emailVerified: false,
          emailVerifiedAt: null,
          createdAt: new Date(),
          updatedAt: new Date(),
        },
        organization: {
          id: "org-new",
          name: userData.organizationName,
          slug: "new-company",
          isActive: true,
          createdAt: new Date(),
          updatedAt: new Date(),
        },
      };

      const mockSelectForUserCheck = {
        from: vi.fn().mockReturnValue({
          leftJoin: vi.fn().mockReturnValue({
            where: vi.fn().mockReturnValue({
              limit: vi.fn().mockResolvedValue([]),
            }),
          }),
        }),
      };

      const mockSelectForOrgCheck = {
        from: vi.fn().mockReturnValue({
          where: vi.fn().mockReturnValue({
            limit: vi.fn().mockResolvedValue([]),
          }),
        }),
      };

      vi.mocked(mockDeps.drizzle.select)
        .mockReturnValueOnce(mockSelectForUserCheck as never)
        .mockReturnValueOnce(mockSelectForOrgCheck as never);

      vi.mocked(mockDeps.drizzle.transaction).mockImplementation(async (_callback) => {
        return mockResult as never;
      });

      const result = await createUserWithOrganization(mockDeps, userData);

      expect(result.user).toBeDefined();
      expect(result.organization).toBeDefined();
      expect(result.user.email).toBe(userData.email);
      expect(result.organization.name).toBe(userData.organizationName);
      expect(mockDeps.drizzle.transaction).toHaveBeenCalled();
      expect(mockDeps.logger.info).toHaveBeenCalledWith(
        expect.objectContaining({
          email: userData.email,
        }),
        "User and organization created successfully",
      );
    });

    it("should throw error if organization slug already exists", async () => {
      const userData = {
        email: "test@example.com",
        passwordHash: "hashed_password",
        organizationName: "Existing Company",
      };

      const mockSelectForUser = {
        from: vi.fn().mockReturnValue({
          leftJoin: vi.fn().mockReturnValue({
            where: vi.fn().mockReturnValue({
              limit: vi.fn().mockResolvedValue([]),
            }),
          }),
        }),
      };

      const mockSelectForOrg = {
        from: vi.fn().mockReturnValue({
          where: vi.fn().mockReturnValue({
            limit: vi.fn().mockResolvedValue([
              {
                id: "org-existing",
                name: "Existing Company",
                slug: "existing-company",
              },
            ]),
          }),
        }),
      };

      vi.mocked(mockDeps.drizzle.select)
        .mockReturnValueOnce(mockSelectForUser as never)
        .mockReturnValueOnce(mockSelectForOrg as never);

      await expect(createUserWithOrganization(mockDeps, userData)).rejects.toThrow(
        "Organization with this name already exists",
      );
      expect(mockDeps.logger.error).toHaveBeenCalled();
    });
  });

  describe("getUserByEmail", () => {
    it("should return user with organization", async () => {
      const mockResult = [
        {
          user: {
            id: "user-123",
            email: "test@example.com",
            firstName: "Test",
            lastName: "User",
            passwordHash: "hashed",
            organizationId: "org-123",
            preferredLocale: "en" as const,
            isActive: true,
            emailVerified: false,
            emailVerifiedAt: null,
            createdAt: new Date(),
            updatedAt: new Date(),
          },
          organization: {
            id: "org-123",
            name: "Test Org",
            slug: "test-org",
            isActive: true,
            createdAt: new Date(),
            updatedAt: new Date(),
          },
        },
      ];

      vi.mocked(mockDeps.drizzle.select).mockReturnValue({
        from: vi.fn().mockReturnValue({
          leftJoin: vi.fn().mockReturnValue({
            where: vi.fn().mockReturnValue({
              limit: vi.fn().mockResolvedValue(mockResult),
            }),
          }),
        }),
      } as never);

      const result = await getUserByEmail(mockDeps, "test@example.com");

      expect(result).toBeDefined();
      expect(result?.email).toBe("test@example.com");
      expect(result?.organization).toEqual({
        id: "org-123",
        name: "Test Org",
        slug: "test-org",
      });
    });

    it("should return null if user not found", async () => {
      vi.mocked(mockDeps.drizzle.select).mockReturnValue({
        from: vi.fn().mockReturnValue({
          leftJoin: vi.fn().mockReturnValue({
            where: vi.fn().mockReturnValue({
              limit: vi.fn().mockResolvedValue([]),
            }),
          }),
        }),
      } as never);

      const result = await getUserByEmail(mockDeps, "nonexistent@example.com");

      expect(result).toBeNull();
    });
  });

  describe("getUserById", () => {
    it("should return user with organization", async () => {
      const mockResult = [
        {
          user: {
            id: "user-123",
            email: "test@example.com",
            firstName: "Test",
            lastName: "User",
            passwordHash: "hashed",
            organizationId: "org-123",
            preferredLocale: "en" as const,
            isActive: true,
            emailVerified: false,
            emailVerifiedAt: null,
            createdAt: new Date(),
            updatedAt: new Date(),
          },
          organization: {
            id: "org-123",
            name: "Test Org",
            slug: "test-org",
            isActive: true,
            createdAt: new Date(),
            updatedAt: new Date(),
          },
        },
      ];

      vi.mocked(mockDeps.drizzle.select).mockReturnValue({
        from: vi.fn().mockReturnValue({
          leftJoin: vi.fn().mockReturnValue({
            where: vi.fn().mockReturnValue({
              limit: vi.fn().mockResolvedValue(mockResult),
            }),
          }),
        }),
      } as never);

      const result = await getUserById(mockDeps, "user-123");

      expect(result).toBeDefined();
      expect(result?.id).toBe("user-123");
      expect(result?.organization).toBeDefined();
    });

    it("should return null if user not found", async () => {
      vi.mocked(mockDeps.drizzle.select).mockReturnValue({
        from: vi.fn().mockReturnValue({
          leftJoin: vi.fn().mockReturnValue({
            where: vi.fn().mockReturnValue({
              limit: vi.fn().mockResolvedValue([]),
            }),
          }),
        }),
      } as never);

      const result = await getUserById(mockDeps, "nonexistent-user");

      expect(result).toBeNull();
    });
  });

  describe("updateUserProfile", () => {
    it("should update user profile successfully", async () => {
      const updateData = {
        firstName: "Updated",
        lastName: "Name",
        preferredLocale: "ar" as const,
      };

      const existingUser = {
        id: "user-123",
        email: "test@example.com",
        firstName: "Old",
        lastName: "Name",
        passwordHash: "hashed",
        organizationId: "org-123",
        preferredLocale: "en" as const,
        isActive: true,
        emailVerified: false,
        emailVerifiedAt: null,
        createdAt: new Date(),
        updatedAt: new Date(),
        organization: {
          id: "org-123",
          name: "Test Org",
          slug: "test-org",
        },
      };

      const updatedUser = {
        ...existingUser,
        ...updateData,
        updatedAt: new Date(),
      };

      vi.mocked(mockDeps.drizzle.select).mockReturnValue({
        from: vi.fn().mockReturnValue({
          leftJoin: vi.fn().mockReturnValue({
            where: vi.fn().mockReturnValue({
              limit: vi.fn().mockResolvedValue([
                {
                  user: existingUser,
                  organization: existingUser.organization,
                },
              ]),
            }),
          }),
        }),
      } as never);

      vi.mocked(mockDeps.drizzle.update).mockReturnValue({
        set: vi.fn().mockReturnValue({
          where: vi.fn().mockReturnValue({
            returning: vi.fn().mockResolvedValue([updatedUser]),
          }),
        }),
      } as never);

      const result = await updateUserProfile(mockDeps, "user-123", updateData);

      expect(result.firstName).toBe("Updated");
      expect(result.lastName).toBe("Name");
      expect(mockDeps.logger.info).toHaveBeenCalledWith(
        { userId: "user-123", updateData },
        "User profile updated successfully",
      );
    });

    it("should throw error if user not found", async () => {
      vi.mocked(mockDeps.drizzle.select).mockReturnValue({
        from: vi.fn().mockReturnValue({
          leftJoin: vi.fn().mockReturnValue({
            where: vi.fn().mockReturnValue({
              limit: vi.fn().mockResolvedValue([]),
            }),
          }),
        }),
      } as never);

      await expect(updateUserProfile(mockDeps, "nonexistent-user", { firstName: "Test" })).rejects.toThrow(
        "User not found",
      );
      expect(mockDeps.logger.error).toHaveBeenCalled();
    });
  });

  describe("updateUserLocale", () => {
    it("should update user locale successfully", async () => {
      vi.mocked(mockDeps.drizzle.update).mockReturnValue({
        set: vi.fn().mockReturnValue({
          where: vi.fn().mockResolvedValue(undefined),
        }),
      } as never);

      await updateUserLocale(mockDeps, "user-123", "ar");

      expect(mockDeps.drizzle.update).toHaveBeenCalled();
      expect(mockDeps.logger.info).toHaveBeenCalledWith(
        { userId: "user-123", locale: "ar" },
        "User locale updated successfully",
      );
    });
  });
});
