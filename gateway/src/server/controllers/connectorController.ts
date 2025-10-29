import {
  Controller,
  Get,
  Post,
  Put,
  Delete,
  Route,
  Tags,
  Security,
  NoSecurity,
  Query,
  Body,
  Path,
  SuccessResponse,
  Request,
} from "tsoa";
import type { Request as ExpressRequest } from "express";
import { getServerContext } from "../serverContext.js";
import { ConnectorManager } from "../services/connectors/connector.manager.js";
import { DataProxyService } from "../services/connectors/data-proxy.service.js";
import { DataMapperService } from "../services/connectors/data-mapper.service.js";
import { ConnectorFactory } from "../services/connectors/connector.factory.js";
import type { PostgreSQLConfig } from "../services/connectors/postgresql.connector.js";
import type { MySQLConfig } from "../services/connectors/mysql.connector.js";
import type { MSSQLConnectorConfig } from "../services/connectors/mssql.connector.js";

// Explicit type for TSOA (can't resolve dynamic enum types)
type ConnectorType = "postgresql" | "mysql" | "mssql";

// Request/Response types
interface CreateConnectorRequest {
  name: string;
  description?: string;
  type: ConnectorType;
  config: PostgreSQLConfig | MySQLConfig | MSSQLConnectorConfig;
  tags?: string[];
  metadata?: Record<string, unknown>;
}

interface UpdateConnectorRequest {
  name?: string;
  description?: string;
  config?: PostgreSQLConfig | MySQLConfig | MSSQLConnectorConfig;
  tags?: string[];
  metadata?: Record<string, unknown>;
  isActive?: boolean;
}

interface ConnectorResponse {
  id: string;
  organizationId: string;
  name: string;
  description?: string;
  type: ConnectorType;
  isActive: boolean;
  tags: string[];
  metadata: Record<string, unknown>;
  lastConnectionTest?: string;
  lastConnectionStatus?: string;
  lastConnectionError?: string;
  createdAt: string;
  updatedAt: string;
}

interface QueryRequest {
  sql: string;
  params?: unknown[];
}

interface QueryResponse<T = unknown> {
  rows: T[];
  rowCount: number;
  executionTime: number;
}

interface SchemaResponse {
  tables: Array<{
    schema: string;
    name: string;
    type: "table" | "view";
  }>;
}

interface TablePreviewResponse {
  schema: string;
  table: string;
  columns: Array<{
    name: string;
    type: string;
    nullable: boolean;
  }>;
  sampleData: unknown[];
  totalRows: number;
}

interface FieldMapping {
  sourceColumn: string;
  targetField: string;
  transform?: "lowercase" | "uppercase" | "trim" | "date" | "number" | "boolean";
  defaultValue?: unknown;
}

interface SuggestMappingsRequest {
  sourceColumns: string[];
  targetEntity: "contact" | "deal" | "company" | "invoice" | "employee" | "custom";
}

@Route("connectors")
@Tags("Connectors")
export class ConnectorController extends Controller {
  @NoSecurity()
  private getServices(req: ExpressRequest) {
    const ctx = getServerContext();
    const connectorManager = new ConnectorManager(ctx.drizzle);
    const dataProxyService = new DataProxyService(connectorManager);
    const dataMapperService = new DataMapperService(dataProxyService);

    return {
      connectorManager,
      dataProxyService,
      dataMapperService,
      ctx,
      organizationId: req.user?.organizationId || "",
      userId: req.user?.userId || "",
    };
  }

  /**
   * Get available connector types and their field definitions
   */
  @Get("/types")
  @Security("jwt")
  public async getConnectorTypes(): Promise<
    Array<{
      type: ConnectorType;
      name: string;
      description: string;
      requiredFields: string[];
      optionalFields: string[];
    }>
  > {
    return ConnectorFactory.getAvailableTypes();
  }

