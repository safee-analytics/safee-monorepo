import type { Logger } from "pino";
import type { RedisClient, DrizzleClient } from "@safee/database";
import pg from "pg";
type Dependencies = {
  logger: Logger<"http">;
  redis: RedisClient;
  drizzle: DrizzleClient;
  pool: pg.Pool;
};
declare module "express-session" {
  interface SessionData {
    userId: string;
    organizationId: string;
  }
}
declare global {
  namespace Express {
    interface Request {
      redis: RedisClient;
      drizzle: DrizzleClient;
      authenticatedUserId?: string;
      organizationId?: string;
      authType?: "session" | "jwt";
    }
  }
}
export declare class ApiError extends Error {
  statusCode: number;
  context?: Record<string, unknown>;
  code?: string;
  constructor(message: string, statusCode?: number, context?: Record<string, unknown>, code?: string);
}
export declare function server({ logger, redis, drizzle, pool: _pool }: Dependencies): Promise<void>;
export {};
