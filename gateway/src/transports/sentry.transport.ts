import build from "pino-abstract-transport";

interface SentryOptions {
  dsn: string;
  environment: string;
  release: string;
}

interface LogObject {
  level: number;
  time: number;
  name?: string;
  msg?: string;
  jobId?: string;
  organizationId?: string;
  err?: {
    type?: string;
    message?: string;
    stack?: string;
  };
  [key: string]: unknown;
}

export default async function (opts: SentryOptions) {
  const dsnMatch = /https:\/\/([^@]+)@([^/]+)\/(\d+)/.exec(opts.dsn);
  if (!dsnMatch) {
    // eslint-disable-next-line no-console
    console.error("Invalid Sentry DSN format");
    return build(async function (source) {
      for await (const _ of source) {
      }
    });
  }

  const [, publicKey, host, projectId] = dsnMatch;
  const sentryUrl = `https://${host}/api/${projectId}/store/`;

  return build(async function (source) {
    for await (const obj of source) {
      const logObj = obj as LogObject;
      // Only process error and fatal levels
      if (logObj.level < 50) continue;

      try {
        const level = logObj.level >= 60 ? "fatal" : "error";

        const event = {
          event_id: crypto.randomUUID().replace(/-/g, ""),
          timestamp: new Date(logObj.time).toISOString(),
          platform: "node",
          level,
          logger: logObj.name ?? "pino",
          message: logObj.msg ?? "Unknown error",
          environment: opts.environment,
          release: opts.release,
          server_name: process.env.HOSTNAME ?? "unknown",
          tags: {
            service: logObj.name ?? "unknown",
            jobId: logObj.jobId,
            organizationId: logObj.organizationId,
          },
          extra: {
            ...logObj,
            msg: undefined,
            level: undefined,
            time: undefined,
          },
          ...(logObj.err && {
            exception: {
              values: [
                {
                  type: logObj.err.type ?? "Error",
                  value: logObj.err.message,
                  stacktrace: {
                    frames: parseStackTrace(logObj.err.stack),
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
      } catch (err) {
        // eslint-disable-next-line no-console
        console.error("Failed to send Sentry notification:", err);
      }
    }
  });
}

function parseStackTrace(stack?: string): { filename: string; function: string; lineno: number }[] {
  if (!stack) return [];

  const frames = stack
    .split("\n")
    .slice(1) // Skip first line (error message)
    .map((line) => {
      const match = /at\s+(.+?)\s+\((.+?):(\d+):\d+\)/.exec(line);
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
