import { PubSub as GooglePubSub, Message, Subscription } from "@google-cloud/pubsub";
import type { PubSub, PubSubMessage, PubSubConfig } from "./pubsub.js";
import { logger } from "../logger.js";

export class GooglePubSubAdapter implements PubSub {
  private client: GooglePubSub;
  private subscriptions = new Map<string, Subscription>();

  constructor(config: PubSubConfig = {}) {
    this.client = new GooglePubSub({
      projectId: config.projectId,
      keyFilename: config.credentials
        ? (config.credentials as { keyFilename?: string }).keyFilename
        : undefined,
    });
  }

  async publish(
    topic: string,
    data: Buffer | string | object,
    attributes?: Record<string, string>,
  ): Promise<string> {
    logger.debug({ topic, attributes }, "Publishing message to Google Pub/Sub");

    const topicRef = this.client.topic(topic);

    let messageData: Buffer;
    if (typeof data === "string") {
      messageData = Buffer.from(data, "utf8");
    } else if (Buffer.isBuffer(data)) {
      messageData = data;
    } else {
      messageData = Buffer.from(JSON.stringify(data), "utf8");
    }

    const messageId = await topicRef.publishMessage({
      data: messageData,
      attributes: attributes ?? {},
    });

    logger.debug({ topic, messageId }, "Message published to Google Pub/Sub");
    return messageId;
  }

  async subscribe(subscription: string, handler: (message: PubSubMessage) => Promise<void>): Promise<void> {
    logger.debug({ subscription }, "Setting up Google Pub/Sub subscription");

    const subscriptionRef = this.client.subscription(subscription);
    this.subscriptions.set(subscription, subscriptionRef);

    async function messageHandler(message: Message): Promise<void> {
      try {
        const pubsubMessage: PubSubMessage = {
          id: message.id,
          data: message.data,
          attributes: message.attributes,
          publishTime: message.publishTime,
        };

        await handler(pubsubMessage);
        message.ack();

        logger.debug({ messageId: message.id, subscription }, "Message processed successfully");
      } catch (err) {
        logger.error({ error: err, messageId: message.id, subscription }, "Error processing message");
        message.nack();
      }
    }

    subscriptionRef.on("message", (message) => {
      void messageHandler(message);
    });
    subscriptionRef.on("error", (error: Error) => {
      logger.error({ error, subscription }, "Google Pub/Sub subscription error");
    });

    logger.info({ subscription }, "Google Pub/Sub subscription active");
  }

  async createTopic(topic: string): Promise<void> {
    logger.debug({ topic }, "Creating Google Pub/Sub topic");

    const topicRef = this.client.topic(topic);
    const [exists] = await topicRef.exists();

    if (!exists) {
      await topicRef.create();
      logger.info({ topic }, "Google Pub/Sub topic created");
    } else {
      logger.debug({ topic }, "Google Pub/Sub topic already exists");
    }
  }

  async createSubscription(topic: string, subscription: string): Promise<void> {
    logger.debug({ topic, subscription }, "Creating Google Pub/Sub subscription");

    const topicRef = this.client.topic(topic);
    const subscriptionRef = topicRef.subscription(subscription);
    const [exists] = await subscriptionRef.exists();

    if (!exists) {
      await subscriptionRef.create();
      logger.info({ topic, subscription }, "Google Pub/Sub subscription created");
    } else {
      logger.debug({ topic, subscription }, "Google Pub/Sub subscription already exists");
    }
  }

  async close(): Promise<void> {
    logger.debug("Closing Google Pub/Sub connections");

    // Close all subscriptions
    for (const [name, subscription] of this.subscriptions) {
      try {
        await subscription.close();
        logger.debug({ subscription: name }, "Google Pub/Sub subscription closed");
      } catch (err) {
        logger.error({ error: err, subscription: name }, "Error closing Google Pub/Sub subscription");
      }
    }

    this.subscriptions.clear();
    await this.client.close();

    logger.info("Google Pub/Sub connections closed");
  }
}
