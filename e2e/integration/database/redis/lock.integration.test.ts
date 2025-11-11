import { describe, it, expect, beforeAll, afterAll, beforeEach } from "vitest";
import { connectTest, acquireRedisLock, acquireRedisLockWithRetry, type RedisClient } from "@safee/database";
import { pino } from "pino";

describe("Redis Lock Integration Tests", () => {
  let redis: RedisClient;
  let close: () => Promise<void>;
  const logger = pino({ level: "silent" });

  beforeAll(async () => {
    const connection = await connectTest({ appName: "redis-lock-test", withRedis: true });
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

  describe("acquireRedisLock", () => {
    it("should acquire lock when key does not exist", async () => {
      const acquired = await acquireRedisLock(redis, "test-lock", 30);

      expect(acquired).toBe(true);

      // Verify lock exists in Redis
      const value = await redis.get("test-lock");
      expect(value).toBe("In use");
    });

    it("should fail to acquire lock when key already exists", async () => {
      await acquireRedisLock(redis, "test-lock", 30);

      const acquired = await acquireRedisLock(redis, "test-lock", 30);

      expect(acquired).toBe(false);
    });

    it("should allow acquiring lock after expiration", async () => {
      await acquireRedisLock(redis, "test-lock", 1); // 1 second expiry

      // Wait for expiration
      await new Promise((resolve) => setTimeout(resolve, 1100));

      const acquired = await acquireRedisLock(redis, "test-lock", 30);

      expect(acquired).toBe(true);
    });

    it("should respect different lock names", async () => {
      await acquireRedisLock(redis, "lock-1", 30);

      const acquired = await acquireRedisLock(redis, "lock-2", 30);

      expect(acquired).toBe(true);
    });

    it("should use correct expiration time", async () => {
      await acquireRedisLock(redis, "test-lock", 60);

      const ttl = await redis.ttl("test-lock");

      expect(ttl).toBeGreaterThan(50);
      expect(ttl).toBeLessThanOrEqual(60);
    });
  });

  describe("acquireRedisLockWithRetry", () => {
    it("should acquire lock immediately if available", async () => {
      const acquired = await acquireRedisLockWithRetry({
        redis,
        lockName: "test-lock",
        maxLockTimeSeconds: 30,
        maxRetries: 3,
        timeoutAfterRetry: 100,
        logger,
      });

      expect(acquired).toBe(true);
    });

    it("should retry and eventually acquire lock", async () => {
      // Acquire lock with short expiry
      await acquireRedisLock(redis, "test-lock", 1);

      // Try to acquire with retry - should succeed after lock expires
      const acquired = await acquireRedisLockWithRetry({
        redis,
        lockName: "test-lock",
        maxLockTimeSeconds: 30,
        maxRetries: 5,
        timeoutAfterRetry: 300,
        logger,
      });

      expect(acquired).toBe(true);
    });

    it("should fail after all retries exhausted", async () => {
      // Hold the lock for longer than retry period
      await acquireRedisLock(redis, "test-lock", 10);

      const acquired = await acquireRedisLockWithRetry({
        redis,
        lockName: "test-lock",
        maxLockTimeSeconds: 30,
        maxRetries: 2,
        timeoutAfterRetry: 100,
        logger,
      });

      expect(acquired).toBe(false);
    });

    it("should work without logger", async () => {
      const acquired = await acquireRedisLockWithRetry({
        redis,
        lockName: "test-lock",
        maxLockTimeSeconds: 30,
        maxRetries: 1,
        timeoutAfterRetry: 100,
      });

      expect(acquired).toBe(true);
    });
  });

  describe("Concurrent Lock Attempts", () => {
    it("should handle multiple concurrent lock attempts", async () => {
      const attempts = await Promise.all([
        acquireRedisLock(redis, "shared-lock", 30),
        acquireRedisLock(redis, "shared-lock", 30),
        acquireRedisLock(redis, "shared-lock", 30),
      ]);

      const successCount = attempts.filter((a) => a).length;
      const failCount = attempts.filter((a) => !a).length;

      expect(successCount).toBe(1);
      expect(failCount).toBe(2);
    });
  });

  describe("Lock Cleanup", () => {
    it("should properly clean up expired locks", async () => {
      await acquireRedisLock(redis, "temp-lock", 1);

      let exists = await redis.exists("temp-lock");
      expect(exists).toBe(1);

      // Wait for expiration
      await new Promise((resolve) => setTimeout(resolve, 1100));

      exists = await redis.exists("temp-lock");
      expect(exists).toBe(0);
    });
  });
});
