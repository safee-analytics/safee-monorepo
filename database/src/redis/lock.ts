import { RedisClient } from "../index.js";
import type { Logger } from "pino";

export async function acquireRedisLock(client: RedisClient, lockName: string, maxLockTimeSeconds: number) {
  const result = await client.set(lockName, "In use", {
    EX: maxLockTimeSeconds,
    NX: true, // Only set the key if it does not already exist.
  });
  return result !== null;
}

export async function acquireRedisLockWithRetry({
  redis,
  lockName,
  maxLockTimeSeconds,
  maxRetries,
  timeoutAfterRetry,
  logger,
}: {
  redis: RedisClient;
  lockName: string;
  maxLockTimeSeconds: number; // the lock will automatically expire after this many seconds
  maxRetries: number;
  timeoutAfterRetry: number;
  logger?: Logger;
}) {
  const lockGranted = await acquireRedisLock(redis, lockName, maxLockTimeSeconds);
  if (lockGranted) return true;

  for (let i = 0; i < maxRetries; i++) {
    logger?.info({ lockName }, "Failed to get lock, sleeping then retrying");
    await new Promise((f) => setTimeout(f, timeoutAfterRetry));
    const lockGranted = await acquireRedisLock(redis, lockName, maxLockTimeSeconds);
    if (lockGranted) return true;
  }

  logger?.info({ lockName }, "Failed to get lock even after retries");
  return false;
}
