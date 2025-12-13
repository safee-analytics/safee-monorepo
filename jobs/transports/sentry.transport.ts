import build from "pino-abstract-transport";

interface SentryOptions {
  dsn: string;
  environment: string;
  release: string;
}

/**
 * Pino transport that sends error logs to Sentry
 * Uses Sentry's HTTP API directly (no SDK needed)
 */
export default async function (opts: SentryOptions) {
  // Parse DSN to get project info
  const dsnMatch = opts.dsn.match(/https:\/\/([^@]+)@([^/]+)\/(\d+)/);
  if (!dsnMatch) {
    console.error("Invalid Sentry DSN format");
    return build(async function (source) {
      for await (const obj of source) {
        // Do nothing if DSN is invalid
      }
    });
  }

  const [, publicKey, host, projectId] = dsnMatch;
  const sentryUrl = `https://${host}/api/${projectId}/store/`;

  return build(async function (source) {
    for await (const obj of source) {
      // Only process error and fatal levels
      if (obj.level < 50) continue;

      try {
        const level = obj.level >= 60 ? "fatal" : "error";

        const event = {
          event_id: crypto.randomUUID().replace(/-/g, ""),
          timestamp: new Date(obj.time).toISOString(),
          platform: "node",
          level,
          logger: obj.name || "pino",
          message: obj.msg || "Unknown error",
          environment: opts.environment,
          release: opts.release,
          server_name: process.env.HOSTNAME || "unknown",
          tags: {
            service: obj.name || "unknown",
            jobId: obj.jobId,
            organizationId: obj.organizationId,
          },
          extra: {
            ...obj,
            // Don't duplicate these fields
            msg: undefined,
            level: undefined,
            time: undefined,
          },
          ...(obj.err && {
            exception: {
              values: [
                {
                  type: obj.err.type || "Error",
                  value: obj.err.message,
                  stacktrace: {
                    frames: parseStackTrace(obj.err.stack),
                  },
                },
              ],
            },
          }),
        };

        await fetch(sentryUrl, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            "X-Sentry-Auth": `Sentry sentry_version=7, sentry_key=${publicKey}, sentry_client=safee-pino/1.0.0`,
          },
          body: JSON.stringify(event),
        });
      } catch (error) {
        console.error("Failed to send Sentry notification:", error);
      }
    }
  });
}

/**
 * Parse stack trace string into Sentry frame format
 */
function parseStackTrace(stack?: string): Array<{ filename: string; function: string; lineno: number }> {
  if (!stack) return [];

  const frames = stack
    .split("\n")
    .slice(1) // Skip first line (error message)
    .map((line) => {
      const match = line.match(/at\s+(.+?)\s+\((.+?):(\d+):\d+\)/);
      if (!match) return null;

      return {
        filename: match[2],
        function: match[1],
        lineno: parseInt(match[3]),
      };
    })
    .filter((frame): frame is NonNullable<typeof frame> => frame !== null)
    .reverse(); // Sentry wants frames in reverse order

  return frames;
}
