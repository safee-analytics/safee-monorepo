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
      "odoo-sync",
      "reports",
      "odoo-provisioning",
      "install-modules",
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
    queueName: "analytics" | "email" | "odoo-sync" | "reports" | "odoo-provisioning" | "install-modules",
    data: Record<string, unknown>,
    options: { priority?: Priority; organizationId?: string } = {},
  ): Promise<{ bullmqJobId: string; pgJobId: string }> {
    const queue = this.queues.get(queueName);
    if (!queue) throw new Error(`Queue ${queueName} not found`);

    // Map queue name to job name using type-safe switch
    let jobName: JobName;
    switch (queueName) {
      case "analytics":
        jobName = "calculate_analytics";
        break;
      case "email":
        jobName = "send_bulk_email";
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

  async close() {
    await Promise.all(Array.from(this.queues.values()).map((q) => q.close()));
    logger.info("All queues closed");
  }
}

export const queueManager = new QueueManager();
