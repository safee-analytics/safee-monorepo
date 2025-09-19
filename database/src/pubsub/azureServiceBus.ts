import {
  ServiceBusClient,
  ServiceBusReceiver,
  ServiceBusSender,
  ServiceBusReceivedMessage,
} from "@azure/service-bus";
import type { PubSub, PubSubMessage, PubSubConfig } from "./pubsub.js";
import { logger } from "../logger.js";

export class AzureServiceBusAdapter implements PubSub {
  private client: ServiceBusClient;
  private receivers = new Map<string, ServiceBusReceiver>();
  private senders = new Map<string, ServiceBusSender>();

  constructor(config: PubSubConfig) {
    if (!config.connectionString) {
      throw new Error("Azure Service Bus connection string is required");
    }

    this.client = new ServiceBusClient(config.connectionString);
  }

  async publish(
    topic: string,
    data: Buffer | string | object,
    attributes?: Record<string, string>,
  ): Promise<string> {
    logger.debug({ topic, attributes }, "Publishing message to Azure Service Bus");

    let sender = this.senders.get(topic);
    if (!sender) {
      sender = this.client.createSender(topic);
      this.senders.set(topic, sender);
    }

    let body: string;
    if (typeof data === "string") {
      body = data;
    } else if (Buffer.isBuffer(data)) {
      body = data.toString("utf8");
    } else {
      body = JSON.stringify(data);
    }

    const message = {
      body,
      applicationProperties: attributes ?? {},
      messageId: `msg-${Date.now()}-${Math.random().toString(36).slice(2, 11)}`,
    };

    await sender.sendMessages(message);

    logger.debug({ topic, messageId: message.messageId }, "Message published to Azure Service Bus");
    return message.messageId;
  }

  async subscribe(subscription: string, handler: (message: PubSubMessage) => Promise<void>): Promise<void> {
    logger.debug({ subscription }, "Setting up Azure Service Bus subscription");

    const receiver = this.client.createReceiver(subscription);
    this.receivers.set(subscription, receiver);

    async function messageHandler(receivedMessage: ServiceBusReceivedMessage): Promise<void> {
      try {
        const pubsubMessage: PubSubMessage = {
          id: String(receivedMessage.messageId ?? `msg-${Date.now()}`),
          data: receivedMessage.body as string | Buffer,
          attributes: (receivedMessage.applicationProperties as Record<string, string> | undefined) ?? {},
          publishTime: receivedMessage.enqueuedTimeUtc
            ? new Date(receivedMessage.enqueuedTimeUtc)
            : undefined,
        };

        await handler(pubsubMessage);
        await receiver.completeMessage(receivedMessage);

        logger.debug({ messageId: pubsubMessage.id, subscription }, "Message processed successfully");
      } catch (err) {
        logger.error(
          { error: err, messageId: receivedMessage.messageId, subscription },
          "Error processing message",
        );
        await receiver.abandonMessage(receivedMessage);
      }
    }

    function errorHandler(error: Error): void {
      logger.error({ error, subscription }, "Azure Service Bus subscription error");
    }

    receiver.subscribe({
      processMessage: messageHandler,
      processError: async (args: { error: Error }) => {
        errorHandler(args.error);
      },
    });

    logger.info({ subscription }, "Azure Service Bus subscription active");
  }

  async createTopic(topic: string): Promise<void> {
    logger.debug({ topic }, "Creating Azure Service Bus topic");
    // Note: Azure Service Bus topics are typically created via Azure portal or ARM templates
    // This is a placeholder - actual implementation would use the Service Bus Management Client
    logger.info({ topic }, "Azure Service Bus topic creation requested (managed via Azure portal)");
  }

  async createSubscription(topic: string, subscription: string): Promise<void> {
    logger.debug({ topic, subscription }, "Creating Azure Service Bus subscription");
    // Note: Azure Service Bus subscriptions are typically created via Azure portal or ARM templates
    // This is a placeholder - actual implementation would use the Service Bus Management Client
    logger.info(
      { topic, subscription },
      "Azure Service Bus subscription creation requested (managed via Azure portal)",
    );
  }

  async close(): Promise<void> {
    logger.debug("Closing Azure Service Bus connections");

    // Close all receivers
    for (const [name, receiver] of this.receivers) {
      try {
        await receiver.close();
        logger.debug({ subscription: name }, "Azure Service Bus receiver closed");
      } catch (err) {
        logger.error({ error: err, subscription: name }, "Error closing Azure Service Bus receiver");
      }
    }

    // Close all senders
    for (const [name, sender] of this.senders) {
      try {
        await sender.close();
        logger.debug({ topic: name }, "Azure Service Bus sender closed");
      } catch (err) {
        logger.error({ error: err, topic: name }, "Error closing Azure Service Bus sender");
      }
    }

    this.receivers.clear();
    this.senders.clear();

    await this.client.close();

    logger.info("Azure Service Bus connections closed");
  }
}
