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
import { getServerContext } from "../serverContext.js";
import { ConnectorFactory } from "../services/connectors/connector.factory.js";
import type { ConnectorType } from "../services/connectors/base.connector.js";
import { getOdooAdminCredentials } from "../operations/getOdooAdminCredentials.js";
import { getOdooUserWebCredentials } from "../operations/getOdooUserWebCredentials.js";
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
import { getOdooDevCredentials as getOdooDevCredentialsOp } from "../operations/getOdooDevCredentials.js";
import { installOdooModules as installOdooModulesOp } from "../operations/installOdooModules.js";
import { getOdooModelFields as getOdooModelFieldsOp } from "../operations/getOdooModelFields.js";
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

  @Get("/")
  @Security("jwt")
  public async listConnectors(
    @Request() req: AuthenticatedRequest,
    @Query() type?: ConnectorType,
    @Query() isActive?: boolean,
    @Query() tags?: string,
  ): Promise<ConnectorResponse[]> {
    const { organizationId } = this.getServices(req);

    const filters: { type?: ConnectorType; isActive?: boolean; tags?: string[] } = {};
    if (type) filters.type = type;
    if (isActive !== undefined) filters.isActive = isActive;
    if (tags) filters.tags = tags.split(",");

    return await listConnectorsOp(req.drizzle, organizationId, filters);
  }

  @Post("/")
  @Security("jwt")
  @SuccessResponse("201", "Connector created successfully")
  public async createConnector(
    @Request() req: AuthenticatedRequest,
    @Body() request: CreateConnectorRequest,
  ): Promise<ConnectorResponse> {
    const { organizationId, userId } = this.getServices(req);

    this.setStatus(201);

    return await createConnectorOp(req.drizzle, organizationId, userId, request);
  }

  @Get("/{connectorId}")
  @Security("jwt")
  public async getConnector(
    @Request() req: AuthenticatedRequest,
    @Path() connectorId: string,
  ): Promise<ConnectorResponse> {
    const { organizationId } = this.getServices(req);

    return await getConnectorOp(req.drizzle, connectorId, organizationId);
  }

  @Put("/{connectorId}")
  @Security("jwt")
  public async updateConnector(
    @Request() req: AuthenticatedRequest,
    @Path() connectorId: string,
    @Body() request: UpdateConnectorRequest,
  ): Promise<{ success: boolean }> {
    const { organizationId, userId } = this.getServices(req);

    return await updateConnectorOp(req.drizzle, connectorId, organizationId, userId, request);
  }

  @Delete("/{connectorId}")
  @Security("jwt")
  public async deleteConnector(
    @Request() req: AuthenticatedRequest,
    @Path() connectorId: string,
  ): Promise<{ success: boolean }> {
    const { organizationId } = this.getServices(req);

    return await deleteConnectorOp(req.drizzle, connectorId, organizationId);
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
    const { organizationId } = this.getServices(req);

    return await testConnectionOp(req.drizzle, connectorId, organizationId);
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
    const { organizationId } = this.getServices(req);

    return await getConnectorHealthOp(req.drizzle, connectorId, organizationId);
  }

  @Post("/{connectorId}/query")
  @Security("jwt")
  public async executeQuery(
    @Request() req: AuthenticatedRequest,
    @Path() connectorId: string,
    @Body() request: QueryRequest,
  ): Promise<QueryResponse> {
    const { organizationId } = this.getServices(req);

    return await executeQueryOp(req.drizzle, organizationId, connectorId, request);
  }

  @Get("/{connectorId}/schema")
  @Security("jwt")
  public async getSchema(
    @Request() req: AuthenticatedRequest,
    @Path() connectorId: string,
  ): Promise<SchemaResponse> {
    const { organizationId } = this.getServices(req);

    return await getSchemaOp(req.drizzle, organizationId, connectorId);
  }

  @Get("/{connectorId}/schema/{schemaName}/tables/{tableName}")
  @Security("jwt")
  public async getTablePreview(
    @Request() req: AuthenticatedRequest,
    @Path() connectorId: string,
    @Path() schemaName: string,
    @Path() tableName: string,
    @Query() limit: number = 100,
  ): Promise<TablePreviewResponse> {
    const { organizationId } = this.getServices(req);

    return await getTablePreviewOp(req.drizzle, organizationId, connectorId, schemaName, tableName, limit);
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
    @Query() limit: number = 50,
  ): Promise<unknown[]> {
    const { organizationId } = this.getServices(req);

    return await searchTableOp(
      req.drizzle,
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
    return await suggestMappingsOp(req.drizzle, request);
  }

  /**
   * Get Odoo web credentials for dev access
   * Returns login, password, and web URL for accessing Odoo UI directly
   */
  @Get("/odoo/dev-credentials")
  @Security("jwt")
  public async getOdooDevCredentials(@Request() req: AuthenticatedRequest): Promise<{
    login: string;
    password: string;
    webUrl: string;
  } | null> {
    const { userId, organizationId } = this.getServices(req);

    return await getOdooDevCredentialsOp(req.drizzle, userId, organizationId);
  }

  /**
   * Get Odoo user web credentials
   * Returns the current user's login, password, and web URL for accessing Odoo UI
   */
  @Get("/odoo/user-credentials")
  @Security("jwt")
  public async getOdooUserCredentials(@Request() req: AuthenticatedRequest): Promise<{
    login: string;
    password: string;
    webUrl: string;
  } | null> {
    const { userId, organizationId } = this.getServices(req);

    return await getOdooUserWebCredentials(req.drizzle, userId, organizationId);
  }

  /**
   * Get Odoo admin credentials
   * Returns admin login, password, database name, and web URL for accessing Odoo database as admin
   */
  @Get("/odoo/admin-credentials")
  @Security("jwt")
  public async getOdooAdminCredentialsEndpoint(@Request() req: AuthenticatedRequest): Promise<{
    databaseName: string;
    adminLogin: string;
    adminPassword: string;
    webUrl: string;
  } | null> {
    const { organizationId } = this.getServices(req);

    const credentials = await getOdooAdminCredentials(req.drizzle, organizationId);

    if (!credentials) {
      return null;
    }

    return {
      databaseName: credentials.databaseName,
      adminLogin: credentials.adminLogin,
      adminPassword: credentials.adminPassword,
      webUrl: `${credentials.odooUrl}/web/login?db=${credentials.databaseName}`,
    };
  }

  /**
   * Install required Odoo modules for the organization
   * Installs: Accounting (Hisabiq), CRM (Nisbah), HR & Payroll (Kanz)
   */
  @Post("/odoo/install-modules")
  @Security("jwt")
  @SuccessResponse("200", "Modules installed successfully")
  public async installOdooModules(
    @Request() req: AuthenticatedRequest,
  ): Promise<{ success: boolean; message: string }> {
    const { organizationId, ctx } = this.getServices(req);

    const result = await installOdooModulesOp(organizationId, ctx.logger);

    if (!result.success) {
      this.setStatus(500);
    }

    return result;
  }

  /**
   * Get available fields for an Odoo model (dev tool)
   * Useful for discovering what fields exist on a model
   */
  @Get("/odoo/models/{modelName}/fields")
  @Security("jwt")
  public async getOdooModelFields(
    @Request() req: AuthenticatedRequest,
    @Path() modelName: string,
    @Query() simple?: boolean,
  ): Promise<
    | Record<string, unknown>
    | Array<{
        name: string;
        type: string;
        label: string;
        required?: boolean;
        readonly?: boolean;
      }>
  > {
    const { userId, organizationId } = this.getServices(req);

    return await getOdooModelFieldsOp(userId, organizationId, modelName, simple);
  }
}
