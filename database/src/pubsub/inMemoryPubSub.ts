import { EventEmitter } from "node:events";
import type { PubSub, PubSubMessage, PubSubConfig } from "./pubsub.js";
import { logger } from "../logger.js";

interface Subscription {
  name: string;
  topic: string;
  handler: (message: PubSubMessage) => Promise<void>;
}

/**
 * In-memory pub/sub implementation for local development
 * Uses Node.js EventEmitter for message passing
 */
export class InMemoryPubSub implements PubSub {
  private emitter = new EventEmitter();
  private topics = new Set<string>();
  private subscriptions = new Map<string, Subscription>();
  private subscriptionTopics = new Map<string, string>(); // subscription name -> topic name
  private messageIdCounter = 0;

  constructor(_config: PubSubConfig = {}) {
    logger.info("Initializing in-memory pub/sub");

    this.emitter.setMaxListeners(1000);
  }

  async publish(
    topic: string,
    data: Buffer | string | object,
    attributes?: Record<string, string>,
  ): Promise<string> {
    const messageId = `msg-${++this.messageIdCounter}-${Date.now()}`;

    logger.debug({ topic, messageId, attributes }, "Publishing message to in-memory pub/sub");

    let messageData: Buffer | string;
    if (typeof data === "string") {
      messageData = data;
    } else if (Buffer.isBuffer(data)) {
      messageData = data;
    } else {
      messageData = JSON.stringify(data);
    }

    const message: PubSubMessage = {
      id: messageId,
      data: messageData,
      attributes: attributes ?? {},
      publishTime: new Date(),
    };

    setImmediate(() => {
      this.emitter.emit(`topic:${topic}`, message);
    });

    logger.debug({ topic, messageId }, "Message published to in-memory pub/sub");
    return messageId;
  }

  async subscribe(subscription: string, handler: (message: PubSubMessage) => Promise<void>): Promise<void> {
    logger.debug({ subscription }, "Setting up in-memory pub/sub subscription");

    const existingSubscription = this.subscriptions.get(subscription);
    if (existingSubscription) {
      logger.warn({ subscription }, "Subscription already exists, replacing handler");
      this.emitter.removeListener(
        `topic:${existingSubscription.topic}`,
        (message: PubSubMessage) => void this.createMessageHandler(existingSubscription)(message),
      );
    }

    const topic =
      this.subscriptionTopics.get(subscription) ?? this.extractTopicFromSubscription(subscription);

    const sub: Subscription = {
      name: subscription,
      topic,
      handler,
    };

    this.subscriptions.set(subscription, sub);

    const messageHandler = this.createMessageHandler(sub);
    this.emitter.on(`topic:${topic}`, (message: PubSubMessage) => {
      void messageHandler(message);
    });

    logger.info({ subscription, topic }, "In-memory pub/sub subscription active");
  }

  async createTopic(topic: string): Promise<void> {
    logger.debug({ topic }, "Creating in-memory pub/sub topic");

    if (this.topics.has(topic)) {
      logger.debug({ topic }, "Topic already exists in in-memory pub/sub");
    } else {
      this.topics.add(topic);
      logger.info({ topic }, "In-memory pub/sub topic created");
    }
  }

  async createSubscription(topic: string, subscription: string): Promise<void> {
    logger.debug({ topic, subscription }, "Creating in-memory pub/sub subscription");

    await this.createTopic(topic);

    this.subscriptionTopics.set(subscription, topic);

    logger.info(
      { topic, subscription },
      "In-memory pub/sub subscription created (will be active when subscribed)",
    );
  }

  async close(): Promise<void> {
    logger.debug("Closing in-memory pub/sub connections");

    this.emitter.removeAllListeners();

    this.topics.clear();
    this.subscriptions.clear();
    this.subscriptionTopics.clear();

    logger.info("In-memory pub/sub connections closed");
  }

  private createMessageHandler(subscription: Subscription) {
    return async (message: PubSubMessage) => {
      logger.debug(
        { messageId: message.id, subscription: subscription.name },
        "Processing message in in-memory pub/sub",
      );

      try {
        await subscription.handler(message);
        logger.debug(
          { messageId: message.id, subscription: subscription.name },
          "Message processed successfully",
        );
      } catch (err) {
        logger.error(
          { error: err, messageId: message.id, subscription: subscription.name },
          "Error processing message",
        );

        // In a real pub/sub system, this would nack the message
        // For in-memory, we could implement retry logic here if needed
      }
    };
  }

  private extractTopicFromSubscription(subscription: string): string {
    // Common patterns:
    // - job-queue-worker -> job-queue
    // - notifications-email -> notifications
    // - job-events-audit -> job-events

    const parts = subscription.split("-");
    if (parts.length > 1) {
      return parts.slice(0, -1).join("-");
    }

    return subscription;
  }

  getStats(): {
    topicCount: number;
    subscriptionCount: number;
    listenerCount: number;
  } {
    return {
      topicCount: this.topics.size,
      subscriptionCount: this.subscriptions.size,
      listenerCount: this.emitter.eventNames().length,
    };
  }
}
