import { Queue } from "bullmq";
import type { Redis } from "ioredis";

/**
 * Clean all BullMQ queues by removing all jobs
 * Use this in beforeEach to ensure test isolation
 */
export async function cleanAllQueues(redis: Redis): Promise<void> {
  const queueNames = [
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

  for (const queueName of queueNames) {
    const queue = new Queue(queueName, { connection: redis });
    try {
      await queue.drain(); // Remove all waiting/delayed jobs
      await queue.clean(0, 0); // Clean up completed/failed jobs
    } finally {
      await queue.close();
    }
  }
}
