import { pino } from "pino";
import { connect, redisConnect } from "@safee/database";
import { LOG_LEVEL } from "./env.js";
import { server } from "./server/index.js";

const logger = pino({
  level: LOG_LEVEL,
  base: { app: "gateway" },
  customLevels: { http: 27 },
  useOnlyCustomLevels: false,
});

async function main() {
  try {
    const { drizzle, pool } = connect("gateway");
    const redis = await redisConnect();

    const apps = [];

    apps.push(
      server({ logger, drizzle, redis, pool }).catch((err: unknown) => {
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
