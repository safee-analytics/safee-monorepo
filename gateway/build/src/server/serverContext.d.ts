import { DrizzleClient, RedisClient } from "@safee/database";
import { Logger } from "pino";
export interface ServerContext {
    drizzle: DrizzleClient;
    logger: Logger;
    redis: RedisClient;
}
export declare function initServerContext(context: ServerContext): void;
export declare function getServerContext(): ServerContext;
