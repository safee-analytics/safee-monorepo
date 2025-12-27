import { describe, it, beforeAll, afterAll, beforeEach, expect } from "vitest";
import { Queue, Worker } from "bullmq";
import { Redis } from "ioredis";
import { pino } from "pino";
import { connectTest, nukeDatabase } from "@safee/database/test-helpers";
import { createJob, getJobById, EmailService } from "@safee/database";
import type { DrizzleClient, DbDeps } from "@safee/database";

describe("Job Worker Integration Tests", () => {
  let drizzle: DrizzleClient;
  let closeDb: () => Promise<void>;
  let redis: Redis;
  let testQueue: Queue;
  const logger = pino({ level: "silent" });
  let deps: DbDeps;

  beforeAll(async () => {
    ({ drizzle, close: closeDb } = await connectTest({ appName: "job-worker-test" }));
    deps = { drizzle, logger };

    // Connect to test Redis
    redis = new Redis(process.env.REDIS_URL ?? "redis://localhost:6379", {
      maxRetriesPerRequest: null,
      enableReadyCheck: false,
    });
  });

  afterAll(async () => {
    await redis.quit();
    await closeDb();
  });

  beforeEach(async () => {
    await nukeDatabase(drizzle);
  });

  describe("send_email job", () => {
    it("processes send_email job successfully with direct content", async () => {
      // Create a mock email provider that tracks calls
      const sentEmails: any[] = [];
      const mockEmailProvider = {
        sendEmail: async (message: any) => {
          sentEmails.push(message);
          return {
            messageId: "test-message-id",
            accepted: message.to.map((addr: any) => addr.email),
            rejected: [],
          };
        },
        validateConfig: async () => true,
      };

      // Create email service with mock provider
      const emailService = new EmailService({
        drizzle,
        logger,
        emailProvider: mockEmailProvider,
      });

      // Simulate the send_email processor logic
      const jobData = {
        type: "send_email",
        to: [{ email: "test@example.com", name: "Test User" }],
        subject: "Test Email",
        html: "<p>This is a test email</p>",
        text: "This is a test email",
        locale: "en",
      };

      await emailService.sendEmail({
        to: jobData.to,
        from: { email: "noreply@safee.local", name: "Safee Analytics" },
        subject: jobData.subject,
        html: jobData.html,
        text: jobData.text,
      });

      expect(sentEmails.length).toBe(1);
      expect(sentEmails[0].to).toEqual([{ email: "test@example.com", name: "Test User" }]);
      expect(sentEmails[0].subject).toBe("Test Email");
      expect(sentEmails[0].html).toBe("<p>This is a test email</p>");
    });

    it("processes send_email job with template rendering", async () => {
      const sentEmails: any[] = [];
      const mockEmailProvider = {
        sendEmail: async (message: any) => {
          sentEmails.push(message);
          return {
            messageId: "test-message-id",
            accepted: message.to.map((addr: any) => addr.email),
            rejected: [],
          };
        },
        validateConfig: async () => true,
      };

      const emailService = new EmailService({
        drizzle,
        logger,
        emailProvider: mockEmailProvider,
      });

      // Import template renderer
      const { renderTemplate } = await import("./emailTemplates/index.js");

      const jobData = {
        type: "send_email",
        to: [{ email: "test@example.com", name: "Test User" }],
        template: {
          name: "welcome",
          variables: {
            userName: "John Doe",
            companyName: "Acme Corp",
            loginUrl: "https://example.com/login",
          },
        },
        locale: "en",
      };

      const rendered = renderTemplate(jobData.template.name as any, {
        locale: jobData.locale as any,
        variables: jobData.template.variables,
      });

      await emailService.sendEmail({
        to: jobData.to,
        from: { email: "noreply@safee.local", name: "Safee Analytics" },
        subject: rendered.subject,
        html: rendered.html,
        text: rendered.text,
      });

      expect(sentEmails.length).toBe(1);
      expect(sentEmails[0].subject).toContain("Welcome");
      expect(sentEmails[0].html).toContain("John Doe");
    });

    it("rejects email with invalid schema", async () => {
      const { SendEmailJobSchema } = await import("./queues/job-schemas.js");

      const invalidJobData = {
        type: "send_email",
        // Missing required 'to' field
        subject: "Test",
      };

      expect(() => SendEmailJobSchema.parse(invalidJobData)).toThrow();
    });

    it("requires either template or subject+content", async () => {
      const { SendEmailJobSchema } = await import("./queues/job-schemas.js");

      const invalidJobData = {
        type: "send_email",
        to: [{ email: "test@example.com" }],
        // Missing both template and subject/content
      };

      expect(() => SendEmailJobSchema.parse(invalidJobData)).toThrow(/Must provide either template or subject/);
    });
  });

  describe("rotate_encryption_key job", () => {
    it("validates rotate_encryption_key job schema", async () => {
      const { RotateEncryptionKeyJobSchema } = await import("./queues/job-schemas.js");

      const validJobData = {
        type: "rotate_encryption_key",
        organizationId: "123e4567-e89b-12d3-a456-426614174000",
        rotatedBy: "123e4567-e89b-12d3-a456-426614174001",
      };

      const parsed = RotateEncryptionKeyJobSchema.parse(validJobData);
      expect(parsed.type).toBe("rotate_encryption_key");
      expect(parsed.organizationId).toBe("123e4567-e89b-12d3-a456-426614174000");
    });

    it("rejects invalid UUIDs in rotate_encryption_key", async () => {
      const { RotateEncryptionKeyJobSchema } = await import("./queues/job-schemas.js");

      const invalidJobData = {
        type: "rotate_encryption_key",
        organizationId: "not-a-uuid",
        rotatedBy: "also-not-a-uuid",
      };

      expect(() => RotateEncryptionKeyJobSchema.parse(invalidJobData)).toThrow();
    });
  });

  describe("encrypt_file job", () => {
    it("validates encrypt_file job schema", async () => {
      const { EncryptFileJobSchema } = await import("./queues/job-schemas.js");

      const validJobData = {
        type: "encrypt_file",
        fileId: "123e4567-e89b-12d3-a456-426614174000",
        organizationId: "123e4567-e89b-12d3-a456-426614174001",
        encryptedBy: "123e4567-e89b-12d3-a456-426614174002",
      };

      const parsed = EncryptFileJobSchema.parse(validJobData);
      expect(parsed.type).toBe("encrypt_file");
      expect(parsed.fileId).toBe("123e4567-e89b-12d3-a456-426614174000");
    });

    it("rejects encrypt_file with missing fields", async () => {
      const { EncryptFileJobSchema } = await import("./queues/job-schemas.js");

      const invalidJobData = {
        type: "encrypt_file",
        fileId: "123e4567-e89b-12d3-a456-426614174000",
        // Missing organizationId and encryptedBy
      };

      expect(() => EncryptFileJobSchema.parse(invalidJobData)).toThrow();
    });
  });

  describe("analytics job", () => {
    it("validates calculate_dashboard_metrics job schema", async () => {
      const { AnalyticsJobSchema } = await import("./queues/job-schemas.js");

      const validJobData = {
        type: "calculate_dashboard_metrics",
        organizationId: "123e4567-e89b-12d3-a456-426614174000",
        dateRange: {
          start: "2024-01-01T00:00:00Z",
          end: "2024-01-31T23:59:59Z",
        },
      };

      const parsed = AnalyticsJobSchema.parse(validJobData);
      expect(parsed.type).toBe("calculate_dashboard_metrics");
    });

    it("validates aggregate_case_statistics job schema", async () => {
      const { AnalyticsJobSchema } = await import("./queues/job-schemas.js");

      const validJobData = {
        type: "aggregate_case_statistics",
        caseId: "123e4567-e89b-12d3-a456-426614174000",
        organizationId: "123e4567-e89b-12d3-a456-426614174001",
      };

      const parsed = AnalyticsJobSchema.parse(validJobData);
      expect(parsed.type).toBe("aggregate_case_statistics");
    });
  });

  describe("email queue (bulk)", () => {
    it("validates send_transactional job schema", async () => {
      const { EmailJobSchema } = await import("./queues/job-schemas.js");

      const validJobData = {
        type: "send_transactional",
        to: "user@example.com",
        template: "invoice",
        data: { invoiceNumber: "INV-001", amount: "100.00" },
        organizationId: "123e4567-e89b-12d3-a456-426614174000",
      };

      const parsed = EmailJobSchema.parse(validJobData);
      expect(parsed.type).toBe("send_transactional");
    });

    it("validates send_notification job schema", async () => {
      const { EmailJobSchema } = await import("./queues/job-schemas.js");

      const validJobData = {
        type: "send_notification",
        userId: "123e4567-e89b-12d3-a456-426614174000",
        notificationType: "case_update",
        payload: { caseId: "case-123", message: "Case updated" },
        organizationId: "123e4567-e89b-12d3-a456-426614174001",
      };

      const parsed = EmailJobSchema.parse(validJobData);
      expect(parsed.type).toBe("send_notification");
    });
  });

  describe("odoo sync job", () => {
    it("validates sync_employee job schema", async () => {
      const { OdooSyncJobSchema } = await import("./queues/job-schemas.js");

      const validJobData = {
        type: "sync_employee",
        employeeId: "123e4567-e89b-12d3-a456-426614174000",
        direction: "to_odoo",
        organizationId: "123e4567-e89b-12d3-a456-426614174001",
      };

      const parsed = OdooSyncJobSchema.parse(validJobData);
      expect(parsed.type).toBe("sync_employee");
      expect(parsed.direction).toBe("to_odoo");
    });

    it("validates bulk_sync_employees job schema", async () => {
      const { OdooSyncJobSchema } = await import("./queues/job-schemas.js");

      const validJobData = {
        type: "bulk_sync_employees",
        direction: "bidirectional",
        organizationId: "123e4567-e89b-12d3-a456-426614174001",
      };

      const parsed = OdooSyncJobSchema.parse(validJobData);
      expect(parsed.type).toBe("bulk_sync_employees");
    });
  });

  describe("reports job", () => {
    it("validates generate_pdf job schema", async () => {
      const { ReportsJobSchema } = await import("./queues/job-schemas.js");

      const validJobData = {
        type: "generate_pdf",
        reportId: "123e4567-e89b-12d3-a456-426614174000",
        organizationId: "123e4567-e89b-12d3-a456-426614174001",
        options: {
          includeCharts: true,
          includeRawData: false,
        },
      };

      const parsed = ReportsJobSchema.parse(validJobData);
      expect(parsed.type).toBe("generate_pdf");
      if (parsed.type === "generate_pdf") {
        expect(parsed.options?.includeCharts).toBe(true);
      }
    });

    it("validates generate_audit_trail job schema", async () => {
      const { ReportsJobSchema } = await import("./queues/job-schemas.js");

      const validJobData = {
        type: "generate_audit_trail",
        organizationId: "123e4567-e89b-12d3-a456-426614174000",
        dateRange: {
          start: "2024-01-01T00:00:00Z",
          end: "2024-01-31T23:59:59Z",
        },
        entityTypes: ["case", "document"],
      };

      const parsed = ReportsJobSchema.parse(validJobData);
      expect(parsed.type).toBe("generate_audit_trail");
      if (parsed.type === "generate_audit_trail") {
        expect(parsed.entityTypes).toEqual(["case", "document"]);
      }
    });
  });

  describe("job processor error handling", () => {
    it("handles malformed job data gracefully", async () => {
      const { SendEmailJobSchema } = await import("./queues/job-schemas.js");

      const malformedData = {
        type: "send_email",
        // Completely wrong structure
        random: "data",
      };

      expect(() => SendEmailJobSchema.parse(malformedData)).toThrow();
    });

    it("validates email addresses properly", async () => {
      const { SendEmailJobSchema } = await import("./queues/job-schemas.js");

      const invalidEmail = {
        type: "send_email",
        to: [{ email: "not-an-email", name: "Test" }],
        subject: "Test",
        html: "Test",
      };

      expect(() => SendEmailJobSchema.parse(invalidEmail)).toThrow();
    });

    it("validates ISO datetime strings in date ranges", async () => {
      const { AnalyticsJobSchema } = await import("./queues/job-schemas.js");

      const invalidDateRange = {
        type: "calculate_dashboard_metrics",
        organizationId: "123e4567-e89b-12d3-a456-426614174000",
        dateRange: {
          start: "not-a-date",
          end: "2024-01-31T23:59:59Z",
        },
      };

      expect(() => AnalyticsJobSchema.parse(invalidDateRange)).toThrow();
    });
  });

  describe("PostgreSQL job tracking", () => {
    it("creates job record in database", async () => {
      const job = await createJob(deps, {
        jobName: "send_email",
        type: "immediate",
        priority: "normal",
        payload: {
          to: [{ email: "test@example.com" }],
          subject: "Test",
          html: "Test",
        },
      });

      expect(job.id).toBeTruthy();
      expect(job.jobName).toBe("send_email");
      expect(job.status).toBe("pending");

      const retrieved = await getJobById(deps, job.id);
      expect(retrieved).toBeTruthy();
      expect(retrieved!.id).toBe(job.id);
    });

    it("stores job payload correctly", async () => {
      const payload = {
        to: [{ email: "test@example.com", name: "Test User" }],
        subject: "Test Subject",
        html: "<p>Test</p>",
      };

      const job = await createJob(deps, {
        jobName: "send_email",
        type: "immediate",
        priority: "high",
        payload,
      });

      const retrieved = await getJobById(deps, job.id);
      expect(retrieved!.payload).toEqual(payload);
    });
  });
});
