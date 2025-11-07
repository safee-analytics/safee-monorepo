import { pino } from "pino";
import { connect, redisConnect, getStorage, getDefaultPubSub, JobScheduler } from "@safee/database";
import { LOG_LEVEL, ENV } from "./env.js";
import { startServer } from "./server/index.js";

const isDevelopment = ENV === "local" || ENV === "development";

const logger = pino({
  level: LOG_LEVEL,
  base: { app: "gateway" },
  customLevels: { http: 27 },
  transport: isDevelopment
    ? {
        target: "pino-pretty",
        options: {
          colorize: true,
          translateTime: "HH:MM:ss",
          ignore: "pid,hostname",
          singleLine: false,
        },
      }
    : undefined,
});

async function main() {
  try {
    const { drizzle, pool } = connect("gateway");
    const redis = await redisConnect();

    const storage = getStorage("safee-storage");
    const pubsub = getDefaultPubSub();

    const scheduler = new JobScheduler({
      pubsub,
      topics: {
        jobQueue: "safee-job-queue",
        jobEvents: "safee-job-events",
      },
    });

    const apps = [];

    apps.push(
      startServer({ logger, drizzle, redis, pool, storage, pubsub, scheduler }).catch((err: unknown) => {
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
