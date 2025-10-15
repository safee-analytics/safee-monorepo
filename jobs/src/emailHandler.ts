import type { Logger } from "pino";
import type { EmailJobPayload, EmailMessage, EmailAddress } from "./emailTypes.js";
import { validateJobPayload } from "./jobPayloads.js";
import { renderTemplate } from "./emailTemplates/index.js";

export interface EmailHandlerDeps {
  logger: Logger;
  emailService: {
    sendEmail(message: EmailMessage): Promise<void>;
  };
  defaultFrom?: EmailAddress;
}

export class EmailHandler {
  private deps: EmailHandlerDeps;
  private defaultFrom: EmailAddress;

  constructor(deps: EmailHandlerDeps) {
    this.deps = deps;
    this.defaultFrom = deps.defaultFrom ?? {
      email: process.env.EMAIL_FROM_ADDRESS ?? "noreply@safee.local",
      name: process.env.EMAIL_FROM_NAME ?? "Safee Analytics",
    };
  }

  async handleEmailJob(payload: EmailJobPayload): Promise<void> {
    const { logger, emailService } = this.deps;

    try {
      const validatedPayload = validateJobPayload("send_email", payload);

      let subject: string;
      let html: string | undefined;
      let text: string | undefined;

      if (validatedPayload.template) {
        const rendered = renderTemplate(validatedPayload.template.name, {
          locale: validatedPayload.locale ?? "en",
          variables: validatedPayload.template.data as Record<string, string>,
        });
        subject = rendered.subject;
        html = rendered.html;
        text = rendered.text;
      } else {
        subject = validatedPayload.subject ?? "";
        html = validatedPayload.html;
        text = validatedPayload.text;
      }

      const message: EmailMessage = {
        to: validatedPayload.to,
        cc: validatedPayload.cc,
        bcc: validatedPayload.bcc,
        from: this.defaultFrom,
        subject,
        html,
        text,
        attachments: validatedPayload.attachments,
      };

      await emailService.sendEmail(message);

      logger.info({ to: validatedPayload.to }, "Email job completed successfully");
    } catch (err) {
      logger.error({ error: err, payload }, "Failed to handle email job");
      throw err;
    }
  }
}
