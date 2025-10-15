import { z } from "zod";

export const EmailAddressSchema = z.object({
  email: z.email(),
  name: z.string().optional(),
});

export const EmailAttachmentSchema = z.object({
  filename: z.string(),
  content: z.union([z.string(), z.instanceof(Buffer)]),
  contentType: z.string(),
});

export const EmailMessageSchema = z.object({
  to: z.array(EmailAddressSchema).min(1),
  cc: z.array(EmailAddressSchema).optional(),
  bcc: z.array(EmailAddressSchema).optional(),
  from: EmailAddressSchema,
  replyTo: EmailAddressSchema.optional(),
  subject: z.string().min(1),
  html: z.string().optional(),
  text: z.string().optional(),
  attachments: z.array(EmailAttachmentSchema).optional(),
  headers: z.record(z.string(), z.string()).optional(),
});

export const EmailResultSchema = z.object({
  messageId: z.string(),
  accepted: z.array(z.string()),
  rejected: z.array(z.string()),
});

export type EmailAddress = z.infer<typeof EmailAddressSchema>;
export type EmailAttachment = z.infer<typeof EmailAttachmentSchema>;
export type EmailMessage = z.infer<typeof EmailMessageSchema>;
export type EmailResult = z.infer<typeof EmailResultSchema>;

export interface EmailProvider {
  sendEmail(message: EmailMessage): Promise<EmailResult>;
  validateConfig(): Promise<boolean>;
}
