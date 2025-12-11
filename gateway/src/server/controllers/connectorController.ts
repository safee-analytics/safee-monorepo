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
  OperationId,
} from "tsoa";
import type { AuthenticatedRequest } from "../middleware/auth.js";
import { ConnectorFactory } from "../services/connectors/connector.factory.js";
import type { ConnectorType } from "../services/connectors/base.connector.js";
import { getServerContext } from "../serverContext.js";
import { listConnectors as listConnectorsOp } from "../operations/listConnectors.js";
import { createConnector as createConnectorOp } from "../operations/createConnector.js";
import { getConnector as getConnectorOp } from "../operations/getConnector.js";
import { updateConnector as updateConnectorOp } from "../operations/updateConnector.js";
import { deleteConnector as deleteConnectorOp } from "../operations/deleteConnector.js";
import { testConnection as testConnectionOp } from "../operations/testConnection.js";
import { getConnectorHealth as getConnectorHealthOp } from "../operations/getConnectorHealth.js";
import { executeQuery as executeQueryOp } from "../operations/executeQuery.js";
import { getSchema as getSchemaOp } from "../operations/getSchema.js";
import { getTablePreview as getTablePreviewOp } from "../operations/getTablePreview.js";
import { searchTable as searchTableOp } from "../operations/searchTable.js";
import { suggestMappings as suggestMappingsOp } from "../operations/suggestMappings.js";
import type {
  CreateConnectorRequest,
  UpdateConnectorRequest,
  ConnectorResponse,
  QueryRequest,
  QueryResponse,
  SchemaResponse,
  TablePreviewResponse,
  FieldMapping,
  SuggestMappingsRequest,
} from "../dtos/connector.js";

@Route("connectors")
@Tags("Connectors")
export class ConnectorController extends Controller {
  @NoSecurity()
  private getServices(req: AuthenticatedRequest) {
    const ctx = getServerContext();

    return {
      ctx,
      organizationId: req.betterAuthSession?.session.activeOrganizationId || "",
      userId: req.betterAuthSession?.user.id || "",
    };
  }

  @Get("/types")
  @Security("jwt")
  public async getConnectorTypes(): Promise<
    {
      type: ConnectorType;
      name: string;
      description: string;
      requiredFields: string[];
      optionalFields: string[];
    }[]
  > {
    return ConnectorFactory.getAvailableTypes();
  }

  @Get("/types/{type}/fields")
  @Security("jwt")
  public async getFieldDefinitions(@Path() type: ConnectorType): Promise<
    {
      name: string;
      type: "text" | "number" | "password" | "boolean";
      label: string;
      placeholder?: string;
      required: boolean;
      defaultValue?: unknown;
      helpText?: string;
    }[]
  > {
    return ConnectorFactory.getFieldDefinitions(type);
  }

  @Get("/")
  @Security("jwt")
  public async listConnectors(
    @Request() req: AuthenticatedRequest,
    @Query() type?: ConnectorType,
    @Query() isActive?: boolean,
    @Query() tags?: string,
  ): Promise<ConnectorResponse[]> {
    const { ctx, organizationId } = this.getServices(req);

    const filters: { type?: ConnectorType; isActive?: boolean; tags?: string[] } = {};
    if (type) filters.type = type;
    if (isActive !== undefined) filters.isActive = isActive;
    if (tags) filters.tags = tags.split(",");

    return await listConnectorsOp(ctx, organizationId, filters);
  }

  @Post("/")
  @Security("jwt")
  @SuccessResponse("201", "Connector created successfully")
  public async createConnector(
    @Request() req: AuthenticatedRequest,
    @Body() request: CreateConnectorRequest,
  ): Promise<ConnectorResponse> {
    const { ctx, organizationId, userId } = this.getServices(req);

    this.setStatus(201);

    return await createConnectorOp(ctx, organizationId, userId, request);
  }

  @Get("/{connectorId}")
  @Security("jwt")
  public async getConnector(
    @Request() req: AuthenticatedRequest,
    @Path() connectorId: string,
  ): Promise<ConnectorResponse> {
    const { ctx, organizationId } = this.getServices(req);

    return await getConnectorOp(ctx, connectorId, organizationId);
  }

