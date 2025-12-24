import { Queue } from "bullmq";
import { Redis } from "ioredis";

export const ODOO_PROVISIONING_QUEUE_NAME = "odoo-provisioning";

const connection = new Redis(process.env.REDIS_URL ?? "redis://localhost:6379", {
  maxRetriesPerRequest: null,
  enableReadyCheck: false,
});

export const odooProvisioningQueue = new Queue(ODOO_PROVISIONING_QUEUE_NAME, {
  connection,
  defaultJobOptions: {
    attempts: 3,
    backoff: {
      type: "exponential",
      delay: 1000,
    },
  },
});
