import { Pool } from "pg";
import {
  BaseConnector,
  type ConnectorConfig,
  type ConnectionTestResult,
  type ConnectorMetadata,
} from "./base.connector.js";

export interface PostgreSQLConfig extends ConnectorConfig {
  host: string;
  port: number;
  database: string;
  username: string;
  password: string;
  ssl?: boolean;
  maxConnections?: number;
  connectionTimeout?: number;
}

export class PostgreSQLConnector extends BaseConnector {
  private pool: Pool | null = null;

  constructor(metadata: ConnectorMetadata, config: PostgreSQLConfig) {
    super(metadata, config);
  }

  async validateConfig(config: ConnectorConfig): Promise<{ valid: boolean; errors?: string[] }> {
    const errors: string[] = [];
    const cfg = config as PostgreSQLConfig;

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

    const cfg = this.config as PostgreSQLConfig;

    this.pool = new Pool({
      host: cfg.host,
      port: cfg.port,
      database: cfg.database,
      user: cfg.username,
      password: cfg.password,
      ssl: cfg.ssl ? { rejectUnauthorized: false } : false,
      max: cfg.maxConnections ?? 10,
      connectionTimeoutMillis: cfg.connectionTimeout ?? 5000,
      idleTimeoutMillis: 30000,
    });

    // Test the connection
    const client = await this.pool.connect();
    client.release();

    this.connected = true;
  }

  async disconnect(): Promise<void> {
    if (this.pool) {
      await this.pool.end();
      this.pool = null;
    }
    this.connected = false;
  }

  async testConnection(): Promise<ConnectionTestResult> {
    try {
      const { latency } = await this.measureLatency(async () => {
        const cfg = this.config as PostgreSQLConfig;
        const testPool = new Pool({
          host: cfg.host,
          port: cfg.port,
          database: cfg.database,
          user: cfg.username,
          password: cfg.password,
          ssl: cfg.ssl ? { rejectUnauthorized: false } : false,
          max: 1,
          connectionTimeoutMillis: 5000,
        });

        try {
          const client = await testPool.connect();
          const result = await client.query("SELECT version(), current_database(), current_user");
          client.release();
          return result.rows[0];
        } finally {
          await testPool.end();
        }
      });

      return {
        status: "success",
        message: "Successfully connected to PostgreSQL database",
        latency,
        metadata: {
          database: (this.config as PostgreSQLConfig).database,
        },
      };
    } catch (err) {
      return {
        status: "failed",
        message: "Failed to connect to PostgreSQL database",
        error: err instanceof Error ? err.message : String(err),
      };
    }
  }

  /**
   * Get the connection pool for executing raw SQL queries
   * Use pool.query() to execute queries on the external database
   */
  getPool(): Pool {
    if (!this.connected || !this.pool) {
      throw new Error("Connector is not connected");
    }
    return this.pool;
  }

  /**
   * Execute a raw SQL query on the external database
   */
  async query<T = unknown>(sql: string, params?: unknown[]): Promise<T[]> {
    const pool = this.getPool();
    const result = await pool.query(sql, params);
    return result.rows;
  }

  /**
   * Get schema information from the external database
   */
  async getSchemaInfo(): Promise<{
    tables: { schema: string; name: string; type: string }[];
  }> {
    const tables = await this.query<{ schema: string; name: string; type: string }>(`
      SELECT
        table_schema as schema,
        table_name as name,
        table_type as type
      FROM information_schema.tables
      WHERE table_schema NOT IN ('pg_catalog', 'information_schema')
      ORDER BY table_schema, table_name
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
        column_name as name,
        data_type as type,
        is_nullable = 'YES' as nullable,
        column_default as default
      FROM information_schema.columns
      WHERE table_schema = $1 AND table_name = $2
      ORDER BY ordinal_position
    `,
      [schema, table],
    );
  }
}
