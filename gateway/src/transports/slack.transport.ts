import build from "pino-abstract-transport";

interface SlackOptions {
  webhookUrl: string;
  channel: string;
  username: string;
}

interface LogObject {
  level: number;
  time: number;
  name?: string;
  msg?: string;
  jobId?: string;
  err?: {
    message?: string;
    stack?: string;
  };
}

/**
 * Pino transport that sends error logs to Slack
 */
export default async function (opts: SlackOptions) {
  return build(async function (source) {
    for await (const obj of source) {
      const logObj = obj as LogObject;
      // Only process error and fatal levels
      if (logObj.level < 50) continue; // 50 = error, 60 = fatal

      try {
        const color = logObj.level >= 60 ? "#ff0000" : "#ff9900"; // red for fatal, orange for error
        const levelText = logObj.level >= 60 ? "FATAL" : "ERROR";

        const payload = {
          channel: opts.channel,
          username: opts.username,
          attachments: [
            {
              color,
              title: `${levelText}: ${logObj.msg ?? "Unknown error"}`,
              fields: [
                {
                  title: "Service",
                  value: logObj.name ?? "unknown",
                  short: true,
                },
                {
                  title: "Time",
                  value: new Date(logObj.time).toISOString(),
                  short: true,
                },
                ...(logObj.err
                  ? [
                      {
                        title: "Error",
                        value: `\`\`\`${logObj.err.message ?? ""}\n${logObj.err.stack ?? ""}\`\`\``,
                        short: false,
                      },
                    ]
                  : []),
                ...(logObj.jobId
                  ? [
                      {
                        title: "Job ID",
                        value: logObj.jobId,
                        short: true,
                      },
                    ]
                  : []),
              ],
              footer: "Safee Error Notification",
              ts: Math.floor(logObj.time / 1000),
            },
          ],
        };

        await fetch(opts.webhookUrl, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload),
        });
      } catch (err) {
        // Don't crash if Slack notification fails
        // eslint-disable-next-line no-console
        console.error("Failed to send Slack notification:", err);
      }
    }
  });
}
