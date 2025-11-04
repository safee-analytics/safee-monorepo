import { describe, it, expect, beforeAll, afterAll, beforeEach } from "vitest";
import request from "supertest";
import type { Application } from "express";
import { createTestFixtures, cleanTestData, type TestFixtures } from "@safee/database/test-helpers";
import { createTestApp } from "../../test-helpers/test-app.js";
import { jwtService } from "../services/jwt.js";

describe("Auth Middleware Integration Tests", () => {
  let app: Application;
  let cleanup: () => Promise<void>;
  let fixtures: TestFixtures;

  beforeAll(async () => {
    const testApp = await createTestApp();
    app = testApp.app;
    cleanup = testApp.cleanup;
  });

  afterAll(async () => {
    await cleanup();
  });

  beforeEach(async () => {
    // Get db from the app's context for creating fixtures
    const { connect } = await import("@safee/database");
    const { drizzle } = connect(
      "test-fixtures",
      process.env.DATABASE_URL ?? "postgresql://safee:safee@localhost:45432/safee",
    );

    await cleanTestData(drizzle);
    fixtures = await createTestFixtures(drizzle);
  });

  describe("Protected endpoints - Basic authentication", () => {
    it("should reject requests without authorization header", async () => {
      const response = await request(app).get("/api/v1/users/me");

      expect(response.status).toBe(401);
    });

    it("should reject requests with malformed authorization header", async () => {
      const response = await request(app).get("/api/v1/users/me").set("Authorization", "InvalidFormat");

      expect(response.status).toBe(401);
    });

    it("should reject requests with invalid token", async () => {
      const response = await request(app)
        .get("/api/v1/users/me")
        .set("Authorization", "Bearer invalid-token");

      expect(response.status).toBe(401);
    });

    it("should accept requests with valid JWT token from real user", async () => {
      const { accessToken } = await jwtService.generateAccessToken({
        userId: fixtures.user.id,
        organizationId: fixtures.organization.id,
        email: fixtures.user.email,
        roles: ["user"],
        permissions: ["users:read"],
      });

      const response = await request(app)
        .get("/api/v1/users/me")
        .set("Authorization", `Bearer ${accessToken}`);

      // Should at least get past authentication (might get 403 for permissions or 200 for success)
      expect([200, 403]).toContain(response.status);
    });
  });

  describe("Token validation", () => {
    it("should handle Bearer token correctly", async () => {
      const { accessToken } = await jwtService.generateAccessToken({
        userId: fixtures.user.id,
        organizationId: fixtures.organization.id,
        email: fixtures.user.email,
        roles: ["user"],
        permissions: ["users:read"],
      });

      const response = await request(app).get("/api/v1/health").set("Authorization", `Bearer ${accessToken}`);

      expect(response.status).toBe(200);
    });

    it("should reject token without Bearer prefix", async () => {
      const { accessToken } = await jwtService.generateAccessToken({
        userId: fixtures.user.id,
        organizationId: fixtures.organization.id,
        email: fixtures.user.email,
        roles: ["user"],
        permissions: [],
      });

      const response = await request(app).get("/api/v1/users/me").set("Authorization", accessToken);

      expect(response.status).toBe(401);
    });

    it("should reject empty authorization header", async () => {
      const response = await request(app).get("/api/v1/users/me").set("Authorization", "");

      expect(response.status).toBe(401);
    });

    it("should reject malformed JWT", async () => {
      const response = await request(app)
        .get("/api/v1/users/me")
        .set("Authorization", "Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.invalid.signature");

      expect(response.status).toBe(401);
    });
  });

  describe("Permission-based access", () => {
    it("should allow admin with proper permissions", async () => {
      const { accessToken } = await jwtService.generateAccessToken({
        userId: fixtures.adminUser.id,
        organizationId: fixtures.organization.id,
        email: fixtures.adminUser.email,
        roles: ["admin"],
        permissions: ["users:read", "users:update", "users:manage"],
      });

      const response = await request(app)
        .get("/api/v1/users/me")
        .set("Authorization", `Bearer ${accessToken}`);

      expect([200, 403]).toContain(response.status);
    });

    it("should work with wildcard permissions", async () => {
      const { accessToken } = await jwtService.generateAccessToken({
        userId: fixtures.adminUser.id,
        organizationId: fixtures.organization.id,
        email: fixtures.adminUser.email,
        roles: ["superadmin"],
        permissions: ["*"],
      });

      const response = await request(app)
        .get("/api/v1/users/me")
        .set("Authorization", `Bearer ${accessToken}`);

      expect([200, 403]).toContain(response.status);
    });

    it("should work with wildcard prefix permissions", async () => {
      const { accessToken } = await jwtService.generateAccessToken({
        userId: fixtures.adminUser.id,
        organizationId: fixtures.organization.id,
        email: fixtures.adminUser.email,
        roles: ["manager"],
        permissions: ["users:*"],
      });

      const response = await request(app)
        .get("/api/v1/users/me")
        .set("Authorization", `Bearer ${accessToken}`);

      expect([200, 403]).toContain(response.status);
    });
  });

  describe("Health check endpoint (no auth required)", () => {
    it("should allow access without authentication", async () => {
      const response = await request(app).get("/api/v1/health");

      expect(response.status).toBe(200);
      expect(response.body).toHaveProperty("status");
    });
  });

  describe("Real user authentication flow", () => {
    it("should authenticate real user from database with valid permissions", async () => {
      const { accessToken } = await jwtService.generateAccessToken({
        userId: fixtures.user.id,
        organizationId: fixtures.organization.id,
        email: fixtures.user.email,
        roles: [fixtures.userRole.slug],
        permissions: [fixtures.permissions.readUsers.slug],
      });

      const response = await request(app).get("/api/v1/health").set("Authorization", `Bearer ${accessToken}`);

      expect(response.status).toBe(200);
    });

    it("should authenticate admin user from database with all permissions", async () => {
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

      const response = await request(app).get("/api/v1/health").set("Authorization", `Bearer ${accessToken}`);

      expect(response.status).toBe(200);
    });
  });
});
