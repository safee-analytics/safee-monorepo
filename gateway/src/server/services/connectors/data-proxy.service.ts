import type { ConnectorManager } from "./connector.manager.js";
import { PostgreSQLConnector } from "./postgresql.connector.js";
import { MySQLConnector } from "./mysql.connector.js";
import { MSSQLConnector } from "./mssql.connector.js";

export interface QueryRequest {
  connectorId: string;
  sql: string;
  params?: any[];
}

export interface QueryResult<T = any> {
  rows: T[];
  rowCount: number;
  executionTime: number;
}

export interface TablePreview {
  schema: string;
  table: string;
  columns: Array<{
    name: string;
    type: string;
    nullable: boolean;
  }>;
  sampleData: any[];
  totalRows: number;
}

/**
 * Data Proxy Service
 * Allows querying external databases without copying data
 */
export class DataProxyService {
  constructor(private connectorManager: ConnectorManager) {}

  /**
   * Execute a raw SQL query on an external database
   */
  async executeQuery<T = any>(
    organizationId: string,
    request: QueryRequest
  ): Promise<QueryResult<T>> {
    const connector = await this.connectorManager.getConnector(request.connectorId, organizationId);

    const startTime = Date.now();
    let rows: any[];

    // Execute query based on connector type
    if (connector instanceof PostgreSQLConnector || connector instanceof MySQLConnector) {
      rows = await connector.query(request.sql, request.params);
    } else if (connector instanceof MSSQLConnector) {
      // MSSQL uses named parameters
      const params = request.params
        ? request.params.reduce((acc, val, idx) => {
            acc[`param${idx}`] = val;
            return acc;
          }, {} as Record<string, any>)
        : undefined;
      rows = await connector.query(request.sql, params);
    } else {
      throw new Error("Unsupported connector type for query execution");
    }

    const executionTime = Date.now() - startTime;

    return {
      rows: rows as T[],
      rowCount: rows.length,
      executionTime,
    };
  }

  /**
   * Get schema information (tables and views)
   */
  async getSchema(organizationId: string, connectorId: string) {
    const connector = await this.connectorManager.getConnector(connectorId, organizationId);

    if (
      connector instanceof PostgreSQLConnector ||
      connector instanceof MySQLConnector ||
      connector instanceof MSSQLConnector
    ) {
      return await connector.getSchemaInfo();
    }

    throw new Error("Unsupported connector type for schema introspection");
  }

  /**
   * Get table structure and preview data
   */
  async getTablePreview(
    organizationId: string,
    connectorId: string,
    schema: string,
    table: string,
    limit: number = 100
  ): Promise<TablePreview> {
    const connector = await this.connectorManager.getConnector(connectorId, organizationId);

    if (
      !(
        connector instanceof PostgreSQLConnector ||
        connector instanceof MySQLConnector ||
        connector instanceof MSSQLConnector
      )
    ) {
      throw new Error("Unsupported connector type");
    }

    // Get columns
    const columns = await connector.getTableColumns(schema, table);

    // Get sample data
    let sampleData: any[];
    let totalRows: number;

    if (connector instanceof PostgreSQLConnector) {
      sampleData = await connector.query(
        `SELECT * FROM "${schema}"."${table}" LIMIT $1`,
        [limit]
      );
      const [countResult] = await connector.query<{ count: string }>(
        `SELECT COUNT(*) as count FROM "${schema}"."${table}"`
      );
      totalRows = parseInt(countResult.count, 10);
    } else if (connector instanceof MySQLConnector) {
      sampleData = await connector.query(
        `SELECT * FROM \`${schema}\`.\`${table}\` LIMIT ?`,
        [limit]
      );
      const [countResult] = await connector.query<{ count: number }>(
        `SELECT COUNT(*) as count FROM \`${schema}\`.\`${table}\``
      );
      totalRows = countResult.count;
    } else {
      // MSSQL
      sampleData = await connector.query(
        `SELECT TOP ${limit} * FROM [${schema}].[${table}]`
      );
      const [countResult] = await connector.query<{ count: number }>(
        `SELECT COUNT(*) as count FROM [${schema}].[${table}]`
      );
      totalRows = countResult.count;
    }

    return {
      schema,
      table,
      columns,
      sampleData,
      totalRows,
    };
  }

