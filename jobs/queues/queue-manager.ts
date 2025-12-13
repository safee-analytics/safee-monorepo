import { Queue, QueueOptions } from "bullmq";
import Redis from "ioredis";
import { createJob, logJobInfo } from "@safee/database/jobs";
import { connect } from "@safee/database";
import type { JobName, Priority } from "@safee/database/drizzle/_common";
import { createLogger } from "../logger.js";

const logger = createLogger("queue-manager");
const { drizzle } = connect("queue-manager");

const connection = new Redis(process.env.REDIS_URL || "redis://localhost:6379", {
  maxRetriesPerRequest: null,
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

// Map queue names to PostgreSQL job names
const QUEUE_TO_JOB_NAME: Record<string, JobName> = {
  analytics: "calculate_analytics",
  email: "send_bulk_email",
  "odoo-sync": "sync_odoo",
  reports: "generate_report",
};

/**
 * Queue manager with dual persistence:
 * - BullMQ (Redis) for efficient job processing
 * - PostgreSQL for audit trails and compliance
 */
export class QueueManager {
  private queues: Map<string, Queue> = new Map();

  constructor() {
    ["analytics", "email", "odoo-sync", "reports"].forEach((queueName) => {
      this.queues.set(queueName, new Queue(queueName, DEFAULT_QUEUE_OPTIONS));
      logger.info({ queueName }, "Queue initialized");
    });
  }

  /**
   * Add job to BullMQ AND PostgreSQL
   * BullMQ handles processing, PostgreSQL provides audit trail
   */
  async addJob(
    queueName: string,
    data: Record<string, unknown>,
    options: { priority?: Priority; organizationId?: string } = {},
  ): Promise<{ bullmqJobId: string; pgJobId: string }> {
    const queue = this.queues.get(queueName);
    if (!queue) throw new Error(`Queue ${queueName} not found`);

    const jobName = QUEUE_TO_JOB_NAME[queueName];

    // 1. Create job in PostgreSQL first (source of truth for audit)
    const pgJob = await createJob(
      { drizzle, logger },
      {
        jobName,
        type: "immediate",
        priority: options.priority || "normal",
        payload: data,
        organizationId: options.organizationId,
      },
    );

    // 2. Add to BullMQ with PostgreSQL job ID as reference
    const bullmqJob = await queue.add(queueName, data, {
      priority: options.priority === "critical" ? 1 : options.priority === "high" ? 3 : 5,
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
