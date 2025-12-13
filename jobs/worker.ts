import { Worker, Job } from "bullmq";
import Redis from "ioredis";
import { connect } from "@safee/database";
import { startJob, completeJob, failJob } from "@safee/database/jobs";
import type { JobName } from "@safee/database/drizzle/_common";
import { createLogger } from "./logger.js";

const logger = createLogger("job-worker");
const { drizzle } = connect("job-worker");

const connection = new Redis(process.env.REDIS_URL || "redis://localhost:6379", {
  maxRetriesPerRequest: null,
});

// Job processors for each job name
const jobProcessors: Record<JobName, (payload: Record<string, unknown>) => Promise<void>> = {
  // Existing job types
  send_email: async (payload) => {
    logger.info({ payload }, "Processing send_email job");
    // TODO: Implement email sending
    // - Load email template
    // - Render with data
    // - Send via email service (SendGrid, AWS SES, etc.)
  },

  encrypt_file: async (payload) => {
    logger.info({ payload }, "Processing encrypt_file job");
    // TODO: Implement file encryption
    // - Fetch file from storage
    // - Encrypt using organization's key
    // - Store encrypted version
    // - Update database record
  },

  rotate_encryption_key: async (payload) => {
    logger.info({ payload }, "Processing rotate_encryption_key job");
    // TODO: Implement key rotation
    // - Generate new encryption key
    // - Re-encrypt all files with new key
    // - Update organization key record
    // - Archive old key
  },

  reencrypt_files: async (payload) => {
    logger.info({ payload }, "Processing reencrypt_files job");
    // TODO: Implement file re-encryption
    // - Fetch all files for organization
    // - Decrypt with old key
    // - Re-encrypt with new key
    // - Update records
  },

  // NEW - Job types from BullMQ migration
  calculate_analytics: async (payload) => {
    logger.info({ payload }, "Processing calculate_analytics job");
    // TODO: Implementation based on payload.type
    // - calculate_dashboard_metrics: Aggregate dashboard stats
    // - aggregate_case_statistics: Calculate case metrics
    // - calculate_organization_analytics: Org-wide KPIs
  },

  send_bulk_email: async (payload) => {
    logger.info({ payload }, "Processing send_bulk_email job");
    // TODO: Implementation based on payload.type
    // - send_transactional: Single email with template
    // - send_notification: User notification email
    // - send_bulk_notification: Batch email sending
  },

  sync_odoo: async (payload) => {
    logger.info({ payload }, "Processing sync_odoo job");
    // TODO: Implementation based on payload.type
    // - sync_employee: Bidirectional employee sync
    // - sync_invoice: Invoice sync to/from Odoo
    // - sync_department: Department sync
    // - bulk_sync_employees: Batch employee sync
  },

  generate_report: async (payload) => {
    logger.info({ payload }, "Processing generate_report job");
    // TODO: Implementation based on payload.type
    // - generate_pdf: Create PDF report
    // - generate_excel: Create Excel workbook
    // - generate_audit_trail: Compliance audit report
    // - generate_case_report: Case-specific report
  },
};

/**
 * Unified job processor for all BullMQ queues
 */
async function processJob(job: Job): Promise<void> {
  logger.info({ jobId: job.id, data: job.data }, "Processing job from BullMQ");

  // Update PostgreSQL job status to running
  await startJob({ drizzle, logger }, job.id!);

  try {
    // Determine job type from payload
    const jobType = job.data.type as string;
    const jobName = job.name as string;

    logger.info({ jobId: job.id, jobName, jobType }, "Executing job processor");

    // Find the appropriate processor based on queue name
    let processorKey: JobName;
    if (jobName === "analytics") processorKey = "calculate_analytics";
    else if (jobName === "email") processorKey = "send_bulk_email";
    else if (jobName === "odoo-sync") processorKey = "sync_odoo";
    else if (jobName === "reports") processorKey = "generate_report";
    else throw new Error(`Unknown job name: ${jobName}`);

    const processor = jobProcessors[processorKey];
    if (!processor) {
      throw new Error(`No processor found for: ${processorKey}`);
    }

    // Execute job processor
    await processor(job.data);

    // Mark as completed in PostgreSQL
    await completeJob({ drizzle, logger }, job.id!, {
      completedAt: new Date().toISOString(),
      jobType,
    });

    logger.info({ jobId: job.id }, "Job completed successfully");
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    logger.error({ jobId: job.id, error: errorMessage }, "Job failed");

    // Mark as failed in PostgreSQL (BullMQ will handle retries)
    await failJob({ drizzle, logger }, job.id!, errorMessage, true);

    throw error; // Re-throw so BullMQ knows it failed
  }
}

/**
 * Start all BullMQ workers
 */
async function startWorkers() {
  const workers: Worker[] = [];

  // Create a worker for each queue
  const queues = ["analytics", "email", "odoo-sync", "reports"];

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
  const shutdown = async (signal: string) => {
    logger.info({ signal }, "Shutting down gracefully");
    await Promise.all(workers.map((w) => w.close()));
    await connection.quit();
    process.exit(0);
  };

  process.on("SIGTERM", () => shutdown("SIGTERM"));
  process.on("SIGINT", () => shutdown("SIGINT"));
}

// Start all workers
startWorkers().catch((err) => {
  logger.error({ error: err }, "Failed to start workers");
  process.exit(1);
});
