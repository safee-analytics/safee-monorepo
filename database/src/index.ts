import { redisConnect } from "./redis/connect.js";
import { sql } from "drizzle-orm";
import type { Column } from "drizzle-orm";

export * from "./errors.js";
export * from "./drizzle.js";
export * from "./deps.js";
export type {
  Locale,
  DocumentType,
  ResourceType,
  HRSectionType,
  NotificationType,
  RelatedEntityType,
} from "./drizzle/_common.js";
export { CASE_STATUSES, CASE_PRIORITIES } from "./drizzle/_common.js";
export type RedisClient = Awaited<ReturnType<typeof redisConnect>>;

export function conditionalCount(column: Column, value: unknown) {
  return sql<string>`count(case when ${column} = ${value} then 1 end)`;
}

export * from "./redis/connect.js";
export * from "./redis/lock.js";
export * from "./redis/rateLimit.js";
export * from "./redis/cacheFunctionCall.js";

export * from "./storage/index.js";

export * from "./pubsub/index.js";

export * from "./jobs/index.js";

export * from "./scheduler/jobScheduler.js";

export * from "./users/index.js";

export * from "./subscriptions/index.js";

export * from "./sessions/index.js";

export * from "./cases/index.js";

export * from "./auditPlanning/index.js";

export * from "./reports/index.js";

export * from "./collaboration/index.js";

export * from "./ocr/index.js";

export * from "./approvals.js";

export * from "./auditLogs/auditLogs.js";

export * from "./general-utils/i18n.js";

export type { EmailProvider, EmailMessage, EmailAddress, EmailResult } from "./email/types.js";
export { EmailService } from "./email/emailService.js";
export { AzureEmailProvider } from "./email/providers/azure.js";
export { ResendEmailProvider } from "./email/providers/resend.js";
export { recordEmailBounce, shouldSendEmail, getEmailBounces } from "./email/bounceService.js";

export * from "./hr/index.js";

export * from "./crm/index.js";

export * from "./accounting/index.js";

export * from "./llm/index.js";

export * as odoo from "./odoo/index.js";
export { OdooLanguage, OdooDemo } from "./odoo/client.js";
export * as generalUtils from "./general-utils/index.js";

export * from "./test-helpers/integration-setup.js";

export * from "./types/websocket.js";

export { EncryptionService, encryptionService } from "./encryption.js";
