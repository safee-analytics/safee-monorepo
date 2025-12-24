import { createBullBoard } from "@bull-board/api";
import { BullMQAdapter } from "@bull-board/api/bullMQAdapter";
import { ExpressAdapter } from "@bull-board/express";
import { Queue } from "bullmq";
import { Redis } from "ioredis";
import type { Logger } from "pino";
import type { RedisClient } from "@safee/database";

export function setupBullBoard(logger: Logger, _redis: RedisClient) {
  const redisUrl = process.env.REDIS_URL ?? "redis://localhost:6379";

  logger.info({ redisUrl }, "Configuring Bull Board");

  // Create Redis connection for BullMQ
  const connection = new Redis(redisUrl, {
    maxRetriesPerRequest: null,
    enableReadyCheck: false,
  });

  const queues = [
    new Queue("analytics", { connection }),
    new Queue("email", { connection }),
    new Queue("odoo-sync", { connection }),
    new Queue("reports", { connection }),
    new Queue("odoo-provisioning", { connection }),
    new Queue("install-modules", { connection }),
  ];

  const serverAdapter = new ExpressAdapter();
  serverAdapter.setBasePath("/admin/queues");

  createBullBoard({
    queues: queues.map((q) => new BullMQAdapter(q)),
    serverAdapter,
  });

  logger.info("Bull Board configured at /admin/queues");

  return serverAdapter;
}
