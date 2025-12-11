import mysql from "mysql2/promise";
import type { Pool, PoolOptions } from "mysql2/promise";
import {
  BaseConnector,
  type ConnectorConfig,
  type ConnectionTestResult,
  type ConnectorMetadata,
} from "./base.connector.js";

export interface MySQLConfig extends ConnectorConfig {
  host: string;
  port: number;
  database: string;
  username: string;
  password: string;
  ssl?: boolean;
  maxConnections?: number;
  connectionTimeout?: number;
}

export class MySQLConnector extends BaseConnector {
  private pool: Pool | null = null;

  constructor(metadata: ConnectorMetadata, config: MySQLConfig) {
    super(metadata, config);
  }

  async validateConfig(config: ConnectorConfig): Promise<{ valid: boolean; errors?: string[] }> {
    const errors: string[] = [];
    const cfg = config as MySQLConfig;

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

    const cfg = this.config as MySQLConfig;

    const poolConfig: PoolOptions = {
      host: cfg.host,
      port: cfg.port,
      database: cfg.database,
      user: cfg.username,
      password: cfg.password,
      ssl: cfg.ssl ? { rejectUnauthorized: false } : undefined,
      connectionLimit: cfg.maxConnections || 10,
      connectTimeout: cfg.connectionTimeout || 5000,
      waitForConnections: true,
      queueLimit: 0,
    };

    this.pool = mysql.createPool(poolConfig);

    // Test the connection
    const connection = await this.pool.getConnection();
    connection.release();

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
        const cfg = this.config as MySQLConfig;
        const testPool = mysql.createPool({
          host: cfg.host,
          port: cfg.port,
          database: cfg.database,
          user: cfg.username,
          password: cfg.password,
          ssl: cfg.ssl ? { rejectUnauthorized: false } : undefined,
          connectionLimit: 1,
          connectTimeout: 5000,
        });

        try {
          const connection = await testPool.getConnection();
          const [rows] = await connection.query(
            "SELECT VERSION() as version, DATABASE() as database, USER() as user",
          );
          connection.release();
          return rows;
        } finally {
          await testPool.end();
        }
      });

      return {
        status: "success",
        message: "Successfully connected to MySQL database",
        latency,
        metadata: {
          database: (this.config as MySQLConfig).database,
        },
      };
    } catch (err) {
      return {
        status: "failed",
        message: "Failed to connect to MySQL database",
        error: err instanceof Error ? err.message : String(err),
      };
    }
  }

  /**
   * Get the connection pool for executing raw SQL queries
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
    const [rows] = await pool.query(sql, params);
    return rows as T[];
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
      FROM information_schema.TABLES
      WHERE TABLE_SCHEMA NOT IN ('mysql', 'information_schema', 'performance_schema', 'sys')
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
        IS_NULLABLE = 'YES' as nullable,
        COLUMN_DEFAULT as \`default\`
      FROM information_schema.COLUMNS
      WHERE TABLE_SCHEMA = ? AND TABLE_NAME = ?
      ORDER BY ORDINAL_POSITION
    `,
      [schema, table],
    );
  }
}
