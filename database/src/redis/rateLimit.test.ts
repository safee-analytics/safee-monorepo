import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { redisFixedWindowRateLimit } from "./rateLimit.js";
import type { RedisClient } from "../index.js";

describe("Redis Rate Limit", () => {
  let mockRedis: RedisClient;
  let mockMulti: {
    incr: ReturnType<typeof vi.fn>;
    expire: ReturnType<typeof vi.fn>;
    exec: ReturnType<typeof vi.fn>;
  };

  beforeEach(() => {
    mockMulti = {
      incr: vi.fn().mockReturnThis(),
      expire: vi.fn().mockReturnThis(),
      exec: vi.fn(),
    };

    mockRedis = {
      multi: vi.fn().mockReturnValue(mockMulti),
    } as unknown as RedisClient;
  });

  afterEach(() => {
    vi.clearAllMocks();
  });

  describe("redisFixedWindowRateLimit", () => {
    it("should allow first request and return count 1", async () => {
      mockMulti.exec.mockResolvedValue([1, "OK"]);

      const result = await redisFixedWindowRateLimit({
        redis: mockRedis,
        keyName: "rate:test:user123",
        rateLimitWindowSeconds: 60,
        maxCountPerWindow: 10,
      });

      expect(result.overRateLimit).toBe(false);
      expect(result.requestCount).toBe(1);
      expect(mockRedis.multi).toHaveBeenCalledTimes(1);
      expect(mockMulti.incr).toHaveBeenCalledWith("rate:test:user123");
      expect(mockMulti.expire).toHaveBeenCalledWith("rate:test:user123", 60, "NX");
      expect(mockMulti.exec).toHaveBeenCalledTimes(1);
    });

    it("should increment count for subsequent requests", async () => {
      mockMulti.exec.mockResolvedValue([5, "OK"]);

      const result = await redisFixedWindowRateLimit({
        redis: mockRedis,
        keyName: "rate:test:user123",
        rateLimitWindowSeconds: 60,
        maxCountPerWindow: 10,
      });

      expect(result.overRateLimit).toBe(false);
      expect(result.requestCount).toBe(5);
    });

    it("should detect when rate limit is exceeded", async () => {
      mockMulti.exec.mockResolvedValue([11, "OK"]);

      const result = await redisFixedWindowRateLimit({
        redis: mockRedis,
        keyName: "rate:test:user123",
        rateLimitWindowSeconds: 60,
        maxCountPerWindow: 10,
      });

      expect(result.overRateLimit).toBe(true);
      expect(result.requestCount).toBe(11);
    });

    it("should detect when rate limit is exactly at the limit", async () => {
      mockMulti.exec.mockResolvedValue([10, "OK"]);

      const result = await redisFixedWindowRateLimit({
        redis: mockRedis,
        keyName: "rate:test:user123",
        rateLimitWindowSeconds: 60,
        maxCountPerWindow: 10,
      });

      expect(result.overRateLimit).toBe(false);
      expect(result.requestCount).toBe(10);
    });

    it("should detect when rate limit is exceeded by 1", async () => {
      mockMulti.exec.mockResolvedValue([11, "OK"]);

      const result = await redisFixedWindowRateLimit({
        redis: mockRedis,
        keyName: "rate:test:user123",
        rateLimitWindowSeconds: 60,
        maxCountPerWindow: 10,
      });

      expect(result.overRateLimit).toBe(true);
      expect(result.requestCount).toBe(11);
    });

    it("should use NX flag to only set expiration on first request", async () => {
      mockMulti.exec.mockResolvedValue([1, "OK"]);

      await redisFixedWindowRateLimit({
        redis: mockRedis,
        keyName: "rate:test:user123",
        rateLimitWindowSeconds: 30,
        maxCountPerWindow: 5,
      });

      expect(mockMulti.expire).toHaveBeenCalledWith("rate:test:user123", 30, "NX");
    });

    it("should work with different window sizes", async () => {
      mockMulti.exec.mockResolvedValue([3, "OK"]);

      const result = await redisFixedWindowRateLimit({
        redis: mockRedis,
        keyName: "rate:api:endpoint",
        rateLimitWindowSeconds: 3600,
        maxCountPerWindow: 100,
      });

      expect(result.overRateLimit).toBe(false);
      expect(result.requestCount).toBe(3);
      expect(mockMulti.expire).toHaveBeenCalledWith("rate:api:endpoint", 3600, "NX");
    });

    it("should work with different rate limits", async () => {
      mockMulti.exec.mockResolvedValue([50, "OK"]);

      const result = await redisFixedWindowRateLimit({
        redis: mockRedis,
        keyName: "rate:api:endpoint",
        rateLimitWindowSeconds: 60,
        maxCountPerWindow: 100,
      });

      expect(result.overRateLimit).toBe(false);
      expect(result.requestCount).toBe(50);
    });

    it("should use different key names for different resources", async () => {
      mockMulti.exec.mockResolvedValue([1, "OK"]);

      await redisFixedWindowRateLimit({
        redis: mockRedis,
        keyName: "rate:login:user123",
        rateLimitWindowSeconds: 60,
        maxCountPerWindow: 5,
      });

      expect(mockMulti.incr).toHaveBeenCalledWith("rate:login:user123");
      expect(mockMulti.expire).toHaveBeenCalledWith("rate:login:user123", 60, "NX");

      vi.clearAllMocks();
      mockMulti.exec.mockResolvedValue([1, "OK"]);

      await redisFixedWindowRateLimit({
        redis: mockRedis,
        keyName: "rate:api:user123",
        rateLimitWindowSeconds: 60,
        maxCountPerWindow: 100,
      });

      expect(mockMulti.incr).toHaveBeenCalledWith("rate:api:user123");
      expect(mockMulti.expire).toHaveBeenCalledWith("rate:api:user123", 60, "NX");
    });

    it("should handle high request counts", async () => {
      mockMulti.exec.mockResolvedValue([999, "OK"]);

      const result = await redisFixedWindowRateLimit({
        redis: mockRedis,
        keyName: "rate:test:user123",
        rateLimitWindowSeconds: 60,
        maxCountPerWindow: 100,
      });

      expect(result.overRateLimit).toBe(true);
      expect(result.requestCount).toBe(999);
    });

    it("should throw error if Redis returns non-number for count", async () => {
      mockMulti.exec.mockResolvedValue(["invalid", "OK"]);

      await expect(
        redisFixedWindowRateLimit({
          redis: mockRedis,
          keyName: "rate:test:user123",
          rateLimitWindowSeconds: 60,
          maxCountPerWindow: 10,
        }),
      ).rejects.toThrow('Redis operations returned not number and was instead: "invalid"');
    });

    it("should throw error if Redis returns null for count", async () => {
      mockMulti.exec.mockResolvedValue([null, "OK"]);

      await expect(
        redisFixedWindowRateLimit({
          redis: mockRedis,
          keyName: "rate:test:user123",
          rateLimitWindowSeconds: 60,
          maxCountPerWindow: 10,
        }),
      ).rejects.toThrow("Redis operations returned not number and was instead: null");
    });

    it("should throw error if Redis returns object for count", async () => {
      mockMulti.exec.mockResolvedValue([{ count: 1 }, "OK"]);

      await expect(
        redisFixedWindowRateLimit({
          redis: mockRedis,
          keyName: "rate:test:user123",
          rateLimitWindowSeconds: 60,
          maxCountPerWindow: 10,
        }),
      ).rejects.toThrow('Redis operations returned not number and was instead: {"count":1}');
    });
  });

  describe("Rate Limit Scenarios", () => {
    it("should handle login rate limiting scenario", async () => {
      // Simulate 5 failed login attempts
      for (let i = 1; i <= 5; i++) {
        mockMulti.exec.mockResolvedValue([i, "OK"]);

        const result = await redisFixedWindowRateLimit({
          redis: mockRedis,
          keyName: "rate:login:user123",
          rateLimitWindowSeconds: 300,
          maxCountPerWindow: 5,
        });

        expect(result.requestCount).toBe(i);
        expect(result.overRateLimit).toBe(i > 5);
      }
    });

    it("should handle API rate limiting scenario", async () => {
      // Simulate API requests up to and over the limit
      const maxRequests = 100;

      for (let i = 1; i <= 105; i++) {
        mockMulti.exec.mockResolvedValue([i, "OK"]);

        const result = await redisFixedWindowRateLimit({
          redis: mockRedis,
          keyName: "rate:api:key123",
          rateLimitWindowSeconds: 3600,
          maxCountPerWindow: maxRequests,
        });

        if (i <= maxRequests) {
          expect(result.overRateLimit).toBe(false);
        } else {
          expect(result.overRateLimit).toBe(true);
        }
      }
    });

    it("should handle concurrent requests", async () => {
      const requests = [1, 2, 3, 4, 5].map((count) => {
        mockMulti.exec.mockResolvedValueOnce([count, "OK"]);
        return redisFixedWindowRateLimit({
          redis: mockRedis,
          keyName: "rate:concurrent:test",
          rateLimitWindowSeconds: 60,
          maxCountPerWindow: 10,
        });
      });

      const results = await Promise.all(requests);

      for (const [index, result] of results.entries()) {
        expect(result.requestCount).toBe(index + 1);
        expect(result.overRateLimit).toBe(false);
      }
    });

    it("should handle very short time windows", async () => {
      mockMulti.exec.mockResolvedValue([1, "OK"]);

      const result = await redisFixedWindowRateLimit({
        redis: mockRedis,
        keyName: "rate:short:window",
        rateLimitWindowSeconds: 1,
        maxCountPerWindow: 10,
      });

      expect(result.overRateLimit).toBe(false);
      expect(mockMulti.expire).toHaveBeenCalledWith("rate:short:window", 1, "NX");
    });

    it("should handle very long time windows", async () => {
      mockMulti.exec.mockResolvedValue([1, "OK"]);

      const result = await redisFixedWindowRateLimit({
        redis: mockRedis,
        keyName: "rate:long:window",
        rateLimitWindowSeconds: 86400, // 24 hours
        maxCountPerWindow: 1000,
      });

      expect(result.overRateLimit).toBe(false);
      expect(mockMulti.expire).toHaveBeenCalledWith("rate:long:window", 86400, "NX");
    });

    it("should handle very low rate limits", async () => {
      mockMulti.exec.mockResolvedValue([2, "OK"]);

      const result = await redisFixedWindowRateLimit({
        redis: mockRedis,
        keyName: "rate:strict:limit",
        rateLimitWindowSeconds: 60,
        maxCountPerWindow: 1,
      });

      expect(result.overRateLimit).toBe(true);
      expect(result.requestCount).toBe(2);
    });
  });

  describe("Fixed Window Behavior", () => {
    it("should use atomic operations with multi/exec", async () => {
      mockMulti.exec.mockResolvedValue([1, "OK"]);

      await redisFixedWindowRateLimit({
        redis: mockRedis,
        keyName: "rate:test:atomic",
        rateLimitWindowSeconds: 60,
        maxCountPerWindow: 10,
      });

      expect(mockRedis.multi).toHaveBeenCalledTimes(1);
      expect(mockMulti.incr).toHaveBeenCalledTimes(1);
      expect(mockMulti.expire).toHaveBeenCalledTimes(1);
      expect(mockMulti.exec).toHaveBeenCalledTimes(1);
    });

    it("should preserve call order in multi transaction", async () => {
      mockMulti.exec.mockResolvedValue([1, "OK"]);
      const callOrder: string[] = [];

      mockMulti.incr.mockImplementation((key) => {
        callOrder.push(`incr:${key}`);
        return mockMulti;
      });

      mockMulti.expire.mockImplementation((key) => {
        callOrder.push(`expire:${key}`);
        return mockMulti;
      });

      await redisFixedWindowRateLimit({
        redis: mockRedis,
        keyName: "rate:test:order",
        rateLimitWindowSeconds: 60,
        maxCountPerWindow: 10,
      });

      expect(callOrder).toEqual(["incr:rate:test:order", "expire:rate:test:order"]);
    });
  });
});
