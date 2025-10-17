import { z } from "zod";

export const EmailAddressSchema = z.object({
  email: z.string().email(),
  name: z.string().optional(),
});

export const EmailAttachmentSchema = z.object({
  filename: z.string(),
  content: z.union([z.string(), z.instanceof(Buffer)]),
  contentType: z.string(),
});

export const EmailJobPayloadSchema = z
  .object({
    to: z.array(EmailAddressSchema).min(1),
    cc: z.array(EmailAddressSchema).optional(),
    bcc: z.array(EmailAddressSchema).optional(),
    subject: z.string().min(1).optional(),
    html: z.string().optional(),
    text: z.string().optional(),
    template: z
      .object({
        name: z.enum(["welcome", "password_reset", "invoice"]),
        data: z.record(z.string(), z.unknown()),
      })
      .optional(),
    attachments: z.array(EmailAttachmentSchema).optional(),
    locale: z.enum(["en", "ar"]).optional(),
    priority: z.enum(["low", "normal", "high"]).optional(),
  })
  .refine((data) => data.template ?? data.subject ?? data.html ?? data.text, {
    message: "Email must have either a template, or both subject and content (html or text)",
  });

export type EmailAddress = z.infer<typeof EmailAddressSchema>;
export type EmailAttachment = z.infer<typeof EmailAttachmentSchema>;
export type EmailJobPayload = z.infer<typeof EmailJobPayloadSchema>;

// Message type that will be sent to database email service
export interface EmailMessage {
  to: EmailAddress[];
  cc?: EmailAddress[];
  bcc?: EmailAddress[];
  from: EmailAddress;
  replyTo?: EmailAddress;
  subject: string;
  html?: string;
  text?: string;
  attachments?: EmailAttachment[];
  headers?: Record<string, string>;
}
