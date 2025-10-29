import type { schema } from "@safee/database";

export type ConnectorType = (typeof schema.connectorTypeEnum.enumValues)[number];
export type ConnectionStatus = (typeof schema.connectionStatusEnum.enumValues)[number];

export interface ConnectorConfig {
  host?: string;
  port?: number;
  database?: string;
  username?: string;
  password?: string;
  ssl?: boolean;
  url?: string;
  apiKey?: string;
  authToken?: string;
  [key: string]: unknown;
}

export interface ConnectionTestResult {
  status: ConnectionStatus;
  message: string;
  latency?: number; // ms
  metadata?: Record<string, unknown>;
  error?: string;
}

export interface ConnectorMetadata {
  id: string;
  organizationId: string;
  name: string;
  type: ConnectorType;
  description?: string;
  isActive: boolean;
  tags: string[];
  metadata: Record<string, unknown>;
  createdAt: Date;
  updatedAt: Date;
}

/**
 * Base interface for all connectors
 */
export interface IConnector {
  /**
   * Get connector metadata
   */
  getMetadata(): ConnectorMetadata;

  /**
   * Test the connection to the external system
   */
  testConnection(): Promise<ConnectionTestResult>;

  /**
   * Connect to the external system
   */
  connect(): Promise<void>;

  /**
   * Disconnect from the external system
   */
  disconnect(): Promise<void>;

  /**
   * Check if connector is currently connected
   */
  isConnected(): boolean;

  /**
   * Validate the connector configuration
   */
  validateConfig(config: ConnectorConfig): Promise<{ valid: boolean; errors?: string[] }>;

  /**
   * Get health status
   */
  getHealthStatus(): Promise<{
    healthy: boolean;
    message?: string;
    details?: Record<string, unknown>;
  }>;
}

/**
 * Abstract base class for all connectors
 */
export abstract class BaseConnector implements IConnector {
  protected connected: boolean = false;
  protected config: ConnectorConfig;
  protected metadata: ConnectorMetadata;

  constructor(metadata: ConnectorMetadata, config: ConnectorConfig) {
    this.metadata = metadata;
    this.config = config;
  }

  getMetadata(): ConnectorMetadata {
    return this.metadata;
  }

  abstract testConnection(): Promise<ConnectionTestResult>;

  abstract connect(): Promise<void>;

  abstract disconnect(): Promise<void>;

  isConnected(): boolean {
    return this.connected;
  }

  abstract validateConfig(config: ConnectorConfig): Promise<{ valid: boolean; errors?: string[] }>;

  async getHealthStatus(): Promise<{
    healthy: boolean;
    message?: string;
    details?: Record<string, unknown>;
  }> {
    if (!this.connected) {
      return {
        healthy: false,
        message: "Connector is not connected",
      };
    }

    const testResult = await this.testConnection();
    return {
      healthy: testResult.status === "success",
      message: testResult.message,
      details: {
        latency: testResult.latency,
        ...testResult.metadata,
      },
    };
  }

  /**
   * Helper method to measure operation latency
   */
  protected async measureLatency<T>(operation: () => Promise<T>): Promise<{ result: T; latency: number }> {
    const start = Date.now();
    const result = await operation();
    const latency = Date.now() - start;
    return { result, latency };
  }

  /**
   * Helper method to safely execute operations with error handling
   */
  protected async safeExecute<T>(
    operation: () => Promise<T>,
    errorMessage: string,
  ): Promise<{ success: boolean; result?: T; error?: string }> {
    try {
      const result = await operation();
      return { success: true, result };
    } catch (error) {
      return {
        success: false,
        error: `${errorMessage}: ${error instanceof Error ? error.message : String(error)}`,
      };
    }
  }
}
