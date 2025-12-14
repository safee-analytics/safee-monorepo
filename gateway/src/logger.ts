import { pino } from "pino";
import type { TransportTargetOptions } from "pino";
import { fileURLToPath } from "node:url";
import { dirname, join } from "node:path";

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

/**
 * Configure error notification transports based on environment variables
 */
function getErrorTransports(): TransportTargetOptions[] {
  const transports: TransportTargetOptions[] = [];

  // Slack notifications for errors
  if (process.env.SLACK_WEBHOOK_URL) {
    transports.push({
      target: join(__dirname, "transports", "slack.transport.js"),
      level: "error",
      options: {
        webhookUrl: process.env.SLACK_WEBHOOK_URL,
        channel: process.env.SLACK_CHANNEL ?? "#dev-alerts",
        username: process.env.SLACK_USERNAME ?? "Safee Error Bot",
      },
    });
  }

  // Sentry for error tracking
  if (process.env.SENTRY_DSN) {
    transports.push({
      target: join(__dirname, "transports", "sentry.transport.js"),
      level: "error",
      options: {
        dsn: process.env.SENTRY_DSN,
        environment: process.env.NODE_ENV ?? "development",
        release: process.env.GIT_SHA ?? "unknown",
      },
    });
  }

  return transports;
}

/**
 * Create logger with error notification transports
 */
export function createLogger(name: string) {
  const errorTransports = getErrorTransports();

  // Common base configuration
  const baseConfig = {
    name,
    level: process.env.LOG_LEVEL ?? "info",
    base: { app: name },
    customLevels: { http: 27 }, // Custom level for HTTP request logging
  };

  // If we have error transports, use pino with transport
  if (errorTransports.length > 0) {
    const targets: TransportTargetOptions[] = [
      // Error notification transports
      ...errorTransports,
    ];

    // Add pino-pretty only in development
    if (process.env.NODE_ENV !== "production") {
      targets.unshift({
        target: "pino-pretty",
        level: "trace",
        options: {
          colorize: true,
          translateTime: "SYS:standard",
          ignore: "pid,hostname",
        },
      });
    }

    return pino({
      ...baseConfig,
      transport: { targets },
    });
  }

  // No error transports - use pino-pretty in dev, JSON in production
  if (process.env.NODE_ENV !== "production") {
    return pino({
      ...baseConfig,
      transport: {
        target: "pino-pretty",
        options: {
          colorize: true,
          translateTime: "SYS:standard",
          ignore: "pid,hostname",
        },
      },
    });
  }

  // Production mode without error transports - use plain JSON logging
  return pino(baseConfig);
}
