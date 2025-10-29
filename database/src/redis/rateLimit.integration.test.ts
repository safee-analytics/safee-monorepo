import { describe, it, expect, beforeAll, afterAll, beforeEach } from "vitest";
import { connectTest } from "../test-helpers/integration-setup.js";
import { redisFixedWindowRateLimit } from "./rateLimit.js";
import type { RedisClient } from "../index.js";

describe("Redis Rate Limit Integration Tests", () => {
  let redis: RedisClient;
  let close: () => Promise<void>;

  beforeAll(async () => {
    const connection = await connectTest({ withRedis: true });
    redis = connection.redis!;
    close = connection.close;
  });

  afterAll(async () => {
    await close();
  });

  beforeEach(async () => {
    // Clean Redis data
    await redis.flushDb();
  });

  describe("redisFixedWindowRateLimit", () => {
    it("should allow first request", async () => {
      const result = await redisFixedWindowRateLimit({
        redis,
        keyName: "rate:test:user1",
        rateLimitWindowSeconds: 60,
        maxCountPerWindow: 10,
      });

      expect(result.overRateLimit).toBe(false);
      expect(result.requestCount).toBe(1);
    });

    it("should increment counter for subsequent requests", async () => {
      await redisFixedWindowRateLimit({
        redis,
        keyName: "rate:test:user1",
        rateLimitWindowSeconds: 60,
        maxCountPerWindow: 10,
      });

      const result = await redisFixedWindowRateLimit({
        redis,
        keyName: "rate:test:user1",
        rateLimitWindowSeconds: 60,
        maxCountPerWindow: 10,
      });

      expect(result.overRateLimit).toBe(false);
      expect(result.requestCount).toBe(2);
    });

    it("should detect when rate limit is exceeded", async () => {
      // Make 11 requests (limit is 10)
      for (let i = 0; i < 11; i++) {
        await redisFixedWindowRateLimit({
          redis,
          keyName: "rate:test:limited",
          rateLimitWindowSeconds: 60,
          maxCountPerWindow: 10,
        });
      }

      const result = await redisFixedWindowRateLimit({
        redis,
        keyName: "rate:test:limited",
        rateLimitWindowSeconds: 60,
        maxCountPerWindow: 10,
      });

      expect(result.overRateLimit).toBe(true);
      expect(result.requestCount).toBeGreaterThan(10);
    });

    it("should allow exactly at the limit", async () => {
      // Make 10 requests (exactly at limit)
      for (let i = 0; i < 9; i++) {
        await redisFixedWindowRateLimit({
          redis,
          keyName: "rate:test:exact",
          rateLimitWindowSeconds: 60,
          maxCountPerWindow: 10,
        });
      }

      const result = await redisFixedWindowRateLimit({
        redis,
        keyName: "rate:test:exact",
        rateLimitWindowSeconds: 60,
        maxCountPerWindow: 10,
      });

      expect(result.overRateLimit).toBe(false);
      expect(result.requestCount).toBe(10);
    });

    it("should reset after window expires", async () => {
      // Make requests with 1 second window
      await redisFixedWindowRateLimit({
        redis,
        keyName: "rate:test:reset",
        rateLimitWindowSeconds: 1,
        maxCountPerWindow: 5,
      });

      let result = await redisFixedWindowRateLimit({
        redis,
        keyName: "rate:test:reset",
        rateLimitWindowSeconds: 1,
        maxCountPerWindow: 5,
      });

      expect(result.requestCount).toBe(2);

      // Wait for window to expire
      await new Promise((resolve) => setTimeout(resolve, 1100));

      // Should start fresh
      result = await redisFixedWindowRateLimit({
        redis,
        keyName: "rate:test:reset",
        rateLimitWindowSeconds: 1,
        maxCountPerWindow: 5,
      });

      expect(result.requestCount).toBe(1);
    });

    it("should handle different keys independently", async () => {
      await redisFixedWindowRateLimit({
        redis,
        keyName: "rate:user1",
        rateLimitWindowSeconds: 60,
        maxCountPerWindow: 10,
      });

      await redisFixedWindowRateLimit({
        redis,
        keyName: "rate:user1",
        rateLimitWindowSeconds: 60,
        maxCountPerWindow: 10,
      });

      const result = await redisFixedWindowRateLimit({
        redis,
        keyName: "rate:user2",
        rateLimitWindowSeconds: 60,
        maxCountPerWindow: 10,
      });

      expect(result.requestCount).toBe(1); // user2 starts fresh
    });

    it("should use atomic operations", async () => {
      // Make concurrent requests
      const results = await Promise.all([
        redisFixedWindowRateLimit({
          redis,
          keyName: "rate:concurrent",
          rateLimitWindowSeconds: 60,
          maxCountPerWindow: 100,
        }),
        redisFixedWindowRateLimit({
          redis,
          keyName: "rate:concurrent",
          rateLimitWindowSeconds: 60,
          maxCountPerWindow: 100,
        }),
        redisFixedWindowRateLimit({
          redis,
          keyName: "rate:concurrent",
          rateLimitWindowSeconds: 60,
          maxCountPerWindow: 100,
        }),
      ]);

      // All should have different counts (atomic increment)
      const counts = results.map((r) => r.requestCount);
      expect(new Set(counts).size).toBe(3); // All unique
      expect(Math.max(...counts)).toBe(3);
    });

    it("should handle API rate limiting scenario", async () => {
      const maxRequests = 100;

      // Simulate API requests
      const results = [];
      for (let i = 0; i < 105; i++) {
        const result = await redisFixedWindowRateLimit({
          redis,
          keyName: "rate:api:key123",
          rateLimitWindowSeconds: 3600,
          maxCountPerWindow: maxRequests,
        });
        results.push(result);
      }

      const allowedCount = results.filter((r) => !r.overRateLimit).length;
      const blockedCount = results.filter((r) => r.overRateLimit).length;

      expect(allowedCount).toBe(maxRequests);
      expect(blockedCount).toBe(5);
    });

    it("should handle login rate limiting scenario", async () => {
      // Simulate failed login attempts
      for (let i = 0; i < 5; i++) {
        await redisFixedWindowRateLimit({
          redis,
          keyName: "rate:login:user@example.com",
          rateLimitWindowSeconds: 300, // 5 minutes
          maxCountPerWindow: 5,
        });
      }

      const result = await redisFixedWindowRateLimit({
        redis,
        keyName: "rate:login:user@example.com",
        rateLimitWindowSeconds: 300,
        maxCountPerWindow: 5,
      });

      expect(result.overRateLimit).toBe(true);
      expect(result.requestCount).toBe(6);
    });

    it("should handle very high rate limits", async () => {
      const result = await redisFixedWindowRateLimit({
        redis,
        keyName: "rate:high:limit",
        rateLimitWindowSeconds: 60,
        maxCountPerWindow: 1000000,
      });

      expect(result.overRateLimit).toBe(false);
      expect(result.requestCount).toBe(1);
    });

    it("should handle very low rate limits", async () => {
      await redisFixedWindowRateLimit({
        redis,
        keyName: "rate:low:limit",
        rateLimitWindowSeconds: 60,
        maxCountPerWindow: 1,
      });

      const result = await redisFixedWindowRateLimit({
        redis,
        keyName: "rate:low:limit",
        rateLimitWindowSeconds: 60,
        maxCountPerWindow: 1,
      });

      expect(result.overRateLimit).toBe(true);
      expect(result.requestCount).toBe(2);
    });
  });

  describe("Window Expiration", () => {
    it("should set expiration only on first request", async () => {
      await redisFixedWindowRateLimit({
        redis,
        keyName: "rate:exp:test",
        rateLimitWindowSeconds: 10,
        maxCountPerWindow: 100,
      });

      const ttl1 = await redis.ttl("rate:exp:test");

      // Make another request
      await redisFixedWindowRateLimit({
        redis,
        keyName: "rate:exp:test",
        rateLimitWindowSeconds: 10,
        maxCountPerWindow: 100,
      });

      const ttl2 = await redis.ttl("rate:exp:test");

      // TTL should be roughly the same or less (time passed)
      expect(ttl2).toBeLessThanOrEqual(ttl1);
      expect(ttl2).toBeGreaterThan(0);
    });
  });
});
