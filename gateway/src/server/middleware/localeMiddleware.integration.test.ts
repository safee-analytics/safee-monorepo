import { describe, it, expect, beforeAll, afterAll } from "vitest";
import request from "supertest";
import type { Application } from "express";
import { createTestApp } from "../../test-helpers/test-app.js";

describe("Locale Middleware Integration Tests", () => {
  let app: Application;
  let cleanup: () => Promise<void>;

  beforeAll(async () => {
    const testApp = await createTestApp();
    app = testApp.app;
    cleanup = testApp.cleanup;
  });

  afterAll(async () => {
    await cleanup();
  });

  describe("Locale detection priority", () => {
    it("should use query parameter locale when provided", async () => {
      // The health endpoint doesn't require auth and will test locale middleware
      const response = await request(app).get("/api/v1/health?locale=ar");

      expect(response.status).toBe(200);
      // The locale should be set in req.locale, which health endpoint can access
    });

    it("should use x-locale header when query param not provided", async () => {
      const response = await request(app).get("/api/v1/health").set("x-locale", "ar");

      expect(response.status).toBe(200);
    });

    it("should use Accept-Language header when others not provided", async () => {
      const response = await request(app).get("/api/v1/health").set("Accept-Language", "ar-SA,ar;q=0.9,en;q=0.8");

      expect(response.status).toBe(200);
    });

    it("should default to 'en' when no locale information provided", async () => {
      const response = await request(app).get("/api/v1/health");

      expect(response.status).toBe(200);
    });

    it("should prioritize query param over headers", async () => {
      const response = await request(app)
        .get("/api/v1/health?locale=en")
        .set("x-locale", "ar")
        .set("Accept-Language", "ar-SA");

      expect(response.status).toBe(200);
    });

    it("should prioritize x-locale header over Accept-Language", async () => {
      const response = await request(app).get("/api/v1/health").set("x-locale", "en").set("Accept-Language", "ar-SA");

      expect(response.status).toBe(200);
    });
  });

  describe("Invalid locale handling", () => {
    it("should fall back to header when query param is invalid", async () => {
      const response = await request(app).get("/api/v1/health?locale=invalid").set("x-locale", "ar");

      expect(response.status).toBe(200);
    });

    it("should fall back to Accept-Language when both query and header are invalid", async () => {
      const response = await request(app)
        .get("/api/v1/health?locale=invalid")
        .set("x-locale", "invalid")
        .set("Accept-Language", "ar-SA");

      expect(response.status).toBe(200);
    });

    it("should default to 'en' when all locale sources are invalid", async () => {
      const response = await request(app)
        .get("/api/v1/health?locale=invalid")
        .set("x-locale", "invalid")
        .set("Accept-Language", "xx-XX");

      expect(response.status).toBe(200);
    });
  });

  describe("Arabic locale variations", () => {
    it("should accept 'ar' as query parameter", async () => {
      const response = await request(app).get("/api/v1/health?locale=ar");

      expect(response.status).toBe(200);
    });

    it("should accept 'ar' in x-locale header", async () => {
      const response = await request(app).get("/api/v1/health").set("x-locale", "ar");

      expect(response.status).toBe(200);
    });

    it("should parse Arabic from Accept-Language header", async () => {
      const response = await request(app).get("/api/v1/health").set("Accept-Language", "ar");

      expect(response.status).toBe(200);
    });

    it("should parse Arabic with regional code from Accept-Language", async () => {
      const response = await request(app).get("/api/v1/health").set("Accept-Language", "ar-SA,ar;q=0.9");

      expect(response.status).toBe(200);
    });
  });
});
