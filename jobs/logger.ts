import pino from "pino";
import type { TransportTargetOptions } from "pino";

/**
 * Configure error notification transports based on environment variables
 */
function getErrorTransports(): TransportTargetOptions[] {
  const transports: TransportTargetOptions[] = [];

  // Slack notifications for errors
  if (process.env.SLACK_WEBHOOK_URL) {
    transports.push({
      target: "./transports/slack.transport.js",
      level: "error",
      options: {
        webhookUrl: process.env.SLACK_WEBHOOK_URL,
        channel: process.env.SLACK_CHANNEL || "#errors",
        username: process.env.SLACK_USERNAME || "Safee Error Bot",
      },
    });
  }

  // Sentry for error tracking
  if (process.env.SENTRY_DSN) {
    transports.push({
      target: "./transports/sentry.transport.js",
      level: "error",
      options: {
        dsn: process.env.SENTRY_DSN,
        environment: process.env.NODE_ENV || "development",
        release: process.env.GIT_SHA || "unknown",
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

  // If we have error transports, use pino with transport
  if (errorTransports.length > 0) {
    return pino({
      name,
      level: process.env.LOG_LEVEL || "info",
      transport: {
        targets: [
          // Console output (always enabled)
          {
            target: "pino-pretty",
            level: "trace",
            options: {
              colorize: true,
              translateTime: "SYS:standard",
              ignore: "pid,hostname",
            },
          },
          // Error notification transports
          ...errorTransports,
        ],
      },
    });
  }

  // No error transports - just use basic logger
  return pino({
    name,
    level: process.env.LOG_LEVEL || "info",
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
