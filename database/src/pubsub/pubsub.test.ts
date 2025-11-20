import { describe, it, beforeEach, afterEach, expect } from "vitest";
import { InMemoryPubSub } from "./inMemoryPubSub.js";
import { RedisPubSub } from "./redisPubSub.js";
import { getDefaultPubSub, createPubSub } from "./index.js";

describe("Local Pub/Sub Adapters", async () => {
  describe("InMemoryPubSub", async () => {
    let pubsub: InMemoryPubSub;

    beforeEach(() => {
      pubsub = new InMemoryPubSub();
    });

    afterEach(async () => {
      await pubsub.close();
    });

    it("should publish and receive messages", async () => {
      let receivedMessage: unknown = null;

      await pubsub.createTopic("test-topic");
      await pubsub.subscribe("test-topic-worker", async (message) => {
        receivedMessage = message;
      });

      const messageId = await pubsub.publish("test-topic", "Hello World", { type: "test" });

      await new Promise((resolve) => setTimeout(resolve, 100));

      expect(receivedMessage).toBeTruthy();
      const message = receivedMessage as { data: string; attributes: { type: string }; id: string };
      expect(message.data).toBe("Hello World");
      expect(message.attributes.type).toBe("test");
      expect(message.id).toBe(messageId);
    });

    it("should handle JSON messages", async () => {
      let receivedMessage: unknown = null;

      await pubsub.subscribe("json-worker", async (message) => {
        receivedMessage = message;
      });

      await pubsub.publish("json", { userId: 123, action: "login" });
      await new Promise((resolve) => setTimeout(resolve, 100));

      expect(receivedMessage).toBeTruthy();
      const message = receivedMessage as { data: string };
      const data = JSON.parse(message.data) as { userId: number; action: string };
      expect(data.userId).toBe(123);
      expect(data.action).toBe("login");
    });

    it("should handle Buffer messages", async () => {
      let receivedMessage: unknown = null;

      await pubsub.subscribe("buffer-worker", async (message) => {
        receivedMessage = message;
      });

      const buffer = Buffer.from("binary data");
      await pubsub.publish("buffer", buffer);
      await new Promise((resolve) => setTimeout(resolve, 100));

      expect(receivedMessage).toBeTruthy();
      const message = receivedMessage as { data: Buffer };
      expect(Buffer.isBuffer(message.data)).toBeTruthy();
      expect(message.data.toString()).toBe("binary data");
    });
  });

  describe("RedisPubSub", async () => {
    let pubsub: RedisPubSub | undefined;

    beforeEach(() => {
      if (!process.env.REDIS_URL) {
        return;
      }
      pubsub = new RedisPubSub({ connectionString: process.env.REDIS_URL });
    });

    afterEach(async () => {
      if (pubsub) {
        await pubsub.close();
      }
    });

    it("should publish and receive messages via Redis", async () => {
      if (!process.env.REDIS_URL || !pubsub) {
        return;
      }

      let receivedMessage: unknown = null;

      await pubsub.createTopic("redis-test");
      await pubsub.subscribe("redis-test-worker", async (message) => {
        receivedMessage = message;
      });

      // Wait a bit for subscription to be active
      await new Promise((resolve) => setTimeout(resolve, 200));

      await pubsub.publish("redis-test", "Redis Hello", { source: "test" });
      await new Promise((resolve) => setTimeout(resolve, 500));

      expect(receivedMessage).toBeTruthy();
      const message = receivedMessage as { data: string; attributes: { source: string } };
      expect(message.data).toBe("Redis Hello");
      expect(message.attributes.source).toBe("test");
    });

    it("should persist messages in queue", async () => {
      if (!process.env.REDIS_URL || !pubsub) {
        return;
      }

      await pubsub.publish("queue-test", "Persistent message");

      const stats = await (
        pubsub as unknown as {
          getQueueStats: (topic: string) => Promise<{ queueLength: number; topic: string }>;
        }
      ).getQueueStats("queue-test");
      expect(stats.queueLength).toBe(1);
      expect(stats.topic).toBe("queue-test");

      await (pubsub as unknown as { clearQueue: (topic: string) => Promise<void> }).clearQueue("queue-test");
      const clearedStats = await (
        pubsub as unknown as {
          getQueueStats: (topic: string) => Promise<{ queueLength: number; topic: string }>;
        }
      ).getQueueStats("queue-test");
      expect(clearedStats.queueLength).toBe(0);
    });
  });

  describe("Factory Functions", async () => {
    it("should create memory adapter", () => {
      const pubsub = createPubSub({ provider: "memory" });
      expect(pubsub instanceof InMemoryPubSub).toBeTruthy();
    });

    it("should create redis adapter", () => {
      const pubsub = createPubSub({ provider: "redis" });
      expect(pubsub instanceof RedisPubSub).toBeTruthy();
    });

    it("should get default adapter based on environment", () => {
      const pubsub = getDefaultPubSub();
      expect(pubsub).toBeTruthy();

      // Should be either InMemoryPubSub or RedisPubSub for local development
      const isLocalAdapter = pubsub instanceof InMemoryPubSub || pubsub instanceof RedisPubSub;
      expect(isLocalAdapter).toBeTruthy();
    });
  });

  describe("Job Scheduler Integration", async () => {
    let pubsub: InMemoryPubSub;

    beforeEach(() => {
      pubsub = new InMemoryPubSub();
    });

    afterEach(async () => {
      await pubsub.close();
    });

    it("should simulate job processing workflow", async () => {
      const processedJobs: string[] = [];
      const jobEvents: unknown[] = [];

      // Setup job worker
      await pubsub.subscribe("job-queue-worker", async (message) => {
        const jobData = JSON.parse(message.data.toString()) as { jobId: string };
        processedJobs.push(jobData.jobId);

        // Simulate job completion
        await pubsub.publish(
          "job-events",
          JSON.stringify({
            type: "job.completed",
            jobId: jobData.jobId,
            timestamp: new Date().toISOString(),
          }),
        );
      });

      // Setup event logger
      await pubsub.subscribe("job-events-logger", async (message) => {
        const event = JSON.parse(message.data.toString()) as unknown;
        jobEvents.push(event);
      });

      // Queue jobs
      await pubsub.publish(
        "job-queue",
        JSON.stringify({
          jobId: "test-job-1",
          type: "data-processing",
        }),
      );

      await pubsub.publish(
        "job-queue",
        JSON.stringify({
          jobId: "test-job-2",
          type: "email-sending",
        }),
      );

      // Wait for processing
      await new Promise((resolve) => setTimeout(resolve, 200));

      expect(processedJobs.length).toBe(2);
      expect(processedJobs.includes("test-job-1")).toBeTruthy();
      expect(processedJobs.includes("test-job-2")).toBeTruthy();

      expect(jobEvents.length).toBe(2);
      expect(jobEvents.every((event) => (event as { type: string }).type === "job.completed"));
    });
  });
});
