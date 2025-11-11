import type { RedisClient, DrizzleClient, Locale } from "@safee/database";
import type { Session } from "../auth/index.js";
import type { Logger } from "pino";

declare global {
  namespace Express {
    interface Request {
      redis: RedisClient;
      drizzle: DrizzleClient;

      locale: Locale;

      betterAuthSession?: Session;

      requestId: string;
      startTime: number;
      log: Logger;
    }
  }
}

export {};
