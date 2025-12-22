import { Worker, Job, type ConnectionOptions } from "bullmq";
import { Redis } from "ioredis";
import { z } from "zod";
import { connect, startJob, completeJob, failJob, type JobName, redisConnect, odoo } from "@safee/database";
import { createLogger } from "./logger.js";
import {
  AnalyticsJobSchema,
  EmailJobSchema,
  OdooSyncJobSchema,
  ReportsJobSchema,
} from "./queues/job-schemas.js";

// Schema for basic job data structure
const JobDataSchema = z
  .object({
    type: z.string(),
  })
  .catchall(z.unknown()); // Allow additional properties

const logger = createLogger("job-worker");
const { drizzle } = connect("job-worker");

const redisConnection = new Redis(process.env.REDIS_URL ?? "redis://localhost:6379", {
  maxRetriesPerRequest: null,
});
const connection = redisConnection as unknown as ConnectionOptions;

// Job processors for each job name
const jobProcessors = {
  // Existing job types
  send_email: async (payload: Record<string, unknown>) => {
    logger.info({ payload }, "Processing send_email job");
    // TODO: Implement email sending
    // - Load email template
    // - Render with data
    // - Send via email service (SendGrid, AWS SES, etc.)
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
    logger.info({ payload }, "Processing rotate_encryption_key job");
    // TODO: Implement key rotation
    // - Generate new encryption key
    // - Re-encrypt all files with new key
    // - Update organization key record
    // - Archive old key
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
    const { organizationId } = payload as { organizationId: string };
    logger.info({ organizationId }, "Processing odoo_provisioning job");

    // Get Redis client from database package
    const redis = await redisConnect();

    // Create Odoo database service with all required dependencies
    const odooDatabaseService = new odoo.OdooDatabaseService({
      logger,
      drizzle,
      redis,
      odooClient: new odoo.OdooClient(process.env.ODOO_URL ?? "http://localhost:8069"),
      encryptionService: new odoo.EncryptionService(process.env.JWT_SECRET ?? "development-key"),
      odooConfig: {
        url: process.env.ODOO_URL ?? "http://localhost:8069",
        port: parseInt(process.env.ODOO_PORT ?? "8069", 10),
        adminPassword: process.env.ODOO_ADMIN_PASSWORD ?? "admin",
      },
    });

    await odooDatabaseService.provisionDatabase(organizationId);
  }
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
    } else if (jobName === "odoo-sync") {
      processor = jobProcessors.sync_odoo;
    } else if (jobName === "reports") {
      processor = jobProcessors.generate_report;
    } else if (jobName === "odoo-provisioning") {
      processor = jobProcessors.odoo_provisioning;
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
  const queues = ["analytics", "email", "odoo-sync", "reports", "odoo-provisioning"];

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
    await redisConnection.quit();
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
