import type { schema as _schema } from "@safee/database";

export type ConnectorType =
  | "postgresql"
  | "mysql"
  | "mssql"
  | "storage_local"
  | "storage_webdav"
  | "storage_smb"
  | "storage_cloud";

export type ConnectionStatus = "success" | "failed" | "untested";

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

export interface IConnector {
  getMetadata(): ConnectorMetadata;

  testConnection(): Promise<ConnectionTestResult>;

  connect(): Promise<void>;

  disconnect(): Promise<void>;

  isConnected(): boolean;

  validateConfig(config: ConnectorConfig): Promise<{ valid: boolean; errors?: string[] }>;

  getHealthStatus(): Promise<{
    healthy: boolean;
    message?: string;
    details?: Record<string, unknown>;
  }>;
}

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
