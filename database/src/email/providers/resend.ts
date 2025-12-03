import { Resend } from "resend";
import type { EmailProvider, EmailMessage, EmailResult, EmailAddress } from "../types.js";

export interface ResendEmailConfig {
  apiKey: string;
  senderAddress: string;
  senderName?: string;
}

export class ResendEmailProvider implements EmailProvider {
  private client: Resend;
  private defaultFrom: EmailAddress;

  constructor(config: ResendEmailConfig) {
    this.client = new Resend(config.apiKey);
    this.defaultFrom = {
      email: config.senderAddress,
      name: config.senderName ?? "Safee Analytics",
    };
  }

  async sendEmail(message: EmailMessage): Promise<EmailResult> {
    if (!message.html && !message.text) {
      throw new Error("Email must have either HTML or text content");
    }

    const from = `${message.from.name ?? this.defaultFrom.name} <${message.from.email}>`;

    const emailOptions = {
      from,
      to: message.to.map((addr) => (addr.name ? `${addr.name} <${addr.email}>` : addr.email)),
      subject: message.subject,
      template: undefined,
      react: undefined,
      ...(message.cc && {
        cc: message.cc.map((addr) => (addr.name ? `${addr.name} <${addr.email}>` : addr.email)),
      }),
      ...(message.bcc && {
        bcc: message.bcc.map((addr) => (addr.name ? `${addr.name} <${addr.email}>` : addr.email)),
      }),
      ...(message.replyTo && {
        replyTo: message.replyTo.name
          ? `${message.replyTo.name} <${message.replyTo.email}>`
          : message.replyTo.email,
      }),
      ...(message.html && { html: message.html }),
      ...(message.text && { text: message.text }),
      ...(message.attachments && {
        attachments: message.attachments.map((att) => ({
          filename: att.filename,
          content: Buffer.isBuffer(att.content) ? att.content : Buffer.from(att.content),
        })),
      }),
      ...(message.headers && { headers: message.headers }),
    };

    const result = await this.client.emails.send(emailOptions);

    if (result.error) {
      throw new Error(`Resend API error: ${result.error.message}`);
    }

    return {
      messageId: result.data.id,
      accepted: message.to.map((addr) => addr.email),
      rejected: [],
    };
  }

  async validateConfig(): Promise<boolean> {
    try {
      // Try to get API key info to validate
      return !!this.client;
    } catch {
      return false;
    }
  }
}
