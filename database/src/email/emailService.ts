import type { Logger } from "pino";
import type { DrizzleClient } from "../drizzle.js";
import type { EmailProvider, EmailMessage, EmailAddress } from "./types.js";
import { shouldSendEmail } from "./bounceService.js";

export interface EmailServiceDeps {
  drizzle: DrizzleClient;
  logger: Logger;
  emailProvider?: EmailProvider;
}

export class EmailService {
  private deps: EmailServiceDeps;
  private defaultFrom: EmailAddress;

  constructor(deps: EmailServiceDeps) {
    this.deps = deps;
    this.defaultFrom = {
      email: process.env.EMAIL_FROM_ADDRESS ?? "noreply@safee.local",
      name: process.env.EMAIL_FROM_NAME ?? "Safee Analytics",
    };
  }

  async sendEmail(message: EmailMessage): Promise<void> {
    const { logger, emailProvider, drizzle } = this.deps;

    if (!emailProvider) {
      logger.warn("No email provider configured, skipping email send");
      return;
    }

    // Check for bounces before sending
    for (const recipient of message.to) {
      const canSend = await shouldSendEmail({ drizzle, logger }, recipient.email);
      if (!canSend) {
        logger.warn({ email: recipient.email }, "Skipping email send due to previous bounce or unsubscribe");
        return;
      }
    }

    try {
      const result = await emailProvider.sendEmail(message);

      logger.info(
        {
          messageId: result.messageId,
          to: message.to,
          accepted: result.accepted,
          rejected: result.rejected,
        },
        "Email sent successfully",
      );
    } catch (err) {
      logger.error({ error: err, message }, "Failed to send email");
      throw err;
    }
  }
}
