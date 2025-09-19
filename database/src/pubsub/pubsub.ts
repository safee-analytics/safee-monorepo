export interface PubSubMessage {
  id: string;
  data: Buffer | string;
  attributes?: Record<string, string>;
  publishTime?: Date;
}

export interface PubSubSubscription {
  name: string;
  topic: string;
}

export interface PubSub {
  /**
   * Publish a message to a topic
   */
  publish(
    topic: string,
    data: Buffer | string | object,
    attributes?: Record<string, string>,
  ): Promise<string>;

  /**
   * Subscribe to messages from a topic
   */
  subscribe(subscription: string, handler: (message: PubSubMessage) => Promise<void>): Promise<void>;

  /**
   * Create a topic if it doesn't exist
   */
  createTopic(topic: string): Promise<void>;

  /**
   * Create a subscription if it doesn't exist
   */
  createSubscription(topic: string, subscription: string): Promise<void>;

  /**
   * Close all connections and cleanup
   */
  close(): Promise<void>;
}

export interface PubSubConfig {
  projectId?: string;
  connectionString?: string;
  credentials?: unknown;
}