  /**
   * Execute a paginated query
   */
  async executePaginatedQuery<T = any>(
    organizationId: string,
    connectorId: string,
    params: {
      schema: string;
      table: string;
      columns?: string[];
      where?: Record<string, any>;
      orderBy?: { column: string; direction: "ASC" | "DESC" }[];
      limit: number;
      offset: number;
    }
  ): Promise<{
    rows: T[];
    total: number;
    page: number;
    pageSize: number;
    hasMore: boolean;
  }> {
    const connector = await this.connectorManager.getConnector(connectorId, organizationId);

    if (
      !(
        connector instanceof PostgreSQLConnector ||
        connector instanceof MySQLConnector ||
        connector instanceof MSSQLConnector
      )
    ) {
      throw new Error("Unsupported connector type");
    }

    const { schema, table, columns, where, orderBy, limit, offset } = params;
    const selectColumns = columns ? columns.join(", ") : "*";

    // Build WHERE clause
    let whereClause = "";
    const whereParams: any[] = [];
    if (where && Object.keys(where).length > 0) {
      const conditions = Object.entries(where).map(([key, value], idx) => {
        whereParams.push(value);
        return connector instanceof MSSQLConnector
          ? `[${key}] = @param${idx}`
          : connector instanceof MySQLConnector
          ? `\`${key}\` = ?`
          : `"${key}" = $${idx + 1}`;
      });
      whereClause = `WHERE ${conditions.join(" AND ")}`;
    }

    // Build ORDER BY clause
    let orderByClause = "";
    if (orderBy && orderBy.length > 0) {
      const orders = orderBy.map((o) => {
        const col =
          connector instanceof MSSQLConnector
            ? `[${o.column}]`
            : connector instanceof MySQLConnector
            ? `\`${o.column}\``
            : `"${o.column}"`;
        return `${col} ${o.direction}`;
      });
      orderByClause = `ORDER BY ${orders.join(", ")}`;
    }

    // Build query based on database type
    let dataQuery: string;
    let countQuery: string;

    if (connector instanceof PostgreSQLConnector) {
      dataQuery = `
        SELECT ${selectColumns}
        FROM "${schema}"."${table}"
        ${whereClause}
        ${orderByClause}
        LIMIT $${whereParams.length + 1} OFFSET $${whereParams.length + 2}
      `;
      countQuery = `SELECT COUNT(*) as count FROM "${schema}"."${table}" ${whereClause}`;
    } else if (connector instanceof MySQLConnector) {
      dataQuery = `
        SELECT ${selectColumns}
        FROM \`${schema}\`.\`${table}\`
        ${whereClause}
        ${orderByClause}
        LIMIT ? OFFSET ?
      `;
      countQuery = `SELECT COUNT(*) as count FROM \`${schema}\`.\`${table}\` ${whereClause}`;
    } else {
      // MSSQL
      dataQuery = `
        SELECT ${selectColumns}
        FROM [${schema}].[${table}]
        ${whereClause}
        ${orderByClause}
        OFFSET ${offset} ROWS FETCH NEXT ${limit} ROWS ONLY
      `;
      countQuery = `SELECT COUNT(*) as count FROM [${schema}].[${table}] ${whereClause}`;
    }

    // Execute queries
    const rows = await connector.query<T>(dataQuery, [...whereParams, limit, offset]);
    const [countResult] = await connector.query<{ count: number | string }>(
      countQuery,
      whereParams
    );

    const total = typeof countResult.count === "string"
      ? parseInt(countResult.count, 10)
      : countResult.count;

    return {
      rows,
      total,
      page: Math.floor(offset / limit) + 1,
      pageSize: limit,
      hasMore: offset + limit < total,
    };
  }

  /**
   * Search across multiple columns
   */
  async searchTable<T = any>(
    organizationId: string,
    connectorId: string,
    params: {
      schema: string;
      table: string;
      searchColumns: string[];
      searchTerm: string;
      limit?: number;
    }
  ): Promise<T[]> {
    const connector = await this.connectorManager.getConnector(connectorId, organizationId);

    if (
      !(
        connector instanceof PostgreSQLConnector ||
        connector instanceof MySQLConnector ||
        connector instanceof MSSQLConnector
      )
    ) {
      throw new Error("Unsupported connector type");
    }

    const { schema, table, searchColumns, searchTerm, limit = 50 } = params;
    const searchPattern = `%${searchTerm}%`;

    // Build search conditions
    let conditions: string[];
    if (connector instanceof PostgreSQLConnector) {
      conditions = searchColumns.map(
        (col) => `"${col}"::text ILIKE $1`
      );
    } else if (connector instanceof MySQLConnector) {
      conditions = searchColumns.map((col) => `\`${col}\` LIKE ?`);
    } else {
      // MSSQL
      conditions = searchColumns.map((col) => `CAST([${col}] AS NVARCHAR(MAX)) LIKE @searchTerm`);
    }

    const whereClause = conditions.join(" OR ");

    let query: string;
    if (connector instanceof PostgreSQLConnector) {
      query = `
        SELECT * FROM "${schema}"."${table}"
        WHERE ${whereClause}
        LIMIT $2
      `;
      return await connector.query<T>(query, [searchPattern, limit]);
    } else if (connector instanceof MySQLConnector) {
      query = `
        SELECT * FROM \`${schema}\`.\`${table}\`
        WHERE ${whereClause}
        LIMIT ?
      `;
      return await connector.query<T>(query, [searchPattern, limit]);
    } else {
      // MSSQL
      query = `
        SELECT TOP ${limit} * FROM [${schema}].[${table}]
        WHERE ${whereClause}
      `;
      return await connector.query<T>(query, { searchTerm: searchPattern });
    }
  }
}
