import { schema, eq, and } from "@safee/database";
import {
  type ConnectorMetadata,
  type IConnector,
  type ConnectorType,
  type ConnectorConfig,
} from "./base.connector.js";
import { ConnectorFactory } from "./connector.factory.js";
import { encryptionService } from "../encryption.js";
import { z } from "zod";
import type { ServerContext } from "../../serverContext.js";

const { connectors } = schema;

// Schema for the actual config object structure from database
// jsonb can store either encrypted string or object (we store encrypted string)
const configWrapperSchema = z.union([z.string(), z.record(z.string(), z.unknown())]);

// Zod schemas for each connector type
const postgresqlConfigSchema = z.object({
  host: z.string(),
  port: z.number(),
  database: z.string(),
  username: z.string(),
  password: z.string(),
  ssl: z.boolean().optional(),
  maxConnections: z.number().optional(),
  connectionTimeout: z.number().optional(),
});

const mysqlConfigSchema = z.object({
  host: z.string(),
  port: z.number(),
  database: z.string(),
  username: z.string(),
  password: z.string(),
  ssl: z.boolean().optional(),
  maxConnections: z.number().optional(),
  connectionTimeout: z.number().optional(),
});

const mssqlConfigSchema = z.object({
  host: z.string(),
  port: z.number(),
  database: z.string(),
  username: z.string(),
  password: z.string(),
  encrypt: z.boolean().optional(),
  trustServerCertificate: z.boolean().optional(),
  maxConnections: z.number().optional(),
  connectionTimeout: z.number().optional(),
  requestTimeout: z.number().optional(),
});

// Union type for all connector configs
const connectorConfigSchema = z.union([postgresqlConfigSchema, mysqlConfigSchema, mssqlConfigSchema]);

/**
 * Service for managing database connectors
 * Handles CRUD operations, connection pooling, and lifecycle management
 */
export class ConnectorManager {
  // In-memory cache of active connector instances
  private activeConnectors = new Map<string, IConnector>();

  constructor(private readonly ctx: ServerContext) {}

  private get drizzle() {
    return this.ctx.drizzle;
  }

  private get logger() {
    return this.ctx.logger;
  }

  /**
   * Create a new connector
   */
  async createConnector(params: {
    organizationId: string;
    name: string;
    description?: string;
    type: ConnectorMetadata["type"];
    config: ConnectorConfig;
    tags?: string[];
    metadata?: Record<string, unknown>;
    createdBy?: string;
  }): Promise<{ id: string; connector: IConnector }> {
    // Validate config before saving
    const validation = await ConnectorFactory.validateConfig(params.type, params.config);
    if (!validation.valid) {
      throw new Error(`Invalid connector configuration: ${validation.errors?.join(", ")}`);
    }

    // Encrypt sensitive config data
    const encryptedConfig = await encryptionService.encrypt(JSON.stringify(params.config));

    // Create database record
    // Note: config is jsonb, so we store the encrypted string which Postgres will accept
    const [record] = await this.drizzle
      .insert(connectors)
      .values({
        organizationId: params.organizationId,
        name: params.name,
        description: params.description,
        type: params.type,
        config: encryptedConfig as unknown as Record<string, unknown>,
        tags: params.tags || [],
        metadata: params.metadata || {},
        createdBy: params.createdBy,
        updatedBy: params.createdBy,
      })
      .returning();

    // Create connector instance
    const metadata: ConnectorMetadata = {
      id: record.id,
      organizationId: record.organizationId,
      name: record.name,
      type: record.type as ConnectorMetadata["type"],
      description: record.description || undefined,
      isActive: record.isActive,
      tags: (record.tags as string[]) || [],
      metadata: (record.metadata as Record<string, unknown>) || {},
      createdAt: record.createdAt,
      updatedAt: record.updatedAt,
    };

    const connector = ConnectorFactory.create(metadata, params.config);

    // Test connection
    const testResult = await connector.testConnection();
    if (testResult.status === "failed") {
      // Update database with failed status
      await this.drizzle
        .update(connectors)
        .set({
          lastConnectionTest: new Date(),
          lastConnectionStatus: "failed",
          lastConnectionError: testResult.error,
        })
        .where(eq(connectors.id, record.id));

      throw new Error(`Connection test failed: ${testResult.error}`);
    }

    // Update database with success status
    await this.drizzle
      .update(connectors)
      .set({
        lastConnectionTest: new Date(),
        lastConnectionStatus: "success",
        lastConnectionError: null,
      })
      .where(eq(connectors.id, record.id));

    return { id: record.id, connector };
  }

  /**
   * Get a connector by ID (loads from cache or creates new instance)
   */
  async getConnector(connectorId: string, organizationId: string): Promise<IConnector> {
    // Check cache first
    const cached = this.activeConnectors.get(connectorId);
    if (cached) {
      return cached;
    }

    // Load from database
    const [record] = await this.drizzle
      .select()
      .from(connectors)
      .where(and(eq(connectors.id, connectorId), eq(connectors.organizationId, organizationId)));

    if (!record) {
      throw new Error(`Connector ${connectorId} not found`);
    }

    if (!record.isActive) {
      throw new Error(`Connector ${connectorId} is not active`);
    }

    // Validate and decrypt config
    const configValue = configWrapperSchema.parse(record.config);
    const encryptedConfig = typeof configValue === "string" ? configValue : JSON.stringify(configValue);
    const decryptedConfigRaw = await encryptionService.decrypt(encryptedConfig);
    const decryptedConfig = connectorConfigSchema.parse(JSON.parse(decryptedConfigRaw));

    // Create metadata
    const metadata: ConnectorMetadata = {
      id: record.id,
      organizationId: record.organizationId,
      name: record.name,
      type: record.type as ConnectorMetadata["type"],
      description: record.description || undefined,
      isActive: record.isActive,
      tags: (record.tags as string[]) || [],
      metadata: (record.metadata as Record<string, unknown>) || {},
      createdAt: record.createdAt,
      updatedAt: record.updatedAt,
    };

    // Create connector instance
    const connector = ConnectorFactory.create(metadata, decryptedConfig);

    // Connect if not already connected
    if (!connector.isConnected()) {
      await connector.connect();
    }

    // Cache the instance
    this.activeConnectors.set(connectorId, connector);

    return connector;
  }

