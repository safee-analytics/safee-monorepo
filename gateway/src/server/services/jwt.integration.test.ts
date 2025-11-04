import { describe, it, expect, beforeEach } from "vitest";
import { jwtService } from "./jwt.js";
import { InvalidToken } from "../errors.js";
import jwt, { type JwtPayload } from "jsonwebtoken";
import { getAuthConfig } from "../../config/index.js";
import { connect } from "@safee/database";
import { createTestFixtures, cleanTestData, type TestFixtures } from "@safee/database/test-helpers";
import { subSeconds } from "date-fns";

describe("JWT Service Integration Tests", () => {
  let fixtures: TestFixtures;

  beforeEach(async () => {
    const { drizzle } = connect(
      "jwt-test",
      process.env.DATABASE_URL ?? "postgresql://safee:safee@localhost:45432/safee",
    );

    await cleanTestData(drizzle);
    fixtures = await createTestFixtures(drizzle);
  });

  describe("generateAccessToken", () => {
    it("should generate a valid access token for real user", async () => {
      const result = await jwtService.generateAccessToken({
        userId: fixtures.user.id,
        organizationId: fixtures.organization.id,
        email: fixtures.user.email,
        roles: [fixtures.userRole.slug],
        permissions: [fixtures.permissions.readUsers.slug],
      });

      expect(result).toHaveProperty("accessToken");
      expect(result).toHaveProperty("expiresIn");
      expect(typeof result.accessToken).toBe("string");
      expect(result.accessToken.split(".")).toHaveLength(3); // JWT has 3 parts
      expect(typeof result.expiresIn).toBe("number");
      expect(result.expiresIn).toBeGreaterThan(0);
    });

    it("should generate token with correct payload for real user", async () => {
      const { accessToken } = await jwtService.generateAccessToken({
        userId: fixtures.user.id,
        organizationId: fixtures.organization.id,
        email: fixtures.user.email,
        roles: [fixtures.userRole.slug],
        permissions: [fixtures.permissions.readUsers.slug],
      });

      const config = getAuthConfig();
      const decoded = jwt.verify(accessToken, config.jwtSecret) as JwtPayload & {
        userId: string;
        organizationId: string;
        email: string;
        roles: string[];
        permissions: string[];
        type: string;
        iss: string;
        aud: string;
      };

      expect(decoded.userId).toBe(fixtures.user.id);
      expect(decoded.organizationId).toBe(fixtures.organization.id);
      expect(decoded.email).toBe(fixtures.user.email);
      expect(decoded.roles).toEqual([fixtures.userRole.slug]);
      expect(decoded.permissions).toEqual([fixtures.permissions.readUsers.slug]);
      expect(decoded.type).toBe("access");
      expect(decoded.iss).toBe("safee-analytics");
      expect(decoded.aud).toBe("safee-api");
    });

    it("should generate different tokens for different users", async () => {
      const { accessToken: token1 } = await jwtService.generateAccessToken({
        userId: fixtures.user.id,
        organizationId: fixtures.organization.id,
        email: fixtures.user.email,
        roles: [fixtures.userRole.slug],
        permissions: [fixtures.permissions.readUsers.slug],
      });

      const { accessToken: token2 } = await jwtService.generateAccessToken({
        userId: fixtures.adminUser.id,
        organizationId: fixtures.organization.id,
        email: fixtures.adminUser.email,
        roles: [fixtures.adminRole.slug],
        permissions: [
          fixtures.permissions.readUsers.slug,
          fixtures.permissions.updateUsers.slug,
          fixtures.permissions.manageUsers.slug,
        ],
      });

      expect(token1).not.toBe(token2);
    });

    it("should include sessionId when provided", async () => {
      const sessionId = "session-123";
      const { accessToken } = await jwtService.generateAccessToken({
        userId: fixtures.user.id,
        organizationId: fixtures.organization.id,
        email: fixtures.user.email,
        roles: [fixtures.userRole.slug],
        permissions: [fixtures.permissions.readUsers.slug],
        sessionId,
      });

      const config = getAuthConfig();
      const decoded = jwt.verify(accessToken, config.jwtSecret) as JwtPayload & { sessionId?: string };

      expect(decoded.sessionId).toBe(sessionId);
    });

    it("should generate token with admin permissions", async () => {
      const { accessToken } = await jwtService.generateAccessToken({
        userId: fixtures.adminUser.id,
        organizationId: fixtures.organization.id,
        email: fixtures.adminUser.email,
        roles: [fixtures.adminRole.slug],
        permissions: [
          fixtures.permissions.readUsers.slug,
          fixtures.permissions.updateUsers.slug,
          fixtures.permissions.manageUsers.slug,
        ],
      });

      const config = getAuthConfig();
      const decoded = jwt.verify(accessToken, config.jwtSecret) as JwtPayload & { permissions: string[] };

      expect(decoded.permissions).toHaveLength(3);
      expect(decoded.permissions).toContain(fixtures.permissions.manageUsers.slug);
    });
  });

  describe("generateTokenPair", () => {
    it("should generate both access and refresh tokens for real user", async () => {
      const result = await jwtService.generateTokenPair({
        userId: fixtures.user.id,
        organizationId: fixtures.organization.id,
        email: fixtures.user.email,
        roles: [fixtures.userRole.slug],
        permissions: [fixtures.permissions.readUsers.slug],
      });

      expect(result).toHaveProperty("accessToken");
      expect(result).toHaveProperty("refreshToken");
      expect(result).toHaveProperty("expiresIn");
      expect(typeof result.accessToken).toBe("string");
      expect(typeof result.refreshToken).toBe("string");
      expect(result.accessToken).not.toBe(result.refreshToken);
    });

    it("should generate refresh token with correct type", async () => {
      const { refreshToken } = await jwtService.generateTokenPair({
        userId: fixtures.user.id,
        organizationId: fixtures.organization.id,
        email: fixtures.user.email,
        roles: [fixtures.userRole.slug],
        permissions: [fixtures.permissions.readUsers.slug],
      });

      const config = getAuthConfig();
      const decoded = jwt.verify(refreshToken, config.jwtSecret) as JwtPayload & {
        type: string;
        userId: string;
        organizationId: string;
        email: string;
        tokenId: string;
      };

      expect(decoded.type).toBe("refresh");
      expect(decoded.userId).toBe(fixtures.user.id);
      expect(decoded.organizationId).toBe(fixtures.organization.id);
      expect(decoded.email).toBe(fixtures.user.email);
      expect(decoded.tokenId).toBeDefined();
    });

    it("should generate unique tokenId for each refresh token", async () => {
      const { refreshToken: token1 } = await jwtService.generateTokenPair({
        userId: fixtures.user.id,
        organizationId: fixtures.organization.id,
        email: fixtures.user.email,
        roles: [fixtures.userRole.slug],
        permissions: [fixtures.permissions.readUsers.slug],
      });

      const { refreshToken: token2 } = await jwtService.generateTokenPair({
        userId: fixtures.user.id,
        organizationId: fixtures.organization.id,
        email: fixtures.user.email,
        roles: [fixtures.userRole.slug],
        permissions: [fixtures.permissions.readUsers.slug],
      });

      const config = getAuthConfig();
      const decoded1 = jwt.verify(token1, config.jwtSecret) as JwtPayload & { tokenId: string };
      const decoded2 = jwt.verify(token2, config.jwtSecret) as JwtPayload & { tokenId: string };

      expect(decoded1.tokenId).not.toBe(decoded2.tokenId);
    });
  });

  describe("verifyAccessToken", () => {
    it("should verify valid access token for real user", async () => {
      const { accessToken } = await jwtService.generateAccessToken({
        userId: fixtures.user.id,
        organizationId: fixtures.organization.id,
        email: fixtures.user.email,
        roles: [fixtures.userRole.slug],
        permissions: [fixtures.permissions.readUsers.slug],
      });

      const decoded = await jwtService.verifyAccessToken(accessToken);

      expect(decoded.userId).toBe(fixtures.user.id);
      expect(decoded.organizationId).toBe(fixtures.organization.id);
      expect(decoded.email).toBe(fixtures.user.email);
      expect(decoded.roles).toEqual([fixtures.userRole.slug]);
      expect(decoded.permissions).toEqual([fixtures.permissions.readUsers.slug]);
    });

    it("should reject invalid token", async () => {
      await expect(jwtService.verifyAccessToken("invalid.token.here")).rejects.toThrow(InvalidToken);
    });

    it("should reject malformed token", async () => {
      await expect(jwtService.verifyAccessToken("not-a-jwt")).rejects.toThrow(InvalidToken);
    });

    it("should reject expired token", async () => {
      const config = getAuthConfig();
      const now = new Date();
      const expiredTime = subSeconds(now, 10); // 10 seconds ago

      const expiredToken = jwt.sign(
        {
          userId: fixtures.user.id,
          organizationId: fixtures.organization.id,
          email: fixtures.user.email,
          roles: [fixtures.userRole.slug],
          permissions: [fixtures.permissions.readUsers.slug],
          type: "access",
          iat: Math.floor(expiredTime.getTime() / 1000),
          exp: Math.floor(expiredTime.getTime() / 1000),
        },
        config.jwtSecret,
        {
          issuer: "safee-analytics",
          audience: "safee-api",
          noTimestamp: true,
        },
      );

      // Token with exp in the past will be rejected (may throw TokenExpired or InvalidToken)
      await expect(jwtService.verifyAccessToken(expiredToken)).rejects.toThrow();
    });

    it("should reject refresh token when expecting access token", async () => {
      const { refreshToken } = await jwtService.generateTokenPair({
        userId: fixtures.user.id,
        organizationId: fixtures.organization.id,
        email: fixtures.user.email,
        roles: [fixtures.userRole.slug],
        permissions: [fixtures.permissions.readUsers.slug],
      });

      await expect(jwtService.verifyAccessToken(refreshToken)).rejects.toThrow(InvalidToken);
    });

    it("should reject token with wrong issuer", async () => {
      const config = getAuthConfig();
      const wrongIssuerToken = jwt.sign(
        {
          userId: fixtures.user.id,
          organizationId: fixtures.organization.id,
          email: fixtures.user.email,
          roles: [fixtures.userRole.slug],
          permissions: [fixtures.permissions.readUsers.slug],
          type: "access",
        },
        config.jwtSecret,
        {
          expiresIn: "1h",
          issuer: "wrong-issuer",
          audience: "safee-api",
        },
      );

      await expect(jwtService.verifyAccessToken(wrongIssuerToken)).rejects.toThrow(InvalidToken);
    });

    it("should reject token with wrong secret", async () => {
      const wrongSecretToken = jwt.sign(
        {
          userId: fixtures.user.id,
          organizationId: fixtures.organization.id,
          email: fixtures.user.email,
          roles: [fixtures.userRole.slug],
          permissions: [fixtures.permissions.readUsers.slug],
          type: "access",
        },
        "wrong-secret",
        {
          expiresIn: "1h",
          issuer: "safee-analytics",
          audience: "safee-api",
        },
      );

      await expect(jwtService.verifyAccessToken(wrongSecretToken)).rejects.toThrow(InvalidToken);
    });

    it("should verify token with admin permissions", async () => {
      const { accessToken } = await jwtService.generateAccessToken({
        userId: fixtures.adminUser.id,
        organizationId: fixtures.organization.id,
        email: fixtures.adminUser.email,
        roles: [fixtures.adminRole.slug],
        permissions: [
          fixtures.permissions.readUsers.slug,
          fixtures.permissions.updateUsers.slug,
          fixtures.permissions.manageUsers.slug,
        ],
      });

      const decoded = await jwtService.verifyAccessToken(accessToken);

      expect(decoded.permissions).toHaveLength(3);
      expect(decoded.permissions).toContain(fixtures.permissions.manageUsers.slug);
    });
  });

  describe("verifyRefreshToken", () => {
    it("should verify valid refresh token for real user", async () => {
      const { refreshToken } = await jwtService.generateTokenPair({
        userId: fixtures.user.id,
        organizationId: fixtures.organization.id,
        email: fixtures.user.email,
        roles: [fixtures.userRole.slug],
        permissions: [fixtures.permissions.readUsers.slug],
      });

      const decoded = await jwtService.verifyRefreshToken(refreshToken);

      expect(decoded.userId).toBe(fixtures.user.id);
      expect(decoded.organizationId).toBe(fixtures.organization.id);
      expect(decoded.email).toBe(fixtures.user.email);
      expect(decoded.type).toBe("refresh");
      expect(decoded.tokenId).toBeDefined();
    });

    it("should reject access token when expecting refresh token", async () => {
      const { accessToken } = await jwtService.generateAccessToken({
        userId: fixtures.user.id,
        organizationId: fixtures.organization.id,
        email: fixtures.user.email,
        roles: [fixtures.userRole.slug],
        permissions: [fixtures.permissions.readUsers.slug],
      });

      await expect(jwtService.verifyRefreshToken(accessToken)).rejects.toThrow(InvalidToken);
    });

    it("should reject invalid refresh token", async () => {
      await expect(jwtService.verifyRefreshToken("invalid.token.here")).rejects.toThrow(InvalidToken);
    });

    it("should reject expired refresh token", async () => {
      const config = getAuthConfig();
      const now = new Date();
      const expiredTime = subSeconds(now, 10); // 10 seconds ago

      const expiredToken = jwt.sign(
        {
          userId: fixtures.user.id,
          organizationId: fixtures.organization.id,
          email: fixtures.user.email,
          tokenId: "test-token-id",
          type: "refresh",
          iat: Math.floor(expiredTime.getTime() / 1000),
          exp: Math.floor(expiredTime.getTime() / 1000),
        },
        config.jwtSecret,
        {
          issuer: "safee-analytics",
          audience: "safee-api",
          noTimestamp: true,
        },
      );

      // Token with exp in the past will be rejected (may throw TokenExpired or InvalidToken)
      await expect(jwtService.verifyRefreshToken(expiredToken)).rejects.toThrow();
    });
  });

  describe("extractTokenFromHeader", () => {
    it("should extract token from valid Bearer header", () => {
      const token = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.test.token";
      const header = `Bearer ${token}`;

      const extracted = jwtService.extractTokenFromHeader(header);

      expect(extracted).toBe(token);
    });

    it("should return null for missing header", () => {
      const extracted = jwtService.extractTokenFromHeader(undefined);

      expect(extracted).toBeNull();
    });

    it("should return null for header without Bearer prefix", () => {
      const extracted = jwtService.extractTokenFromHeader("SomeToken");

      expect(extracted).toBeNull();
    });

    it("should return null for empty Bearer token", () => {
      const extracted = jwtService.extractTokenFromHeader("Bearer ");

      expect(extracted).toBeNull();
    });

    it("should return null for malformed header", () => {
      const extracted = jwtService.extractTokenFromHeader("NotBearer token");

      expect(extracted).toBeNull();
    });
  });

  describe("Token expiration", () => {
    it("should set correct expiration time", async () => {
      const { accessToken, expiresIn } = await jwtService.generateAccessToken({
        userId: fixtures.user.id,
        organizationId: fixtures.organization.id,
        email: fixtures.user.email,
        roles: [fixtures.userRole.slug],
        permissions: [fixtures.permissions.readUsers.slug],
      });

      const config = getAuthConfig();
      const decoded = jwt.verify(accessToken, config.jwtSecret) as JwtPayload & {
        exp: number;
        iat: number;
      };

      // Check that exp is set and is in the future
      expect(decoded.exp).toBeDefined();
      expect(decoded.iat).toBeDefined();
      expect(decoded.exp).toBeGreaterThan(decoded.iat);

      // Verify expiresIn matches the difference
      const calculatedExpiresIn = decoded.exp - decoded.iat;
      expect(calculatedExpiresIn).toBe(expiresIn);
    });

    it("should handle different expiration formats", async () => {
      const { expiresIn } = await jwtService.generateAccessToken({
        userId: fixtures.user.id,
        organizationId: fixtures.organization.id,
        email: fixtures.user.email,
        roles: [fixtures.userRole.slug],
        permissions: [fixtures.permissions.readUsers.slug],
      });

      // expiresIn should be a positive number (seconds)
      expect(expiresIn).toBeGreaterThan(0);
      expect(typeof expiresIn).toBe("number");
    });
  });
});
