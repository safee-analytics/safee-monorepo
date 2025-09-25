import { redisConnect } from "./redis/connect.js";
import { sql } from "drizzle-orm";
import type { Column } from "drizzle-orm";

export * from "./errors.js";
export * from "./drizzle.js";
export * from "./deps.js";
export {} from "./drizzle/_common.js";
export type RedisClient = Awaited<ReturnType<typeof redisConnect>>;

// SQL helper functions
export function conditionalCount(column: Column, value: unknown) {
  return sql<number>`count(case when ${column} = ${value} then 1 end)`;
}

// Redis
export * from "./redis/connect.js";
export * from "./redis/lock.js";
export * from "./redis/rateLimit.js";
export * from "./redis/cacheFunctionCall.js";

// Storage
export * from "./storage/index.js";

// Pub/Sub
export * from "./pubsub/index.js";

// Jobs
export * from "./jobs/index.js";

// Job Scheduler
export * from "./scheduler/jobScheduler.js";

// Users
export * from "./users/index.js";