  /**
   * Get field definitions for a specific connector type
   */
  @Get("/types/{type}/fields")
  @Security("jwt")
  public async getFieldDefinitions(@Path() type: ConnectorType): Promise<
    Array<{
      name: string;
      type: "text" | "number" | "password" | "boolean";
      label: string;
      placeholder?: string;
      required: boolean;
      defaultValue?: unknown;
      helpText?: string;
    }>
  > {
    return ConnectorFactory.getFieldDefinitions(type);
  }

  /**
   * List all connectors for the current organization
   */
  @Get("/")
  @Security("jwt")
  public async listConnectors(
    @Request() req: ExpressRequest,
    @Query() type?: ConnectorType,
    @Query() isActive?: boolean,
    @Query() tags?: string,
  ): Promise<ConnectorResponse[]> {
    const { connectorManager, organizationId } = this.getServices(req);

    const filters: { type?: ConnectorType; isActive?: boolean; tags?: string[] } = {};
    if (type) filters.type = type;
    if (isActive !== undefined) filters.isActive = isActive;
    if (tags) filters.tags = tags.split(",");

    const connectors = await connectorManager.listConnectors(organizationId, filters);

    return connectors.map((c) => ({
      id: c.id,
      organizationId: c.organizationId,
      name: c.name,
      description: c.description || undefined,
      type: c.type as ConnectorType,
      isActive: c.isActive,
      tags: (c.tags as string[]) || [],
      metadata: (c.metadata as Record<string, unknown>) || {},
      lastConnectionTest: c.lastConnectionTest?.toISOString(),
      lastConnectionStatus: c.lastConnectionStatus || undefined,
      lastConnectionError: c.lastConnectionError || undefined,
      createdAt: c.createdAt.toISOString(),
      updatedAt: c.updatedAt.toISOString(),
    }));
  }

  /**
   * Create a new connector
   */
  @Post("/")
  @Security("jwt")
  @SuccessResponse("201", "Connector created successfully")
  public async createConnector(
    @Request() req: ExpressRequest,
    @Body() request: CreateConnectorRequest,
  ): Promise<ConnectorResponse> {
    const { connectorManager, organizationId, userId } = this.getServices(req);

    const { connector } = await connectorManager.createConnector({
      organizationId,
      name: request.name,
      description: request.description,
      type: request.type,
      config: request.config,
      tags: request.tags,
      metadata: request.metadata,
      createdBy: userId,
    });

    this.setStatus(201);

    const metadata = connector.getMetadata();
    return {
      id: metadata.id,
      organizationId: metadata.organizationId,
      name: metadata.name,
      description: metadata.description,
      type: metadata.type,
      isActive: metadata.isActive,
      tags: metadata.tags,
      metadata: metadata.metadata,
      createdAt: metadata.createdAt.toISOString(),
      updatedAt: metadata.updatedAt.toISOString(),
    };
  }

  /**
   * Get a specific connector by ID
   */
  @Get("/{connectorId}")
  @Security("jwt")
  public async getConnector(
    @Request() req: ExpressRequest,
    @Path() connectorId: string,
  ): Promise<ConnectorResponse> {
    const { connectorManager, organizationId } = this.getServices(req);

    const connector = await connectorManager.getConnector(connectorId, organizationId);
    const metadata = connector.getMetadata();

    return {
      id: metadata.id,
      organizationId: metadata.organizationId,
      name: metadata.name,
      description: metadata.description,
      type: metadata.type,
      isActive: metadata.isActive,
      tags: metadata.tags,
      metadata: metadata.metadata,
      createdAt: metadata.createdAt.toISOString(),
      updatedAt: metadata.updatedAt.toISOString(),
    };
  }

  /**
   * Update a connector
   */
  @Put("/{connectorId}")
  @Security("jwt")
  public async updateConnector(
    @Request() req: ExpressRequest,
    @Path() connectorId: string,
    @Body() request: UpdateConnectorRequest,
  ): Promise<{ success: boolean }> {
    const { connectorManager, organizationId, userId } = this.getServices(req);

    return await connectorManager.updateConnector(connectorId, organizationId, {
      ...request,
      updatedBy: userId,
    });
  }

