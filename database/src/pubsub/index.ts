import { GooglePubSubAdapter } from "./googlePubSub.js";
import { AzureServiceBusAdapter } from "./azureServiceBus.js";
import { InMemoryPubSub } from "./inMemoryPubSub.js";
import { RedisPubSub } from "./redisPubSub.js";
import type { PubSub, PubSubConfig } from "./pubsub.js";
import { IS_LOCAL } from "../env.js";

export type PubSubProvider = "google" | "azure" | "redis" | "memory";

export interface PubSubFactoryConfig extends PubSubConfig {
  provider: PubSubProvider;
}

export function createPubSub(config: PubSubFactoryConfig): PubSub {
  switch (config.provider) {
    case "google":
      return new GooglePubSubAdapter(config);
    case "azure":
      return new AzureServiceBusAdapter(config);
    case "redis":
      return new RedisPubSub(config);
    case "memory":
      return new InMemoryPubSub(config);
    default:
      throw new Error(`Unsupported pub/sub provider: ${String(config.provider)}`);
  }
}

export function getDefaultPubSub(config: PubSubConfig = {}): PubSub {
  if (IS_LOCAL) {
    // For local development, prefer Redis if available, otherwise use in-memory
    const redisUrl = config.connectionString ?? process.env.REDIS_URL;
    if (redisUrl) {
      return new RedisPubSub({ ...config, connectionString: redisUrl });
    }
    return new InMemoryPubSub(config);
  }

  const provider = (process.env.PUBSUB_PROVIDER ?? "google") as PubSubProvider;

  return createPubSub({
    ...config,
    provider,
  });
}

export type { PubSub, PubSubMessage, PubSubSubscription, PubSubConfig } from "./pubsub.js";
export { GooglePubSubAdapter } from "./googlePubSub.js";
export { AzureServiceBusAdapter } from "./azureServiceBus.js";
export { InMemoryPubSub } from "./inMemoryPubSub.js";
export { RedisPubSub } from "./redisPubSub.js";