  @Put("/{connectorId}")
  @Security("jwt")
  public async updateConnector(
    @Request() req: AuthenticatedRequest,
    @Path() connectorId: string,
    @Body() request: UpdateConnectorRequest,
  ): Promise<{ success: boolean }> {
    const { ctx, organizationId, userId } = this.getServices(req);

    return await updateConnectorOp(ctx, connectorId, organizationId, userId, request);
  }

  @Delete("/{connectorId}")
  @Security("jwt")
  public async deleteConnector(
    @Request() req: AuthenticatedRequest,
    @Path() connectorId: string,
  ): Promise<{ success: boolean }> {
    const { ctx, organizationId } = this.getServices(req);

    return await deleteConnectorOp(ctx, connectorId, organizationId);
  }

  @Post("/{connectorId}/test")
  @Security("jwt")
  public async testConnection(
    @Request() req: AuthenticatedRequest,
    @Path() connectorId: string,
  ): Promise<{
    status: string;
    message: string;
    latency?: number;
    metadata?: Record<string, unknown>;
    error?: string;
  }> {
    const { ctx, organizationId } = this.getServices(req);

    return await testConnectionOp(ctx, connectorId, organizationId);
  }

  @Get("/{connectorId}/health")
  @Security("jwt")
  @OperationId("GetConnectorHealth")
  public async getHealth(
    @Request() req: AuthenticatedRequest,
    @Path() connectorId: string,
  ): Promise<{
    healthy: boolean;
    message?: string;
    details?: Record<string, unknown>;
  }> {
    const { ctx, organizationId } = this.getServices(req);

    return await getConnectorHealthOp(ctx, connectorId, organizationId);
  }

  @Post("/{connectorId}/query")
  @Security("jwt")
  public async executeQuery(
    @Request() req: AuthenticatedRequest,
    @Path() connectorId: string,
    @Body() request: QueryRequest,
  ): Promise<QueryResponse> {
    const { ctx, organizationId } = this.getServices(req);

    return await executeQueryOp(ctx, organizationId, connectorId, request);
  }

  @Get("/{connectorId}/schema")
  @Security("jwt")
  public async getSchema(
    @Request() req: AuthenticatedRequest,
    @Path() connectorId: string,
  ): Promise<SchemaResponse> {
    const { ctx, organizationId } = this.getServices(req);

    return await getSchemaOp(ctx, organizationId, connectorId);
  }

  @Get("/{connectorId}/schema/{schemaName}/tables/{tableName}")
  @Security("jwt")
  public async getTablePreview(
    @Request() req: AuthenticatedRequest,
    @Path() connectorId: string,
    @Path() schemaName: string,
    @Path() tableName: string,
    @Query() limit = 100,
  ): Promise<TablePreviewResponse> {
    const { ctx, organizationId } = this.getServices(req);

    return await getTablePreviewOp(ctx, organizationId, connectorId, schemaName, tableName, limit);
  }

  @Get("/{connectorId}/schema/{schemaName}/tables/{tableName}/search")
  @Security("jwt")
  public async searchTable(
    @Request() req: AuthenticatedRequest,
    @Path() connectorId: string,
    @Path() schemaName: string,
    @Path() tableName: string,
    @Query() searchTerm: string,
    @Query() searchColumns: string,
    @Query() limit = 50,
  ): Promise<unknown[]> {
    const { ctx, organizationId } = this.getServices(req);

    return await searchTableOp(
      ctx,
      organizationId,
      connectorId,
      schemaName,
      tableName,
      searchTerm,
      searchColumns.split(","),
      limit,
    );
  }

  @Post("/mappings/suggest")
  @Security("jwt")
  public async suggestMappings(
    @Request() req: AuthenticatedRequest,
    @Body() request: SuggestMappingsRequest,
  ): Promise<FieldMapping[]> {
    const { ctx } = this.getServices(req);

    return await suggestMappingsOp(ctx, request);
  }
}