  /**
   * Delete a connector
   */
  @Delete("/{connectorId}")
  @Security("jwt")
  public async deleteConnector(
    @Request() req: ExpressRequest,
    @Path() connectorId: string,
  ): Promise<{ success: boolean }> {
    const { connectorManager, organizationId } = this.getServices(req);

    return await connectorManager.deleteConnector(connectorId, organizationId);
  }

  /**
   * Test connection for a connector
   */
  @Post("/{connectorId}/test")
  @Security("jwt")
  public async testConnection(
    @Request() req: ExpressRequest,
    @Path() connectorId: string,
  ): Promise<{
    status: string;
    message: string;
    latency?: number;
    metadata?: Record<string, unknown>;
    error?: string;
  }> {
    const { connectorManager, organizationId } = this.getServices(req);

    return await connectorManager.testConnection(connectorId, organizationId);
  }

  /**
   * Get health status for a connector
   */
  @Get("/{connectorId}/health")
  @Security("jwt")
  public async getHealth(
    @Request() req: ExpressRequest,
    @Path() connectorId: string,
  ): Promise<{
    healthy: boolean;
    message?: string;
    details?: Record<string, unknown>;
  }> {
    const { connectorManager, organizationId } = this.getServices(req);

    return await connectorManager.getConnectorHealth(connectorId, organizationId);
  }

  /**
   * Execute a raw SQL query on an external database
   */
  @Post("/{connectorId}/query")
  @Security("jwt")
  public async executeQuery(
    @Request() req: ExpressRequest,
    @Path() connectorId: string,
    @Body() request: QueryRequest,
  ): Promise<QueryResponse> {
    const { dataProxyService, organizationId } = this.getServices(req);

    return await dataProxyService.executeQuery(organizationId, {
      connectorId,
      sql: request.sql,
      params: request.params,
    });
  }

  /**
   * Get schema information (tables and views) from external database
   */
  @Get("/{connectorId}/schema")
  @Security("jwt")
  public async getSchema(
    @Request() req: ExpressRequest,
    @Path() connectorId: string,
  ): Promise<SchemaResponse> {
    const { dataProxyService, organizationId } = this.getServices(req);

    const schema = await dataProxyService.getSchema(organizationId, connectorId);

    // Cast to proper type
    return {
      tables: schema.tables.map((t) => ({
        schema: t.schema,
        name: t.name,
        type: t.type as "table" | "view",
      })),
    };
  }

  /**
   * Get table preview (structure and sample data)
   */
  @Get("/{connectorId}/schema/{schemaName}/tables/{tableName}")
  @Security("jwt")
  public async getTablePreview(
    @Request() req: ExpressRequest,
    @Path() connectorId: string,
    @Path() schemaName: string,
    @Path() tableName: string,
    @Query() limit: number = 100,
  ): Promise<TablePreviewResponse> {
    const { dataProxyService, organizationId } = this.getServices(req);

    return await dataProxyService.getTablePreview(organizationId, connectorId, schemaName, tableName, limit);
  }

  /**
   * Search a table across multiple columns
   */
  @Get("/{connectorId}/schema/{schemaName}/tables/{tableName}/search")
  @Security("jwt")
  public async searchTable(
    @Request() req: ExpressRequest,
    @Path() connectorId: string,
    @Path() schemaName: string,
    @Path() tableName: string,
    @Query() searchTerm: string,
    @Query() searchColumns: string,
    @Query() limit: number = 50,
  ): Promise<unknown[]> {
    const { dataProxyService, organizationId } = this.getServices(req);

    return await dataProxyService.searchTable(organizationId, connectorId, {
      schema: schemaName,
      table: tableName,
      searchColumns: searchColumns.split(","),
      searchTerm,
      limit,
    });
  }

  /**
   * Get suggested field mappings for a target entity
   */
  @Post("/mappings/suggest")
  @Security("jwt")
  public async suggestMappings(
    @Request() req: ExpressRequest,
    @Body() request: SuggestMappingsRequest,
  ): Promise<FieldMapping[]> {
    const { dataMapperService } = this.getServices(req);

    return dataMapperService.suggestMappings(request.sourceColumns, request.targetEntity);
  }
}
