import { redisConnect } from "./redis/connect.js";
import { sql } from "drizzle-orm";
import type { Column } from "drizzle-orm";

export * from "./errors.js";
export * from "./drizzle.js";
export * from "./deps.js";
export type { Locale, DocumentType } from "./drizzle/_common.js";
export { CASE_STATUSES, CASE_PRIORITIES } from "./drizzle/_common.js";
export type RedisClient = Awaited<ReturnType<typeof redisConnect>>;

export function conditionalCount(column: Column, value: unknown) {
  return sql<string>`count(case when ${column} = ${value} then 1 end)`;
}

export * from "./redis/connect.js";
export * from "./redis/lock.js";
export * from "./redis/rateLimit.js";
export * from "./redis/cacheFunctionCall.js";

export * from "./storage/index.js";

export * from "./pubsub/index.js";

export * from "./jobs/index.js";

export * from "./scheduler/jobScheduler.js";

export * from "./users/index.js";

export * from "./sessions/index.js";

export * from "./cases/index.js";

export * from "./approvals.js";

export * from "./auditLogs/auditLogs.js";

export * from "./general-utils/i18n.js";

export * from "./email/index.js";

export * from "./test-helpers/integration-setup.js";
