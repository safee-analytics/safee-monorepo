import { createClient } from "redis";
import type { PubSub, PubSubMessage, PubSubConfig } from "./pubsub.js";
import { logger } from "../logger.js";

interface RedisSubscription {
  name: string;
  topic: string;
  handler: (message: PubSubMessage) => Promise<void>;
  client: ReturnType<typeof createClient>;
  queueClient?: ReturnType<typeof createClient>;
}

export class RedisPubSub implements PubSub {
  private publishClient: ReturnType<typeof createClient>;
  private subscriptions = new Map<string, RedisSubscription>();
  private messageIdCounter = 0;
  private isConnected = false;

  constructor(private config: PubSubConfig = {}) {
    const redisUrl = config.connectionString ?? process.env.REDIS_URL ?? "redis://localhost:6379";

    this.publishClient = createClient({
      url: redisUrl,
    });

    this.publishClient.on("error", (error: Error) => {
      logger.error({ error }, "Redis pub/sub publish client error");
    });

    logger.info({ redisUrl }, "Initializing Redis pub/sub");
  }

  private async ensureConnected(): Promise<void> {
    if (!this.isConnected) {
      await this.publishClient.connect();
      this.isConnected = true;
      logger.info("Redis pub/sub publish client connected");
    }
  }

  async publish(
    topic: string,
    data: Buffer | string | object,
    attributes?: Record<string, string>,
  ): Promise<string> {
    await this.ensureConnected();

    const messageId = `msg-${++this.messageIdCounter}-${Date.now()}`;

    logger.debug({ topic, messageId, attributes }, "Publishing message to Redis pub/sub");

    let messageData: string;
    if (typeof data === "string") {
      messageData = data;
    } else if (Buffer.isBuffer(data)) {
      messageData = data.toString("base64");
    } else {
      messageData = JSON.stringify(data);
    }

    const message: PubSubMessage = {
      id: messageId,
      data: messageData,
      attributes: attributes ?? {},
      publishTime: new Date(),
    };

    const serializedMessage = JSON.stringify(message);

    const pipeline = this.publishClient.multi();

    pipeline.publish(`topic:${topic}`, serializedMessage);

    pipeline.lPush(`queue:${topic}`, serializedMessage);

    pipeline.lTrim(`queue:${topic}`, 0, 999);

    await pipeline.exec();

    logger.debug({ topic, messageId }, "Message published to Redis pub/sub");
    return messageId;
  }

  async subscribe(subscription: string, handler: (message: PubSubMessage) => Promise<void>): Promise<void> {
    logger.debug({ subscription }, "Setting up Redis pub/sub subscription");

    const subscriptionClient = createClient({
      url: this.config.connectionString ?? process.env.REDIS_URL ?? "redis://localhost:6379",
    });

    subscriptionClient.on("error", (error: Error) => {
      logger.error({ error, subscription }, "Redis pub/sub subscription client error");
    });

    await subscriptionClient.connect();

    const topic = this.extractTopicFromSubscription(subscription);

    const sub: RedisSubscription = {
      name: subscription,
      topic,
      handler,
      client: subscriptionClient,
    };

    this.subscriptions.set(subscription, sub);

    await this.setupRealTimeSubscription(sub);
    await this.setupQueueProcessor(sub);

    logger.info({ subscription, topic }, "Redis pub/sub subscription active");
  }

  async createTopic(topic: string): Promise<void> {
    logger.debug({ topic }, "Creating Redis pub/sub topic");

    await this.ensureConnected();

    logger.info({ topic }, "Redis pub/sub topic ready");
  }

  async createSubscription(topic: string, subscription: string): Promise<void> {
    logger.debug({ topic, subscription }, "Creating Redis pub/sub subscription");

    logger.info({ topic, subscription }, "Redis pub/sub subscription ready (will be active when subscribed)");
  }

