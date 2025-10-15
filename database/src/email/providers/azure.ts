import { EmailClient } from "@azure/communication-email";
import type { EmailProvider, EmailMessage, EmailResult, EmailAddress } from "../types.js";

export interface AzureEmailConfig {
  connectionString: string;
  senderAddress: string;
  senderName?: string;
}

export class AzureEmailProvider implements EmailProvider {
  private client: EmailClient;
  private defaultFrom: EmailAddress;

  constructor(config: AzureEmailConfig) {
    this.client = new EmailClient(config.connectionString);
    this.defaultFrom = {
      email: config.senderAddress,
      name: config.senderName ?? "Safee Analytics",
    };
  }

  async sendEmail(message: EmailMessage): Promise<EmailResult> {
    if (!message.html && !message.text) {
      throw new Error("Email must have either HTML or text content");
    }

    const content = message.html
      ? { subject: message.subject, html: message.html }
      : { subject: message.subject, plainText: message.text! };

    const emailMessage = {
      senderAddress: message.from.email,
      content,
      recipients: {
        to: message.to.map((addr) => ({
          address: addr.email,
          displayName: addr.name,
        })),
        cc: message.cc?.map((addr) => ({
          address: addr.email,
          displayName: addr.name,
        })),
        bcc: message.bcc?.map((addr) => ({
          address: addr.email,
          displayName: addr.name,
        })),
      },
      replyTo: message.replyTo
        ? [
            {
              address: message.replyTo.email,
              displayName: message.replyTo.name,
            },
          ]
        : undefined,
      attachments: message.attachments?.map((att) => ({
        name: att.filename,
        contentType: att.contentType,
        contentInBase64: Buffer.isBuffer(att.content) ? att.content.toString("base64") : att.content,
      })),
      headers: message.headers,
    };

    const poller = await this.client.beginSend(emailMessage);
    const result = await poller.pollUntilDone();

    return {
      messageId: result.id,
      accepted: message.to.map((addr) => addr.email),
      rejected: [],
    };
  }

  async validateConfig(): Promise<boolean> {
    try {
      return !!this.client;
    } catch {
      return false;
    }
  }
}
