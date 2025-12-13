import build from "pino-abstract-transport";

interface SlackOptions {
  webhookUrl: string;
  channel: string;
  username: string;
}

/**
 * Pino transport that sends error logs to Slack
 */
export default async function (opts: SlackOptions) {
  return build(async function (source) {
    for await (const obj of source) {
      // Only process error and fatal levels
      if (obj.level < 50) continue; // 50 = error, 60 = fatal

      try {
        const color = obj.level >= 60 ? "#ff0000" : "#ff9900"; // red for fatal, orange for error
        const levelText = obj.level >= 60 ? "FATAL" : "ERROR";

        const payload = {
          channel: opts.channel,
          username: opts.username,
          attachments: [
            {
              color,
              title: `${levelText}: ${obj.msg || "Unknown error"}`,
              fields: [
                {
                  title: "Service",
                  value: obj.name || "unknown",
                  short: true,
                },
                {
                  title: "Time",
                  value: new Date(obj.time).toISOString(),
                  short: true,
                },
                ...(obj.err
                  ? [
                      {
                        title: "Error",
                        value: `\`\`\`${obj.err.message}\n${obj.err.stack}\`\`\``,
                        short: false,
                      },
                    ]
                  : []),
                ...(obj.jobId
                  ? [
                      {
                        title: "Job ID",
                        value: obj.jobId,
                        short: true,
                      },
                    ]
                  : []),
              ],
              footer: "Safee Error Notification",
              ts: Math.floor(obj.time / 1000),
            },
          ],
        };

        await fetch(opts.webhookUrl, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload),
        });
      } catch (error) {
        // Don't crash if Slack notification fails
        console.error("Failed to send Slack notification:", error);
      }
    }
  });
}
