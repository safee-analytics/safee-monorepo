import pino from "pino";
const isDevelopment = process.env.NODE_ENV === "development";
export const logger = pino({
  name: "safee-api",
  level: process.env.LOG_LEVEL || (isDevelopment ? "debug" : "info"),
  transport: isDevelopment
    ? {
        target: "pino-pretty",
        options: {
          colorize: true,
          translateTime: "yyyy-mm-dd HH:MM:ss",
          ignore: "pid,hostname",
        },
      }
    : undefined,
});
//# sourceMappingURL=logger.js.map
