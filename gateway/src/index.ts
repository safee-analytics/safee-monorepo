import { connect, redisConnect, getStorage, getDefaultPubSub, JobScheduler } from "@safee/database";
import { QueueManager } from "@safee/jobs";
import { startServer } from "./server/index.js";
import { createLogger } from "./logger.js";

export * from "./server/services/password.js";
export * from "./server/errors.js";
export * from "./test-helpers/test-app.js";

// Create logger with error notification transports (Slack, Sentry)
const logger = createLogger("gateway");

async function main() {
  const { drizzle } = connect("gateway");
  const redis = await redisConnect();

  const storage = getStorage("safee-storage");
  const pubsub = getDefaultPubSub();

  // Initialize QueueManager for BullMQ job processing
  const queueManager = new QueueManager();

  const scheduler = new JobScheduler({
    queueManager,
  });

  const { httpServer, wsService } = await startServer({ logger, drizzle, redis, storage, pubsub, scheduler, queueManager });

  return async () => {
    logger.info("Cleaning up resources");

    await wsService.shutdown();
    logger.info("WebSocket server closed");

    await new Promise<void>((resolve) => {
      httpServer.close(() => {
        resolve();
      });
    });
    logger.info("HTTP server closed");

    await scheduler.stop();
    logger.info("Job scheduler stopped");

    await queueManager.close();
    logger.info("Queue manager closed");

    await redis.quit();
    logger.info("Redis connection closed");
  };
}

if (import.meta.url === `file://${process.argv[1]}`) {
  let cleanup: (() => Promise<void>) | null = null;

  void main()
    .then((cleanupFn) => {
      cleanup = cleanupFn;
    })
    .catch((err: unknown) => {
      logger.error(err, "Error starting server");
      process.exit(1);
    });

  process.on("unhandledRejection", (err: unknown) => {
    logger.debug({ err }, "Unhandled promise rejection");
  });

  process.on("SIGINT", () => {
    void (async () => {
      logger.info("Received SIGINT, shutting down gracefully");
      if (cleanup) {
        await cleanup();
      }
      logger.info("Exiting");
      process.exit(0);
    })();
  });

  process.on("SIGTERM", () => {
    void (async () => {
      logger.info("Received SIGTERM, shutting down gracefully");
      if (cleanup) {
        await cleanup();
      }
      logger.info("Exiting");
      process.exit(0);
    })();
  });
}
