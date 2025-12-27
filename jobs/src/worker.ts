import { Worker, Job } from "bullmq";
import { Redis } from "ioredis";
import { z } from "zod";
import {
  connect,
  startJob,
  completeJob,
  failJob,
  type JobName,
  redisConnect,
  odoo,
  EmailService,
  ResendEmailProvider,
} from "@safee/database";
import { createLogger } from "./logger.js";
import {
  AnalyticsJobSchema,
  EmailJobSchema,
  OdooSyncJobSchema,
  ReportsJobSchema,
  SendEmailJobSchema,
  RotateEncryptionKeyJobSchema,
} from "./queues/job-schemas.js";
import { renderTemplate } from "./emailTemplates/index.js";
import { JWT_SECRET, ODOO_URL, ODOO_PORT, ODOO_ADMIN_PASSWORD } from "./env.js";

// Schema for basic job data structure
const JobDataSchema = z
  .object({
    type: z.string(),
  })
  .catchall(z.unknown()); // Allow additional properties

const logger = createLogger("job-worker");
const { drizzle } = connect("job-worker");

const connection = new Redis(process.env.REDIS_URL ?? "redis://localhost:6379", {
  maxRetriesPerRequest: null,
  enableReadyCheck: false,
});

// Job processors for each job name
const jobProcessors = {
  // Existing job types
  send_email: async (payload: Record<string, unknown>) => {
    const data = SendEmailJobSchema.parse(payload);
    logger.info({ to: data.to, template: data.template?.name }, "Processing send_email job");

    // Render template if provided
    let subject: string;
    let html: string | undefined;
    let text: string | undefined;

    if (data.template) {
      const rendered = renderTemplate(data.template.name, {
        locale: data.locale,
        variables: data.template.variables,
      });
      subject = rendered.subject;
      html = rendered.html;
      text = rendered.text;
    } else {
      subject = data.subject!;
      html = data.html;
      text = data.text;
    }

    // Initialize Resend email provider
    const emailProvider = new ResendEmailProvider({
      apiKey: process.env.RESEND_API_KEY ?? "",
      senderAddress: process.env.EMAIL_FROM_ADDRESS ?? "noreply@safee.local",
      senderName: process.env.EMAIL_FROM_NAME ?? "Safee Analytics",
    });

    // Send via EmailService
    const emailService = new EmailService({
      drizzle,
      logger,
      emailProvider,
    });

    await emailService.sendEmail({
      to: data.to,
      cc: data.cc,
      bcc: data.bcc,
      from: {
        email: process.env.EMAIL_FROM_ADDRESS ?? "noreply@safee.local",
        name: process.env.EMAIL_FROM_NAME ?? "Safee Analytics",
      },
      subject,
      html,
      text,
    });

    logger.info({ to: data.to }, "Email sent successfully");
  },

  encrypt_file: async (payload: Record<string, unknown>) => {
    logger.info({ payload }, "Processing encrypt_file job");
    // TODO: Implement file encryption
    // - Fetch file from storage
    // - Encrypt using organization's key
    // - Store encrypted version
    // - Update database record
  },

  rotate_encryption_key: async (payload: Record<string, unknown>) => {
    const data = RotateEncryptionKeyJobSchema.parse(payload);
    logger.info({ payload: data }, "rotate_encryption_key job called (stubbed - not implemented)");
    // TODO: Implement key rotation logic
    // 1. Generate new encryption key
    // 2. Deactivate old key, insert new key
    // 3. Queue re-encryption jobs for all encrypted files
  },

  reencrypt_files: async (payload: Record<string, unknown>) => {
    logger.info({ payload }, "Processing reencrypt_files job");
    // TODO: Implement file re-encryption
    // - Fetch all files for organization
    // - Decrypt with old key
    // - Re-encrypt with new key
    // - Update records
  },

  // NEW - Job types from BullMQ migration
  calculate_analytics: async (payload: Record<string, unknown>) => {
    const data = AnalyticsJobSchema.parse(payload);
    logger.info({ payload: data }, "Processing calculate_analytics job");
    // TODO: Implementation based on data.type
    // - calculate_dashboard_metrics: Aggregate dashboard stats
    // - aggregate_case_statistics: Calculate case metrics
    // - calculate_organization_analytics: Org-wide KPIs
  },

  send_bulk_email: async (payload: Record<string, unknown>) => {
    const data = EmailJobSchema.parse(payload);
    logger.info({ payload: data }, "Processing send_bulk_email job");
    // TODO: Implementation based on data.type
    // - send_transactional: Single email with template
    // - send_notification: User notification email
    // - send_bulk_notification: Batch email sending
  },

  sync_odoo: async (payload: Record<string, unknown>) => {
    const data = OdooSyncJobSchema.parse(payload);
    logger.info({ payload: data }, "Processing sync_odoo job");
    // TODO: Implementation based on data.type
    // - sync_employee: Bidirectional employee sync
    // - sync_invoice: Invoice sync to/from Odoo
    // - sync_department: Department sync
    // - bulk_sync_employees: Batch employee sync
  },

  generate_report: async (payload: Record<string, unknown>) => {
    const data = ReportsJobSchema.parse(payload);
    logger.info({ payload: data }, "Processing generate_report job");
    // TODO: Implementation based on data.type
    // - generate_pdf: Create PDF report
    // - generate_excel: Create Excel workbook
    // - generate_audit_trail: Compliance audit report
    // - generate_case_report: Case-specific report
  },
  odoo_provisioning: async (payload: Record<string, unknown>) => {
    const { organizationId, lang, demo, countryCode, phone, timeoutMs } = payload as {
      organizationId: string;
      lang?: odoo.OdooLanguage;
      demo?: odoo.OdooDemo;
      countryCode?: string;
      phone?: string;
      timeoutMs?: number;
    };
    logger.info(
      { organizationId, lang, demo, countryCode, phone, timeoutMs },
      "Processing odoo_provisioning job",
    );

    // Get Redis client from database package
    const redis = await redisConnect();

    // Create Odoo database service with all required dependencies
    const odooDatabaseService = new odoo.OdooDatabaseService({
      logger,
      drizzle,
      redis,
      odooClient: new odoo.OdooClient(ODOO_URL),
      encryptionService: new odoo.EncryptionService(JWT_SECRET),
      odooConfig: {
        url: ODOO_URL,
        port: ODOO_PORT,
        adminPassword: ODOO_ADMIN_PASSWORD,
      },
    });

    await odooDatabaseService.provisionDatabase(organizationId, {
      lang,
      demo,
      countryCode,
      phone,
      timeoutMs,
    });
  },
  install_odoo_modules: async (payload: Record<string, unknown>) => {
    const { organizationId } = payload as { organizationId: string };
    logger.info({ organizationId }, "Processing install_odoo_modules job (background)");

    // Get Redis client from database package
    const redis = await redisConnect();

    // Create Odoo database service with all required dependencies
    const odooDatabaseService = new odoo.OdooDatabaseService({
      logger,
      drizzle,
      redis,
      odooClient: new odoo.OdooClient(ODOO_URL),
      encryptionService: new odoo.EncryptionService(JWT_SECRET),
      odooConfig: {
        url: ODOO_URL,
        port: ODOO_PORT,
        adminPassword: ODOO_ADMIN_PASSWORD,
      },
    });

    logger.info(
      { organizationId },
      "Installing extended Odoo modules in background (this may take 10-15 minutes)",
    );
    await odooDatabaseService.installModulesForOrganization(organizationId);
    logger.info({ organizationId }, "✅ All Odoo modules installed successfully");
  },
} satisfies Record<JobName, (payload: Record<string, unknown>) => Promise<void>>;

