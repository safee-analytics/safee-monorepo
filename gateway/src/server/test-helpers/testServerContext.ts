import { pino } from "pino";
import { initServerContext } from "../serverContext.js";
import type { DrizzleClient, JobScheduler, RedisClient, Storage, PubSub } from "@safee/database";
import { redisConnect } from "@safee/database";
import { odoo } from "@safee/database";
const { OdooClientManager } = odoo;

export async function initTestServerContext(drizzle: DrizzleClient): Promise<RedisClient> {
  const logger = pino({ level: "silent" });
  const redis = await redisConnect();

  const mockStorage: Storage = {
    saveFile: () => Promise.reject(new Error("Mock storage - not implemented")),
    getFile: () => Promise.reject(new Error("Mock storage - not implemented")),
    fileExists: () => Promise.reject(new Error("Mock storage - not implemented")),
    deleteFile: () => Promise.reject(new Error("Mock storage - not implemented")),
    getFileMetadata: () => Promise.reject(new Error("Mock storage - not implemented")),
    listFiles: () => Promise.reject(new Error("Mock storage - not implemented")),
    getSignedUrl: () => Promise.reject(new Error("Mock storage - not implemented")),
    copyFile: () => Promise.reject(new Error("Mock storage - not implemented")),
  };

  const mockPubSub: PubSub = {
    publish: () => Promise.reject(new Error("Mock pubsub - not implemented")),
    subscribe: () => Promise.reject(new Error("Mock pubsub - not implemented")),
    createTopic: () => Promise.reject(new Error("Mock pubsub - not implemented")),
    createSubscription: () => Promise.reject(new Error("Mock pubsub - not implemented")),
    close: () => Promise.reject(new Error("Mock pubsub - not implemented")),
  };

  const mockScheduler: JobScheduler = {
    start: () => Promise.resolve(),
    stop: () => Promise.resolve(),
    scheduleJob: () => Promise.reject(new Error("Mock scheduler - not implemented")),
  } as unknown as JobScheduler;

  const odooClientManager = new OdooClientManager({
    drizzle,
    logger,
    odooConfig: { url: "http://localhost", port: 8069 },
    userProvisioningService: {} as any,
  });

  initServerContext({
    drizzle,
    redis,
    logger,
    storage: mockStorage,
    pubsub: mockPubSub,
    scheduler: mockScheduler,
    odoo: odooClientManager,
  });

  return redis;
}
