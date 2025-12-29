import { pino } from "pino";
import { initServerContext, type ServerContext } from "../serverContext.js";
import type { DrizzleClient, JobScheduler, Storage, PubSub } from "@safee/database";
import { redisConnect, odoo, EncryptionService } from "@safee/database";
import type { QueueManager } from "@safee/jobs";
const { OdooClientManager, OdooUserProvisioningService } = odoo;

export async function initTestServerContext(drizzle: DrizzleClient): Promise<ServerContext> {
  const logger = pino({ level: "silent" });
  const redis = await redisConnect();

  // Real encryption service for testing
  const encryptionService = new EncryptionService("test-encryption-secret-for-testing");

  // Test storage implementation
  const testStorage: Storage = {
    saveFile: async () => {
      return { key: "test-key", bucket: "test-bucket", url: "test-url" };
    },
    getFile: async () => {
      return Buffer.from("test-content");
    },
    fileExists: async () => {
      return false;
    },
    deleteFile: async () => {},
    getFileMetadata: async () => {
      return {
        key: "test-key",
        bucket: "test-bucket",
        url: "test-url",
        size: 0,
        lastModified: new Date(),
      };
    },
    listFiles: async () => {
      return [];
    },
    getSignedUrl: async () => {
      return "test-signed-url";
    },
    copyFile: async () => {
      return { key: "test-key", bucket: "test-bucket", url: "test-url" };
    },
  };

  // Test PubSub implementation
  const testPubSub: PubSub = {
    publish: async () => {
      return "test-message-id";
    },
    subscribe: async () => {},
    createTopic: async () => {},
    createSubscription: async () => {},
    close: async () => {},
  };

  // Test scheduler implementation
  const testScheduler: JobScheduler = {
    start: async () => {},
    stop: async () => {},
    scheduleJob: async () => {
      return "test-job-id";
    },
  } as unknown as JobScheduler;

  // Test queue manager implementation
  const testQueueManager: QueueManager = {
    addJob: async () => {
      return { id: "test-job-id" } as never;
    },
    addJobByName: async () => {
      return { id: "test-job-id" } as never;
    },
    close: async () => {},
  } as unknown as QueueManager;

  // Real user provisioning service
  const userProvisioningService = new OdooUserProvisioningService({
    drizzle,
    logger,
    encryptionService,
    odooUrl: "http://localhost:28069",
  });

  // Real Odoo client manager
  const odooClientManager = new OdooClientManager({
    drizzle,
    logger,
    odooConfig: { url: "http://localhost", port: 28069 },
    userProvisioningService,
  });

  const context = {
    drizzle,
    redis,
    logger,
    storage: testStorage,
    pubsub: testPubSub,
    scheduler: testScheduler,
    queueManager: testQueueManager,
    odoo: odooClientManager,
  };

  initServerContext(context);

  return context;
}