/**
 * Unified job processor for all BullMQ queues
 */
async function processJob(job: Job): Promise<void> {
  // Validate basic job structure with Zod
  const jobData = JobDataSchema.parse(job.data);

  logger.info({ jobId: job.id, data: jobData }, "Processing job from BullMQ");

  // Update PostgreSQL job status to running
  await startJob({ drizzle, logger }, job.id!);

  try {
    const jobType = jobData.type;
    const jobName = job.name;

    logger.info({ jobId: job.id, jobName, jobType }, "Executing job processor");

    // Find the appropriate processor based on queue name using type-safe switch
    let processor: (payload: Record<string, unknown>) => Promise<void>;

    if (jobName === "analytics") {
      processor = jobProcessors.calculate_analytics;
    } else if (jobName === "email") {
      processor = jobProcessors.send_bulk_email;
    } else if (jobName === "email-jobs") {
      processor = jobProcessors.send_email;
    } else if (jobName === "odoo-sync") {
      processor = jobProcessors.sync_odoo;
    } else if (jobName === "reports") {
      processor = jobProcessors.generate_report;
    } else if (jobName === "odoo-provisioning") {
      processor = jobProcessors.odoo_provisioning;
    } else if (jobName === "install-modules") {
      processor = jobProcessors.install_odoo_modules;
    } else if (jobName === "encryption") {
      // Route based on job type in payload
      if (jobData.type === "encrypt_file") {
        processor = jobProcessors.encrypt_file;
      } else if (jobData.type === "reencrypt_files") {
        processor = jobProcessors.reencrypt_files;
      } else {
        throw new Error(`Unknown job type in encryption queue: ${jobData.type}`);
      }
    } else if (jobName === "key-rotation") {
      processor = jobProcessors.rotate_encryption_key;
    } else {
      throw new Error(`Unknown job name: ${jobName}`);
    }

    // Execute job processor (further Zod validation happens inside each processor)
    await processor(jobData);

    // Mark as completed in PostgreSQL
    await completeJob({ drizzle, logger }, job.id!, {
      completedAt: new Date().toISOString(),
      jobType,
    });

    logger.info({ jobId: job.id }, "Job completed successfully");
  } catch (err: unknown) {
    const errorMessage = err instanceof Error ? err.message : String(err);
    logger.error({ jobId: job.id, error: errorMessage }, "Job failed");

    // Mark as failed in PostgreSQL (BullMQ will handle retries)
    await failJob({ drizzle, logger }, job.id!, errorMessage, true);

    throw err; // Re-throw so BullMQ knows it failed
  }
}

