import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { acquireRedisLock, acquireRedisLockWithRetry } from "./lock.js";
import type { RedisClient } from "../index.js";
import type { Logger } from "pino";

describe("Redis Lock", () => {
  let mockRedis: RedisClient;
  let mockLogger: Logger;

  beforeEach(() => {
    mockRedis = {
      set: vi.fn(),
    } as unknown as RedisClient;

    mockLogger = {
      info: vi.fn(),
    } as unknown as Logger;
  });

  describe("acquireRedisLock", () => {
    it("should acquire lock when key does not exist", async () => {
      vi.mocked(mockRedis.set).mockResolvedValue("OK");

      const result = await acquireRedisLock(mockRedis, "test-lock", 30);

      expect(result).toBe(true);
      expect(mockRedis.set).toHaveBeenCalledWith("test-lock", "In use", {
        EX: 30,
        NX: true,
      });
    });

    it("should fail to acquire lock when key already exists", async () => {
      vi.mocked(mockRedis.set).mockResolvedValue(null);

      const result = await acquireRedisLock(mockRedis, "test-lock", 30);

      expect(result).toBe(false);
      expect(mockRedis.set).toHaveBeenCalledWith("test-lock", "In use", {
        EX: 30,
        NX: true,
      });
    });

    it("should use provided expiration time", async () => {
      vi.mocked(mockRedis.set).mockResolvedValue("OK");

      await acquireRedisLock(mockRedis, "test-lock", 60);

      expect(mockRedis.set).toHaveBeenCalledWith("test-lock", "In use", {
        EX: 60,
        NX: true,
      });
    });

    it("should use different lock names", async () => {
      vi.mocked(mockRedis.set).mockResolvedValue("OK");

      await acquireRedisLock(mockRedis, "lock-1", 30);
      await acquireRedisLock(mockRedis, "lock-2", 30);

      expect(mockRedis.set).toHaveBeenCalledWith("lock-1", "In use", expect.anything());
      expect(mockRedis.set).toHaveBeenCalledWith("lock-2", "In use", expect.anything());
    });
  });

  describe("acquireRedisLockWithRetry", () => {
    beforeEach(() => {
      vi.useFakeTimers();
    });

    afterEach(() => {
      vi.useRealTimers();
    });

    it("should acquire lock immediately if available", async () => {
      vi.mocked(mockRedis.set).mockResolvedValue("OK");

      const promise = acquireRedisLockWithRetry({
        redis: mockRedis,
        lockName: "test-lock",
        maxLockTimeSeconds: 30,
        maxRetries: 3,
        timeoutAfterRetry: 1000,
        logger: mockLogger,
      });

      const result = await promise;

      expect(result).toBe(true);
      expect(mockRedis.set).toHaveBeenCalledTimes(1);
      expect(mockLogger.info).not.toHaveBeenCalled();
    });

    it("should retry and acquire lock on second attempt", async () => {
      vi.mocked(mockRedis.set).mockResolvedValueOnce(null).mockResolvedValueOnce("OK");

      const promise = acquireRedisLockWithRetry({
        redis: mockRedis,
        lockName: "test-lock",
        maxLockTimeSeconds: 30,
        maxRetries: 3,
        timeoutAfterRetry: 1000,
        logger: mockLogger,
      });

      await vi.advanceTimersByTimeAsync(1000);
      const result = await promise;

      expect(result).toBe(true);
      expect(mockRedis.set).toHaveBeenCalledTimes(2);
      expect(mockLogger.info).toHaveBeenCalledWith(
        { lockName: "test-lock" },
        expect.stringContaining("Failed to get lock"),
      );
    });

    it("should fail after all retries exhausted", async () => {
      vi.mocked(mockRedis.set).mockResolvedValue(null);

      const promise = acquireRedisLockWithRetry({
        redis: mockRedis,
        lockName: "test-lock",
        maxLockTimeSeconds: 30,
        maxRetries: 2,
        timeoutAfterRetry: 500,
        logger: mockLogger,
      });

      await vi.advanceTimersByTimeAsync(500);
      await vi.advanceTimersByTimeAsync(500);
      const result = await promise;

      expect(result).toBe(false);
      expect(mockRedis.set).toHaveBeenCalledTimes(3);
      expect(mockLogger.info).toHaveBeenCalledWith(
        { lockName: "test-lock" },
        "Failed to get lock even after retries",
      );
    });

    it("should wait correct timeout between retries", async () => {
      vi.mocked(mockRedis.set).mockResolvedValue(null);

      const promise = acquireRedisLockWithRetry({
        redis: mockRedis,
        lockName: "test-lock",
        maxLockTimeSeconds: 30,
        maxRetries: 1,
        timeoutAfterRetry: 2000,
        logger: mockLogger,
      });

      await vi.advanceTimersByTimeAsync(1000);
      expect(mockRedis.set).toHaveBeenCalledTimes(1);

      await vi.advanceTimersByTimeAsync(1000);
      await promise;

      expect(mockRedis.set).toHaveBeenCalledTimes(2);
    });

    it("should respect maxRetries parameter", async () => {
      vi.mocked(mockRedis.set).mockResolvedValue(null);

      const promise = acquireRedisLockWithRetry({
        redis: mockRedis,
        lockName: "test-lock",
        maxLockTimeSeconds: 30,
        maxRetries: 5,
        timeoutAfterRetry: 100,
        logger: mockLogger,
      });

      for (let i = 0; i < 5; i++) {
        await vi.advanceTimersByTimeAsync(100);
      }
      await promise;

      expect(mockRedis.set).toHaveBeenCalledTimes(6);
    });

    it("should work without logger", async () => {
      vi.mocked(mockRedis.set).mockResolvedValue(null);

      const promise = acquireRedisLockWithRetry({
        redis: mockRedis,
        lockName: "test-lock",
        maxLockTimeSeconds: 30,
        maxRetries: 1,
        timeoutAfterRetry: 100,
      });

      await vi.advanceTimersByTimeAsync(100);
      const result = await promise;

      expect(result).toBe(false);
      expect(mockRedis.set).toHaveBeenCalledTimes(2);
    });

    it("should acquire lock on final retry attempt", async () => {
      vi.mocked(mockRedis.set)
        .mockResolvedValueOnce(null)
        .mockResolvedValueOnce(null)
        .mockResolvedValueOnce(null)
        .mockResolvedValueOnce("OK");

      const promise = acquireRedisLockWithRetry({
        redis: mockRedis,
        lockName: "test-lock",
        maxLockTimeSeconds: 30,
        maxRetries: 3,
        timeoutAfterRetry: 100,
        logger: mockLogger,
      });

      for (let i = 0; i < 3; i++) {
        await vi.advanceTimersByTimeAsync(100);
      }
      const result = await promise;

      expect(result).toBe(true);
      expect(mockRedis.set).toHaveBeenCalledTimes(4);
    });
  });

  describe("Lock Expiration", () => {
    it("should set correct expiration for short-lived lock", async () => {
      vi.mocked(mockRedis.set).mockResolvedValue("OK");

      await acquireRedisLock(mockRedis, "short-lock", 5);

      expect(mockRedis.set).toHaveBeenCalledWith("short-lock", "In use", {
        EX: 5,
        NX: true,
      });
    });

    it("should set correct expiration for long-lived lock", async () => {
      vi.mocked(mockRedis.set).mockResolvedValue("OK");

      await acquireRedisLock(mockRedis, "long-lock", 3600);

      expect(mockRedis.set).toHaveBeenCalledWith("long-lock", "In use", {
        EX: 3600,
        NX: true,
      });
    });
  });

  describe("Concurrent Lock Attempts", () => {
    it("should handle multiple concurrent lock attempts", async () => {
      let attemptCount = 0;
      vi.mocked(mockRedis.set).mockImplementation(async () => {
        attemptCount++;
        return attemptCount === 1 ? "OK" : null;
      });

      const results = await Promise.all([
        acquireRedisLock(mockRedis, "shared-lock", 30),
        acquireRedisLock(mockRedis, "shared-lock", 30),
        acquireRedisLock(mockRedis, "shared-lock", 30),
      ]);

      expect(results.filter((r) => r)).toHaveLength(1);
      expect(results.filter((r) => !r)).toHaveLength(2);
    });
  });
});
