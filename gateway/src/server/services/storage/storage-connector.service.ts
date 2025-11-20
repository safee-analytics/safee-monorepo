import type { DrizzleClient } from "@safee/database";
import { schema } from "@safee/database";
import { eq, and } from "drizzle-orm";
import { StorageFactory, type StorageConfig } from "./storage-factory.js";
import type { StorageAdapter } from "./storage-adapter.interface.js";

export class StorageConnectorService {
  private adapters: Map<string, StorageAdapter> = new Map();

  constructor(private drizzle: DrizzleClient) {}

  async getAdapter(organizationId: string): Promise<StorageAdapter> {
    const cached = this.adapters.get(organizationId);
    if (cached) return cached;

    const connector = await this.drizzle.query.connectors.findFirst({
      where: and(eq(schema.connectors.organizationId, organizationId), eq(schema.connectors.isActive, true)),
    });

    if (!connector) {
      const adapter = StorageFactory.createAdapter({
        type: "local",
        basePath: `./storage/${organizationId}`,
      });
      this.adapters.set(organizationId, adapter);
      return adapter;
    }

    const config = this.connectorToStorageConfig(connector);
    const adapter = StorageFactory.createAdapter(config);

    this.adapters.set(organizationId, adapter);

    return adapter;
  }

  private connectorToStorageConfig(connector: {
    type: string;
    config: {
      basePath?: string;
      url?: string;
      username?: string;
      password?: string;
      host?: string;
      share?: string;
      domain?: string;
      port?: number;
    };
    organizationId: string;
  }): StorageConfig {
    switch (connector.type) {
      case "storage_local":
        return {
          type: "local",
          basePath: (connector.config.basePath as string) || `./storage/${connector.organizationId}`,
        };

      case "storage_webdav":
        return {
          type: "webdav",
          url: connector.config.url as string,
          username: connector.config.username as string,
          password: connector.config.password as string,
          basePath: connector.config.basePath as string | undefined,
        };

      case "storage_smb":
        return {
          type: "smb",
          host: connector.config.host as string,
          share: connector.config.share as string,
          username: connector.config.username as string | undefined,
          password: connector.config.password as string | undefined,
          domain: connector.config.domain as string | undefined,
          port: connector.config.port as number | undefined,
        };

      case "storage_cloud":
        return {
          type: "cloud",
          organizationId: connector.organizationId,
        };

      default:
        throw new Error(`Unknown storage connector type: ${connector.type}`);
    }
  }

  /**
   * Clear adapter cache (when connector is updated)
   */
  clearCache(organizationId: string): void {
    this.adapters.delete(organizationId);
  }

  /**
   * Test storage connection
   */
  async testConnection(organizationId: string): Promise<boolean> {
    try {
      const adapter = await this.getAdapter(organizationId);
      await adapter.mkdir("/test");
      await adapter.delete("/test");
      return true;
    } catch {
      return false;
    }
  }
}