/**
 * Start all BullMQ workers
 */
async function startWorkers() {
  const workers: Worker[] = [];

  // Create a worker for each queue
  const queues = [
    "analytics",
    "email",
    "email-jobs",
    "odoo-sync",
    "reports",
    "odoo-provisioning",
    "install-modules",
    "encryption",
    "key-rotation",
  ];

  for (const queueName of queues) {
    const worker = new Worker(queueName, processJob, {
      connection,
      concurrency: 5,
      limiter: {
        max: 10,
        duration: 1000,
      },
    });

    worker.on("completed", (job) => {
      logger.info({ jobId: job.id, queue: queueName }, "Job completed");
    });

    worker.on("failed", (job, err) => {
      logger.error({ jobId: job?.id, queue: queueName, error: err.message }, "Job failed");
    });

    worker.on("error", (err) => {
      logger.error({ queue: queueName, error: err }, "Worker error");
    });

    workers.push(worker);
    logger.info({ queue: queueName }, "Worker started");
  }

  logger.info({ queues: queues.length }, "All BullMQ workers started");

  // Graceful shutdown
  async function shutdown(signal: string) {
    logger.info({ signal }, "Shutting down gracefully");
    await Promise.all(workers.map((w) => w.close()));
    await connection.quit();
    process.exit(0);
  }

  process.on("SIGTERM", () => {
    void shutdown("SIGTERM");
  });
  process.on("SIGINT", () => {
    void shutdown("SIGINT");
  });
}

// Start all workers
startWorkers().catch((err: unknown) => {
  logger.error({ error: err }, "Failed to start workers");
  process.exit(1);
});