  /**
   * List all connectors for an organization
   */
  async listConnectors(
    organizationId: string,
    filters?: {
      type?: ConnectorType;
      isActive?: boolean;
      tags?: string[];
    },
  ) {
    const conditions = [eq(connectors.organizationId, organizationId)];

    // Apply filters
    if (filters?.type) {
      conditions.push(eq(connectors.type, filters.type));
    }

    if (filters?.isActive !== undefined) {
      conditions.push(eq(connectors.isActive, filters.isActive));
    }

    const results = await this.drizzle
      .select()
      .from(connectors)
      .where(and(...conditions));

    // Filter by tags if provided
    if (filters?.tags && filters.tags.length > 0) {
      return results.filter((r: typeof connectors.$inferSelect) =>
        filters.tags!.some((tag) => (r.tags as string[])?.includes(tag)),
      );
    }

    return results;
  }

  /**
   * Update connector configuration
   */
  async updateConnector(
    connectorId: string,
    organizationId: string,
    updates: {
      name?: string;
      description?: string;
      config?: ConnectorConfig;
      tags?: string[];
      metadata?: Record<string, unknown>;
      isActive?: boolean;
      updatedBy?: string;
    },
  ) {
    const [existing] = await this.drizzle
      .select()
      .from(connectors)
      .where(and(eq(connectors.id, connectorId), eq(connectors.organizationId, organizationId)));

    if (!existing) {
      throw new Error(`Connector ${connectorId} not found`);
    }

    type UpdateDataType = Partial<typeof connectors.$inferInsert> & {
      updatedAt: Date;
    };

    const updateData: UpdateDataType = {
      updatedAt: new Date(),
      updatedBy: updates.updatedBy,
    };

    if (updates.name) updateData.name = updates.name;
    if (updates.description !== undefined) updateData.description = updates.description;
    if (updates.tags) updateData.tags = updates.tags;
    if (updates.metadata) updateData.metadata = updates.metadata;
    if (updates.isActive !== undefined) updateData.isActive = updates.isActive;

    // If config is being updated, validate and encrypt it
    if (updates.config) {
      const validation = await ConnectorFactory.validateConfig(
        existing.type as ConnectorMetadata["type"],
        updates.config,
      );
      if (!validation.valid) {
        throw new Error(`Invalid connector configuration: ${validation.errors?.join(", ")}`);
      }

      const encryptedNewConfig = await encryptionService.encrypt(JSON.stringify(updates.config));
      updateData.config = encryptedNewConfig as unknown as typeof connectors.$inferInsert.config;

      // Test new connection
      const metadata: ConnectorMetadata = {
        id: existing.id,
        organizationId: existing.organizationId,
        name: existing.name,
        type: existing.type as ConnectorMetadata["type"],
        description: existing.description || undefined,
        isActive: existing.isActive,
        tags: (existing.tags as string[]) || [],
        metadata: (existing.metadata as Record<string, unknown>) || {},
        createdAt: existing.createdAt,
        updatedAt: existing.updatedAt,
      };

      const testConnector = ConnectorFactory.create(metadata, updates.config);
      const testResult = await testConnector.testConnection();

      if (testResult.status === "failed") {
        throw new Error(`Connection test failed: ${testResult.error}`);
      }

      updateData.lastConnectionTest = new Date();
      updateData.lastConnectionStatus = "success";
      updateData.lastConnectionError = null;

      // Invalidate cache
      this.disconnectConnector(connectorId);
    }

    await this.drizzle.update(connectors).set(updateData).where(eq(connectors.id, connectorId));

    return { success: true };
  }

  /**
   * Test connection for a connector
   */
  async testConnection(connectorId: string, organizationId: string) {
    const connector = await this.getConnector(connectorId, organizationId);
    const result = await connector.testConnection();

    // Update database with test results
    await this.drizzle
      .update(connectors)
      .set({
        lastConnectionTest: new Date(),
        lastConnectionStatus: result.status,
        lastConnectionError: result.error || null,
      })
      .where(eq(connectors.id, connectorId));

    return result;
  }

  /**
   * Delete a connector
   */
  async deleteConnector(connectorId: string, organizationId: string) {
    // Disconnect if active
    this.disconnectConnector(connectorId);

    // Delete from database
    await this.drizzle
      .delete(connectors)
      .where(and(eq(connectors.id, connectorId), eq(connectors.organizationId, organizationId)));

    return { success: true };
  }

  /**
   * Disconnect a connector and remove from cache
   */
  async disconnectConnector(connectorId: string) {
    const connector = this.activeConnectors.get(connectorId);
    if (connector) {
      await connector.disconnect();
      this.activeConnectors.delete(connectorId);
    }
  }

  /**
   * Disconnect all connectors (useful for cleanup/shutdown)
   */
  async disconnectAll() {
    const promises = Array.from(this.activeConnectors.keys()).map((id) => this.disconnectConnector(id));
    await Promise.all(promises);
  }

  /**
   * Get connector health status
   */
  async getConnectorHealth(connectorId: string, organizationId: string) {
    const connector = await this.getConnector(connectorId, organizationId);
    return await connector.getHealthStatus();
  }
}
