import { pino, type Logger, TransportTargetOptions } from "pino";
import { fileURLToPath } from "node:url";
import { dirname, join } from "node:path";
import * as Sentry from "@sentry/node";

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

function getErrorTransports(): TransportTargetOptions[] {
  const transports: TransportTargetOptions[] = [];

  // Slack notifications for errors
  if (process.env.SLACK_WEBHOOK_URL) {
    transports.push({
      target: join(__dirname, "transports", "slack.transport.js"),
      level: "error",
      options: {
        webhookUrl: process.env.SLACK_WEBHOOK_URL,
        channel: process.env.SLACK_CHANNEL ?? "#errors",
        username: process.env.SLACK_USERNAME ?? "Safee Error Bot",
      },
    });
  }

  return transports;
}

export function createLogger(name: string): Logger {
  const errorTransports = getErrorTransports();

  const baseConfig = {
    name,
    level: process.env.LOG_LEVEL ?? "info",
    hooks: {
      logMethod(this: Logger, args: unknown[], method: (...args: unknown[]) => void) {
        const firstArg = args[0];

        if (
          firstArg &&
          typeof firstArg === "object" &&
          "level" in firstArg &&
          typeof firstArg.level === "number" &&
          firstArg.level >= 50
        ) {
          // Extract properties with proper type checking
          const msg = "msg" in firstArg && typeof firstArg.msg === "string" ? firstArg.msg : undefined;
          const err = "err" in firstArg && firstArg.err instanceof Error ? firstArg.err : undefined;
          const jobId =
            "jobId" in firstArg && typeof firstArg.jobId === "string" ? firstArg.jobId : undefined;
          const organizationId =
            "organizationId" in firstArg && typeof firstArg.organizationId === "string"
              ? firstArg.organizationId
              : undefined;

          if (err) {
            // Capture the error with additional context
            Sentry.captureException(err, {
              level: firstArg.level >= 60 ? "fatal" : "error",
              tags: {
                service: name,
                ...(jobId && { jobId }),
                ...(organizationId && { organizationId }),
              },
              extra: {
                ...(msg && { msg }),
                ...firstArg,
              },
            });
          } else if (msg) {
            // Capture message if no error object
            Sentry.captureMessage(msg, {
              level: firstArg.level >= 60 ? "fatal" : "error",
              tags: {
                service: name,
                ...(jobId && { jobId }),
                ...(organizationId && { organizationId }),
              },
              extra: firstArg,
            });
          }
        }

        return method.apply(this, args);
      },
    },
  };

  // If we have error transports, use pino with transport
  if (errorTransports.length > 0) {
    return pino({
      ...baseConfig,
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
