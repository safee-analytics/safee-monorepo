import { connect } from "../drizzle.js";
import { redisConnect } from "../redis/connect.js";
import { pino } from "pino";
import type { DbDeps } from "../deps.js";
import type { DrizzleClient, RedisClient } from "../index.js";

const TEST_DATABASE_URL = process.env.DATABASE_URL ?? "postgresql://safee:safee@localhost:45432/safee";
const TEST_REDIS_URL = process.env.REDIS_URL ?? "redis://localhost:16379";

export function createTestLogger() {
  return pino({ level: "silent" }); // Silent during tests
}

/**
 * Connect to test database and optionally Redis.
 * Returns drizzle client, close function, and optionally redis client.
 * Usage:
 *   const { drizzle, close, redis } = await connectTest({ withRedis: true });
 *   // ... run tests
 *   await close();
 */
export async function connectTest(options?: { withRedis?: boolean }) {
  const { drizzle, close: dbClose } = connect("safee-test", TEST_DATABASE_URL);

  let redis: RedisClient | undefined;
  if (options?.withRedis) {
    redis = (await redisConnect(TEST_REDIS_URL)) as RedisClient;
  }

  async function close() {
    if (redis) {
      await redis.quit();
    }
    await dbClose();
  }

  return { drizzle, close, redis };
}

/**
 * Create test deps (drizzle + logger) from an existing drizzle client
 */
export function createTestDeps(drizzle: DrizzleClient): DbDeps {
  return {
    drizzle,
    logger: createTestLogger(),
  };
}
