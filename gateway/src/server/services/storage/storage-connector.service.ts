import type { DrizzleClient } from "@safee/database";
import { schema } from "@safee/database";
import { eq, and } from "drizzle-orm";
import { StorageFactory, type StorageConfig } from "./storage-factory.js";
import type { StorageAdapter } from "./storage-adapter.interface.js";

/**
 * Storage Connector Service
 * Manages organization-specific storage configurations
 */
export class StorageConnectorService {
  private adapters: Map<string, StorageAdapter> = new Map();

  constructor(private drizzle: DrizzleClient) {}

  /**
   * Get storage adapter for an organization
   */
  async getAdapter(organizationId: string): Promise<StorageAdapter> {
    // Check cache
    const cached = this.adapters.get(organizationId);
    if (cached) return cached;

    // Get active storage connector from database
    const connector = await this.drizzle.query.connectors.findFirst({
      where: and(
        eq(schema.connectors.organizationId, organizationId),
        eq(schema.connectors.isActive, true),
        // Storage connectors start with "storage_"
        // We'll use a simple check on type
      ),
    });

    if (!connector) {
      // Fallback to default local storage
      const adapter = StorageFactory.createAdapter({
        type: "local",
        basePath: `./storage/${organizationId}`,
      });
      this.adapters.set(organizationId, adapter);
      return adapter;
    }

    // Create adapter from connector config
    const config = this.connectorToStorageConfig(connector);
    const adapter = StorageFactory.createAdapter(config);

    // Cache it
    this.adapters.set(organizationId, adapter);

    return adapter;
  }

  /**
   * Convert connector record to storage config
   */
  private connectorToStorageConfig(connector: any): StorageConfig {
    switch (connector.type) {
      case "storage_local":
        return {
          type: "local",
          basePath: connector.config.basePath || `./storage/${connector.organizationId}`,
        };

      case "storage_webdav":
        return {
          type: "webdav",
          url: connector.config.url,
          username: connector.config.username,
          password: connector.config.password,
          basePath: connector.config.basePath,
        };

      case "storage_smb":
        return {
          type: "smb",
          host: connector.config.host,
          share: connector.config.share,
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
