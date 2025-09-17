import { DrizzleClient, RedisClient } from "@safee/database";
import { Logger } from "pino";

export interface ServerContext {
  drizzle: DrizzleClient;
  logger: Logger;
  redis: RedisClient;
}

let instance: ServerContext | undefined = undefined;
export function initServerContext(context: ServerContext) {
  instance = context;
}
export function getServerContext() {
  if (instance === undefined) throw new Error("No previous call to 'initServerSingletons'");
  return instance;
}
