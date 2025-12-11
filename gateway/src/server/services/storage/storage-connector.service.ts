import type { DrizzleClient } from "@safee/database";
import { schema } from "@safee/database";
import { eq, and } from "@safee/database";
import { StorageFactory, type StorageConfig } from "./storage-factory.js";
import type { StorageAdapter } from "./storage-adapter.interface.js";

export class StorageConnectorService {
  private adapters = new Map<string, StorageAdapter>();

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
          basePath: (connector.config.basePath!) || `./storage/${connector.organizationId}`,
        };

      case "storage_webdav":
        return {
          type: "webdav",
          url: connector.config.url!,
          username: connector.config.username!,
          password: connector.config.password!,
          basePath: connector.config.basePath,
        };

      case "storage_smb":
        return {
          type: "smb",
          host: connector.config.host!,
          share: connector.config.share!,
          username: connector.config.username,
          password: connector.config.password,
          domain: connector.config.domain,
          port: connector.config.port,
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
