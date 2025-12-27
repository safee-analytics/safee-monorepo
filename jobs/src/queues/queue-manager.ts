import { Queue, type QueueOptions } from "bullmq";
import { Redis } from "ioredis";
import { connect, createJob, logJobInfo, type JobName, type Priority } from "@safee/database";
import { createLogger } from "../logger.js";

const logger = createLogger("queue-manager");
const { drizzle } = connect("queue-manager");

const connection = new Redis(process.env.REDIS_URL ?? "redis://localhost:6379", {
  maxRetriesPerRequest: null,
  enableReadyCheck: false,
});

const DEFAULT_QUEUE_OPTIONS: QueueOptions = {
  connection,
  defaultJobOptions: {
    attempts: 3,
    backoff: { type: "exponential", delay: 5000 },
    removeOnComplete: false,
    removeOnFail: false,
  },
};

/**
 * Queue manager with dual persistence:
 * - BullMQ (Redis) for efficient job processing
 * - PostgreSQL for audit trails and compliance
 */
export class QueueManager {
  private queues = new Map<string, Queue>();

  constructor() {
    for (const queueName of [
      "analytics",
      "email",
      "email-jobs",
      "odoo-sync",
      "reports",
      "odoo-provisioning",
      "install-modules",
      "encryption",
      "key-rotation",
    ]) {
      this.queues.set(queueName, new Queue(queueName, DEFAULT_QUEUE_OPTIONS));
      logger.info({ queueName }, "Queue initialized");
    }
  }

  /**
   * Add job to BullMQ AND PostgreSQL
   * BullMQ handles processing, PostgreSQL provides audit trail
   */
  async addJob(
    queueName:
      | "analytics"
      | "email"
      | "email-jobs"
      | "odoo-sync"
      | "reports"
      | "odoo-provisioning"
      | "install-modules"
      | "encryption"
      | "key-rotation",
    data: Record<string, unknown>,
    options: { priority?: Priority; organizationId?: string } = {},
  ): Promise<{ bullmqJobId: string; pgJobId: string }> {
    const queue = this.queues.get(queueName);
    if (!queue) throw new Error(`Queue ${queueName} not found`);

    // Map queue name to job name using type-safe switch
    // Note: For queues with multiple job types (encryption, email-jobs),
    // the actual job name should be in the data payload
    let jobName: JobName;
    switch (queueName) {
      case "analytics":
        jobName = "calculate_analytics";
        break;
      case "email":
        jobName = "send_bulk_email";
        break;
      case "email-jobs":
        jobName = "send_email";
        break;
      case "odoo-sync":
        jobName = "sync_odoo";
        break;
      case "reports":
        jobName = "generate_report";
        break;
      case "odoo-provisioning":
        jobName = "odoo_provisioning";
        break;
      case "install-modules":
        jobName = "install_odoo_modules";
        break;
      case "encryption":
        // Default to encrypt_file, but could be reencrypt_files based on payload
        jobName = "encrypt_file";
        break;
      case "key-rotation":
        jobName = "rotate_encryption_key";
        break;
      default:
        throw new Error("Unknown queue");
    }

    const priority: Priority = options.priority ?? "normal";

    // 1. Create job in PostgreSQL first (source of truth for audit)
    const pgJob = await createJob(
      { drizzle, logger },
      {
        jobName,
        type: "immediate",
        priority,
        payload: data,
        organizationId: options.organizationId,
      },
    );

    // 2. Add to BullMQ with PostgreSQL job ID as reference
    // Map priority to BullMQ numeric priority (lower = higher priority)
    let bullmqPriority = 5; // default
    if (options.priority === "critical") {
      bullmqPriority = 1;
    } else if (options.priority === "high") {
      bullmqPriority = 3;
    }

    const bullmqJob = await queue.add(queueName, data, {
      priority: bullmqPriority,
      jobId: pgJob.id, // Use PostgreSQL ID as BullMQ job ID for correlation
    });

    await logJobInfo({ drizzle, logger }, pgJob.id, "Job added to BullMQ queue", {
      queueName,
      bullmqJobId: bullmqJob.id,
    });

    logger.info({ bullmqJobId: bullmqJob.id, pgJobId: pgJob.id, queueName }, "Job enqueued");

    return { bullmqJobId: bullmqJob.id!, pgJobId: pgJob.id };
  }

  /**
   * Add job by job name (automatically routes to correct queue)
   * Provides single entry point for all job types
   */
  async addJobByName(
    jobName: JobName,
    data: Record<string, unknown>,
    options: { priority?: Priority; organizationId?: string } = {},
  ): Promise<{ bullmqJobId: string; pgJobId: string }> {
    // Map job name to queue name
    let queueName:
      | "analytics"
      | "email"
      | "email-jobs"
      | "odoo-sync"
      | "reports"
      | "odoo-provisioning"
      | "install-modules"
      | "encryption"
      | "key-rotation";

    switch (jobName) {
      case "calculate_analytics":
        queueName = "analytics";
        break;
      case "send_bulk_email":
        queueName = "email";
        break;
      case "send_email":
        queueName = "email-jobs";
        break;
      case "sync_odoo":
        queueName = "odoo-sync";
        break;
      case "generate_report":
        queueName = "reports";
        break;
      case "odoo_provisioning":
        queueName = "odoo-provisioning";
        break;
      case "install_odoo_modules":
        queueName = "install-modules";
        break;
      case "encrypt_file":
      case "reencrypt_files":
        queueName = "encryption";
        break;
      case "rotate_encryption_key":
        queueName = "key-rotation";
        break;
      default:
        throw new Error(`Unknown job name: ${jobName as string}`);
    }

    return this.addJob(queueName, data, options);
  }

  async close() {
    await Promise.all(Array.from(this.queues.values()).map((q) => q.close()));
    logger.info("All queues closed");
  }
}

export const queueManager = new QueueManager();
