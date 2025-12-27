import { DrizzleClient, RedisClient, Storage, PubSub, JobScheduler, odoo } from "@safee/database";
import type { QueueManager } from "@safee/jobs";
import { Logger } from "pino";
import { OperationFailed } from "./errors.js";

export interface ServerContext {
  drizzle: DrizzleClient;
  logger: Logger;
  redis: RedisClient;
  storage: Storage;
  pubsub: PubSub;
  scheduler: JobScheduler;
  queueManager: QueueManager;
  odoo: odoo.OdooClientManager;
}

let instance: ServerContext | undefined = undefined;
export function initServerContext(context: ServerContext) {
  instance = context;
}
export function getServerContext() {
  if (instance === undefined) throw new OperationFailed("No previous call to 'initServerContext'");
  return instance;
}
export function getQueueManager() {
  return getServerContext().queueManager;
}
