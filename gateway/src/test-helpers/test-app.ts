import { Application } from "express";
import { connect, redisConnect, InMemoryPubSub , JobScheduler , FileSystemStorage  } from "@safee/database";
import { pino, type Logger } from "pino";
import { server } from "../server/index.js";

export interface TestApp {
  app: Application;
  cleanup: () => Promise<void>;
}

/**
 * Create a test Express app with real test dependencies
 */
export async function createTestApp(): Promise<TestApp> {
  const TEST_DATABASE_URL = process.env.DATABASE_URL ?? "postgresql://safee:safee@localhost:45432/safee";
  const TEST_REDIS_URL = process.env.REDIS_URL ?? "redis://localhost:46379";

  // Create test logger (silent for tests)
  const logger: Logger<"http"> = pino({ level: "silent" });

  // Connect to test database
  const { drizzle, close: closeDb } = connect("gateway-test-app", TEST_DATABASE_URL);

  // Connect to test Redis
  const redis = await redisConnect(TEST_REDIS_URL);

  // Create test storage (uses local filesystem for tests)
  const storage = new FileSystemStorage("test-storage", "test-bucket");

  // Create test pubsub
  const pubsub = new InMemoryPubSub({});

  // Create test scheduler
  const scheduler = new JobScheduler({
    pubsub,
    topics: {
      jobQueue: "test-job-queue",
      jobEvents: "test-job-events",
    },
  });

  // Initialize the server
  const app = await server({
    logger,
    redis,
    drizzle,
    storage,
    pubsub,
    scheduler,
  });

  const cleanup = async () => {
    await scheduler.stop();
    await pubsub.close();
    await redis.quit();
    await closeDb();
  };

  return { app, cleanup };
}