  async close(): Promise<void> {
    logger.debug("Closing Redis pub/sub connections");

    for (const [name, subscription] of this.subscriptions) {
      try {
        await subscription.client.quit();
        logger.debug({ subscription: name }, "Redis subscription client closed");
      } catch (err) {
        logger.error({ error: err, subscription: name }, "Error closing Redis subscription client");
      }

      if (subscription.queueClient) {
        try {
          await subscription.queueClient.quit();
          logger.debug({ subscription: name }, "Redis queue client closed");
        } catch (err) {
          logger.error({ error: err, subscription: name }, "Error closing Redis queue client");
        }
      }
    }

    this.subscriptions.clear();

    if (this.isConnected) {
      await this.publishClient.quit();
      this.isConnected = false;
    }

    logger.info("Redis pub/sub connections closed");
  }

  private async setupRealTimeSubscription(subscription: RedisSubscription): Promise<void> {
    await subscription.client.subscribe(`topic:${subscription.topic}`, (serializedMessage) => {
      void this.processMessage(subscription, serializedMessage);
    });

    logger.debug(
      { subscription: subscription.name, topic: subscription.topic },
      "Real-time Redis subscription active",
    );
  }

  private async setupQueueProcessor(subscription: RedisSubscription): Promise<void> {
    const queueClient = createClient({
      url: this.config.connectionString ?? process.env.REDIS_URL ?? "redis://localhost:6379",
    });

    queueClient.on("error", (error: Error) => {
      logger.error({ error, subscription: subscription.name }, "Redis queue client error");
    });

    await queueClient.connect();

    const processQueue = async () => {
      try {
        const result = await queueClient.brPop(`queue:${subscription.topic}`, 1);

        if (result) {
          await this.processMessage(subscription, result.element);
        }

        if (queueClient.isOpen) {
          void setImmediate(() => {
            void processQueue();
          });
        }
      } catch (err) {
        if (queueClient.isOpen) {
          logger.error({ error: err, subscription: subscription.name }, "Error processing Redis queue");
          void setTimeout(() => {
            void processQueue();
          }, 1000);
        }
      }
    };

    void setImmediate(() => {
      void processQueue();
    });

    subscription.queueClient = queueClient;

    logger.debug(
      { subscription: subscription.name, topic: subscription.topic },
      "Redis queue processor active",
    );
  }

  private async processMessage(subscription: RedisSubscription, serializedMessage: string): Promise<void> {
    try {
      const message: PubSubMessage = JSON.parse(serializedMessage) as PubSubMessage;

      if (typeof message.data === "string" && this.isBase64(message.data)) {
        message.data = Buffer.from(message.data, "base64");
      }

      logger.debug(
        { messageId: message.id, subscription: subscription.name },
        "Processing Redis pub/sub message",
      );

      await subscription.handler(message);

      logger.debug(
        { messageId: message.id, subscription: subscription.name },
        "Redis pub/sub message processed successfully",
      );
    } catch (err) {
      logger.error({ error: err, subscription: subscription.name }, "Error processing Redis pub/sub message");
      // TODO: In production, you might want to implement dead letter queues here
    }
  }

  private extractTopicFromSubscription(subscription: string): string {
    const parts = subscription.split("-");
    if (parts.length > 1) {
      return parts.slice(0, -1).join("-");
    }
    return subscription;
  }

  private isBase64(str: string): boolean {
    try {
      return Buffer.from(str, "base64").toString("base64") === str;
    } catch {
      return false;
    }
  }

  async getQueueStats(topic: string): Promise<{
    queueLength: number;
    topic: string;
  }> {
    await this.ensureConnected();

    const queueLength = await this.publishClient.lLen(`queue:${topic}`);

    return {
      queueLength,
      topic,
    };
  }

  async clearQueue(topic: string): Promise<void> {
    await this.ensureConnected();
    await this.publishClient.del(`queue:${topic}`);
    logger.info({ topic }, "Redis topic queue cleared");
  }
}
