import { Logger } from "pino";
import { DrizzleClient } from "./drizzle.js";

export type DbDeps = {
  drizzle: DrizzleClient;
  logger: Logger;
};
