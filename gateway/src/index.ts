import { pino } from "pino";
import { connect, redisConnect, getStorage, getDefaultPubSub, JobScheduler } from "@safee/database";
import { LOG_LEVEL } from "./env.js";
import { server } from "./server/index.js";

const logger = pino({
  level: LOG_LEVEL,
  base: { app: "gateway" },
  customLevels: { http: 27 },
});

async function main() {
  try {
    const { drizzle, pool } = connect("gateway");
    const redis = await redisConnect();

    // Initialize storage and pubsub
    const storage = getStorage("safee-storage");
    const pubsub = getDefaultPubSub();

    // Initialize job scheduler
    const scheduler = new JobScheduler({
      pubsub,
      topics: {
        jobQueue: "safee-job-queue",
        jobEvents: "safee-job-events",
      },
    });

    const apps = [];

    apps.push(
      server({ logger, drizzle, redis, pool, storage, pubsub, scheduler }).catch((err: unknown) => {
        logger.error(err);
      }),
    );

    await Promise.all(apps);
  } catch (err) {
    logger.error(err, "Error reached top level");
  }
}

void main();

process.on("unhandledRejection", (err) => {
  logger.debug(err, "Unhandled promise rejection");
});
