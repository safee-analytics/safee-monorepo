import sql from "mssql";
import type { ConnectionPool, config as MSSQLConfig } from "mssql";
import {
  BaseConnector,
  type ConnectorConfig,
  type ConnectionTestResult,
  type ConnectorMetadata,
} from "./base.connector.js";

export interface MSSQLConnectorConfig extends ConnectorConfig {
  host: string;
  port: number;
  database: string;
  username: string;
  password: string;
  encrypt?: boolean;
  trustServerCertificate?: boolean;
  maxConnections?: number;
  connectionTimeout?: number;
  requestTimeout?: number;
}

export class MSSQLConnector extends BaseConnector {
  private pool: ConnectionPool | null = null;

  constructor(metadata: ConnectorMetadata, config: MSSQLConnectorConfig) {
    super(metadata, config);
  }

  async validateConfig(config: ConnectorConfig): Promise<{ valid: boolean; errors?: string[] }> {
    const errors: string[] = [];
    const cfg = config as MSSQLConnectorConfig;

    if (!cfg.host) errors.push("Host is required");
    if (!cfg.port) errors.push("Port is required");
    if (!cfg.database) errors.push("Database is required");
    if (!cfg.username) errors.push("Username is required");
    if (!cfg.password) errors.push("Password is required");

    if (cfg.port && (cfg.port < 1 || cfg.port > 65535)) {
      errors.push("Port must be between 1 and 65535");
    }

    return {
      valid: errors.length === 0,
      errors: errors.length > 0 ? errors : undefined,
    };
  }

  async connect(): Promise<void> {
    if (this.connected && this.pool) {
      return;
    }

    const cfg = this.config as MSSQLConnectorConfig;

    const poolConfig: MSSQLConfig = {
      server: cfg.host,
      port: cfg.port,
      database: cfg.database,
      user: cfg.username,
      password: cfg.password,
      options: {
        encrypt: cfg.encrypt ?? true,
        trustServerCertificate: cfg.trustServerCertificate ?? false,
        enableArithAbort: true,
      },
      pool: {
        max: cfg.maxConnections ?? 10,
        min: 0,
        idleTimeoutMillis: 30000,
      },
      connectionTimeout: cfg.connectionTimeout ?? 5000,
      requestTimeout: cfg.requestTimeout ?? 15000,
    };

    this.pool = new sql.ConnectionPool(poolConfig);
    await this.pool.connect();

    this.connected = true;
  }

  async disconnect(): Promise<void> {
    if (this.pool) {
      await this.pool.close();
      this.pool = null;
    }
    this.connected = false;
  }

  async testConnection(): Promise<ConnectionTestResult> {
    try {
      const { latency } = await this.measureLatency(async () => {
        const cfg = this.config as MSSQLConnectorConfig;
        const testPool = new sql.ConnectionPool({
          server: cfg.host,
          port: cfg.port,
          database: cfg.database,
          user: cfg.username,
          password: cfg.password,
          options: {
            encrypt: cfg.encrypt ?? true,
            trustServerCertificate: cfg.trustServerCertificate ?? false,
            enableArithAbort: true,
          },
          connectionTimeout: 5000,
          requestTimeout: 5000,
        });

        try {
          await testPool.connect();
          const result = await testPool.request().query(`
            SELECT
              @@VERSION as version,
              DB_NAME() as database,
              SUSER_NAME() as username
          `);
          return result.recordset[0];
        } finally {
          await testPool.close();
        }
      });

      return {
        status: "success",
        message: "Successfully connected to MSSQL database",
        latency,
        metadata: {
          database: (this.config as MSSQLConnectorConfig).database,
        },
      };
    } catch (err) {
      return {
        status: "failed",
        message: "Failed to connect to MSSQL database",
        error: err instanceof Error ? err.message : String(err),
      };
    }
  }

  /**
   * Get the connection pool for executing raw SQL queries
   */
  getPool(): ConnectionPool {
    if (!this.connected || !this.pool) {
      throw new Error("Connector is not connected");
    }
    return this.pool;
  }

  /**
   * Execute a raw SQL query on the external database
   */
  async query<T = unknown>(queryString: string, params?: Record<string, unknown>): Promise<T[]> {
    const pool = this.getPool();
    const request = pool.request();

    // Add parameters if provided
    if (params) {
      for (const [key, value] of Object.entries(params)) {
        request.input(key, value);
      }
    }

    const result = await request.query(queryString);
    return result.recordset as T[];
  }

  /**
   * Get schema information from the external database
   */
  async getSchemaInfo(): Promise<{
    tables: { schema: string; name: string; type: string }[];
  }> {
    const tables = await this.query<{ schema: string; name: string; type: string }>(`
      SELECT
        TABLE_SCHEMA as schema,
        TABLE_NAME as name,
        TABLE_TYPE as type
      FROM INFORMATION_SCHEMA.TABLES
      WHERE TABLE_SCHEMA NOT IN ('sys', 'INFORMATION_SCHEMA')
      ORDER BY TABLE_SCHEMA, TABLE_NAME
    `);

    return { tables };
  }

  /**
   * Get columns for a specific table
   */
  async getTableColumns(
    schema: string,
    table: string,
  ): Promise<
    {
      name: string;
      type: string;
      nullable: boolean;
      default: string | null;
    }[]
  > {
    return await this.query(
      `
      SELECT
        COLUMN_NAME as name,
        DATA_TYPE as type,
        CASE WHEN IS_NULLABLE = 'YES' THEN 1 ELSE 0 END as nullable,
        COLUMN_DEFAULT as [default]
      FROM INFORMATION_SCHEMA.COLUMNS
      WHERE TABLE_SCHEMA = @schema AND TABLE_NAME = @table
      ORDER BY ORDINAL_POSITION
    `,
      { schema, table },
    );
  }
}
