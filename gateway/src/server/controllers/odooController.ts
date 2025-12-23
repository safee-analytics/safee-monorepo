import { odoo } from "@safee/database";
import { odooProvisioningQueue } from "@safee/jobs/queues";
import {
  Controller,
  Get,
  Post,
  Delete,
  Route,
  Tags,
  Security,
  Request,
  Path,
  Body,
  Query,
  SuccessResponse,
  NoSecurity,
} from "tsoa";
import type { AuthenticatedRequest } from "../middleware/auth.js";
import { BadRequest } from "../errors.js";
import { getOdooAdminCredentials } from "../operations/getOdooAdminCredentials.js";
import { getOdooUserWebCredentials } from "../operations/getOdooUserWebCredentials.js";
import { getOdooDevCredentials as getOdooDevCredentialsOp } from "../operations/getOdooDevCredentials.js";
import { installOdooModules as installOdooModulesOp } from "../operations/installOdooModules.js";
import { getOdooModelFields as getOdooModelFieldsOp } from "../operations/getOdooModelFields.js";
import { getOdooDatabaseInfo as getOdooDatabaseInfoOp } from "../operations/getOdooDatabaseInfo.js";
import { getServerContext } from "../serverContext.js";
import { ODOO_URL, ODOO_PORT, ODOO_ADMIN_PASSWORD, JWT_SECRET } from "../../env.js";

interface OdooProvisionResponse {
  success: boolean;
  message: string;
  jobId?: string;
}

interface OdooInfoResponse {
  databaseName: string;
  exists: boolean;
  loginUrl: string | null;
}

interface OdooDeleteResponse {
  success: boolean;
  message: string;
}

interface OdooListResponse {
  databases: string[];
}

interface OdooDuplicateRequest {
  newName: string;
  neutralize?: boolean;
}

interface OdooDuplicateResponse {
  success: boolean;
  originalName: string;
  newName: string;
}

interface OdooSearchRequest {
  model: string;
  domain?: unknown[];
  limit?: number;
  offset?: number;
  order?: string;
}

interface OdooSearchReadRequest {
  model: string;
  domain?: unknown[];
  fields?: string[];
  limit?: number;
  offset?: number;
  order?: string;
  context?: Record<string, unknown>;
}

interface OdooReadRequest {
  model: string;
  ids: number[];
  fields?: string[];
  context?: Record<string, unknown>;
}

interface OdooCreateRequest {
  model: string;
  values: Record<string, unknown>;
  context?: Record<string, unknown>;
}

interface OdooWriteRequest {
  model: string;
  ids: number[];
  values: Record<string, unknown>;
  context?: Record<string, unknown>;
}

interface OdooUnlinkRequest {
  model: string;
  ids: number[];
  context?: Record<string, unknown>;
}

interface OdooExecuteRequest {
  model: string;
  method: string;
  args?: unknown[];
  kwargs?: Record<string, unknown>;
}

@Route("odoo")
@Tags("Odoo")
export class OdooController extends Controller {
  @NoSecurity()
  private getDatabaseService(): odoo.OdooDatabaseService {
    const ctx = getServerContext();

    return new odoo.OdooDatabaseService({
      logger: ctx.logger,
      drizzle: ctx.drizzle,
      redis: ctx.redis,
      odooClient: new odoo.OdooClient(ODOO_URL),
      encryptionService: new odoo.EncryptionService(JWT_SECRET),
      odooConfig: {
        url: ODOO_URL,
        port: ODOO_PORT,
        adminPassword: ODOO_ADMIN_PASSWORD,
      },
    });
  }

  @NoSecurity()
  private getUserProvisioningService(): odoo.OdooUserProvisioningService {
    const ctx = getServerContext();

    return new odoo.OdooUserProvisioningService({
      drizzle: ctx.drizzle,
      logger: ctx.logger,
      encryptionService: new odoo.EncryptionService(JWT_SECRET),
      odooUrl: ODOO_URL,
    });
  }

  @Post("/provision")
  @Security("jwt")
  @SuccessResponse("202", "Accepted")
  public async provisionDatabase(
    @Request() request: AuthenticatedRequest,
  ): Promise<OdooProvisionResponse> {
    const organizationId = request.betterAuthSession?.session.activeOrganizationId;

    if (!organizationId) {
      throw new BadRequest("No active organization selected. Please set an active organization first.", {
        userId: request.betterAuthSession?.user.id,
      });
    }

    // Always do fast provisioning (base modules only)
    const databaseService = this.getDatabaseService();
    await databaseService.provisionDatabase(organizationId);

    // Queue module installation as background job (will take 10-15 minutes)
    const moduleJob = await odooProvisioningQueue.add(
      "install-modules",
      {
        organizationId,
      },
      {
        attempts: 3,
        backoff: {
          type: "exponential",
          delay: 5000,
        },
      },
    );

    this.setStatus(202);
    return {
      success: true,
      message: "Odoo database provisioned successfully. Extended modules are installing in background.",
      jobId: moduleJob.id!,
    };
  }

  @Post("/provision-user")
  @Security("jwt")
  public async provisionUser(@Request() request: AuthenticatedRequest): Promise<{
    success: boolean;
    odooUid: number;
    odooLogin: string;
    hasApiKey: boolean;
  }> {
    const userId = request.betterAuthSession!.user.id;
    const organizationId = request.betterAuthSession!.session.activeOrganizationId!;

    const userProvisioningService = this.getUserProvisioningService();
    const result = await userProvisioningService.provisionUser(userId, organizationId);

    return {
      success: true,
      odooUid: result.odooUid,
      odooLogin: result.odooLogin,
      hasApiKey: result.odooPassword.includes("_"), // API keys have underscore
    };
  }

  @Get("/info")
  @Security("jwt")
  public async getDatabaseInfo(@Request() request: AuthenticatedRequest): Promise<OdooInfoResponse> {
    const organizationId = request.betterAuthSession!.session.activeOrganizationId!;

    const info = await this.getDatabaseService().getDatabaseInfo(organizationId);

    let loginUrl: string | null = null;
    if (info.exists) {
      loginUrl = await this.getDatabaseService().getAuthUrl(organizationId);
    }

    return {
      ...info,
      loginUrl,
    };
  }

  @Delete("/")
  @Security("jwt")
  public async deleteDatabase(@Request() request: AuthenticatedRequest): Promise<OdooDeleteResponse> {
    const organizationId = request.betterAuthSession!.session.activeOrganizationId!;

    await this.getDatabaseService().deleteDatabase(organizationId);

    return {
      success: true,
      message: "Odoo database deleted successfully",
    };
  }

  @Post("/duplicate")
  @Security("jwt")
  public async duplicateDatabase(
    @Request() request: AuthenticatedRequest,
    @Body() body: OdooDuplicateRequest,
  ): Promise<OdooDuplicateResponse> {
    const organizationId = request.betterAuthSession!.session.activeOrganizationId!;

    const info = await this.getDatabaseService().getDatabaseInfo(organizationId);
    if (!info.exists) {
      throw new Error("Cannot duplicate: Database does not exist");
    }

    const odooClient = new odoo.OdooClient(ODOO_URL);
    const masterPassword = ODOO_ADMIN_PASSWORD;

    await odooClient.duplicateDatabase(
      masterPassword,
      info.databaseName,
      body.newName,
      body.neutralize ?? false,
    );

    return {
      success: true,
      originalName: info.databaseName,
      newName: body.newName,
    };
  }

  @Post("/backup")
  @Security("jwt")
  public async backupDatabase(
    @Request() request: AuthenticatedRequest,
  ): Promise<{ success: boolean; data: string }> {
    const organizationId = request.betterAuthSession!.session.activeOrganizationId!;

    const info = await this.getDatabaseService().getDatabaseInfo(organizationId);
    if (!info.exists) {
      throw new Error("Cannot backup: Database does not exist");
    }

    const odooClient = new odoo.OdooClient(ODOO_URL);
    const masterPassword = ODOO_ADMIN_PASSWORD;

    const backupData = await odooClient.backupDatabase({
      masterPassword,
      name: info.databaseName,
      format: "zip",
    });

    return {
      success: true,
      data: backupData.toString("base64"),
    };
  }

  @Get("/databases")
  @Security("jwt")
  public async listAllDatabases(): Promise<OdooListResponse> {
    // TODO: Add role-based authorization to restrict this to admins only
    const databases = await this.getDatabaseService().listAllDatabases();

    return {
      databases,
    };
  }

  @Get("/organizations/{organizationId}/info")
  @Security("jwt")
  public async getDatabaseInfoByOrganization(@Path() organizationId: string): Promise<OdooInfoResponse> {
    // TODO: Add role-based authorization to restrict this to admins only
    const info = await this.getDatabaseService().getDatabaseInfo(organizationId);

    let loginUrl: string | null = null;
    if (info.exists) {
      loginUrl = await this.getDatabaseService().getAuthUrl(organizationId);
    }

    return {
      ...info,
      loginUrl,
    };
  }

  @Post("/rpc/search")
  @Security("jwt")
  public async search(
    @Request() request: AuthenticatedRequest,
    @Body() body: OdooSearchRequest,
  ): Promise<number[]> {
    const userId = request.betterAuthSession!.user.id;
    const organizationId = request.betterAuthSession!.session.activeOrganizationId!;
    const client = await odoo.getOdooClientManager().getClient(userId, organizationId);

    return client.search(body.model, body.domain ?? [], {
      limit: body.limit,
      offset: body.offset,
      order: body.order,
    });
  }

  @Post("/rpc/search_read")
  @Security("jwt")
  public async searchRead(
    @Request() request: AuthenticatedRequest,
    @Body() body: OdooSearchReadRequest,
  ): Promise<Record<string, unknown>[]> {
    const userId = request.betterAuthSession!.user.id;
    const organizationId = request.betterAuthSession!.session.activeOrganizationId!;
    const client = await odoo.getOdooClientManager().getClient(userId, organizationId);

    return client.searchRead(
      body.model,
      body.domain ?? [],
      body.fields ?? [],
      {
        limit: body.limit,
        offset: body.offset,
        order: body.order,
      },
      body.context,
    );
  }

  @Post("/rpc/read")
  @Security("jwt")
  public async read(
    @Request() request: AuthenticatedRequest,
    @Body() body: OdooReadRequest,
  ): Promise<Record<string, unknown>[]> {
    const userId = request.betterAuthSession!.user.id;
    const organizationId = request.betterAuthSession!.session.activeOrganizationId!;
    const client = await odoo.getOdooClientManager().getClient(userId, organizationId);

    return client.read(body.model, body.ids, body.fields ?? [], body.context);
  }

  @Post("/rpc/create")
  @Security("jwt")
  public async create(
    @Request() request: AuthenticatedRequest,
    @Body() body: OdooCreateRequest,
  ): Promise<{ id: number }> {
    const userId = request.betterAuthSession!.user.id;
    const organizationId = request.betterAuthSession!.session.activeOrganizationId!;
    const client = await odoo.getOdooClientManager().getClient(userId, organizationId);

    const id = await client.create(body.model, body.values, body.context);

    return { id };
  }

  @Post("/rpc/write")
  @Security("jwt")
  public async write(
    @Request() request: AuthenticatedRequest,
    @Body() body: OdooWriteRequest,
  ): Promise<{ success: boolean }> {
    const userId = request.betterAuthSession!.user.id;
    const organizationId = request.betterAuthSession!.session.activeOrganizationId!;
    const client = await odoo.getOdooClientManager().getClient(userId, organizationId);

    const success = await client.write(body.model, body.ids, body.values, body.context);

    return { success };
  }

  @Post("/rpc/unlink")
  @Security("jwt")
  public async unlink(
    @Request() request: AuthenticatedRequest,
    @Body() body: OdooUnlinkRequest,
  ): Promise<{ success: boolean }> {
    const userId = request.betterAuthSession!.user.id;
    const organizationId = request.betterAuthSession!.session.activeOrganizationId!;
    const client = await odoo.getOdooClientManager().getClient(userId, organizationId);

    const success = await client.unlink(body.model, body.ids, body.context);

    return { success };
  }

  @Post("/rpc/execute")
  @Security("jwt")
  public async execute(
    @Request() request: AuthenticatedRequest,
    @Body() body: OdooExecuteRequest,
  ): Promise<unknown> {
    const userId = request.betterAuthSession!.user.id;
    const organizationId = request.betterAuthSession!.session.activeOrganizationId!;
    const client = await odoo.getOdooClientManager().getClient(userId, organizationId);

    return client.execute(body.model, body.method, body.args ?? [], body.kwargs ?? {});
  }

  @Get("/dev-credentials")
  @Security("jwt")
  public async getOdooDevCredentials(@Request() req: AuthenticatedRequest): Promise<{
    login: string;
    password: string;
    webUrl: string;
  } | null> {
    const userId = req.betterAuthSession!.user.id;
    const organizationId = req.betterAuthSession!.session.activeOrganizationId!;
    const ctx = getServerContext();

    return await getOdooDevCredentialsOp(ctx.drizzle, userId, organizationId);
  }

  @Get("/user-credentials")
  @Security("jwt")
  public async getOdooUserCredentials(@Request() req: AuthenticatedRequest): Promise<{
    login: string;
    password: string;
    webUrl: string;
  } | null> {
    const userId = req.betterAuthSession!.user.id;
    const organizationId = req.betterAuthSession!.session.activeOrganizationId!;
    const ctx = getServerContext();

    let credentials = await getOdooUserWebCredentials(ctx.drizzle, userId, organizationId);

    if (!credentials) {
      await this.getUserProvisioningService().provisionUser(userId, organizationId);

      credentials = await getOdooUserWebCredentials(ctx.drizzle, userId, organizationId);
    }

    return credentials;
  }

  @Get("/admin-credentials")
  @Security("jwt")
  public async getOdooAdminCredentialsEndpoint(@Request() req: AuthenticatedRequest): Promise<{
    databaseName: string;
    adminLogin: string;
    adminPassword: string;
    webUrl: string;
  } | null> {
    const organizationId = req.betterAuthSession!.session.activeOrganizationId!;
    const ctx = getServerContext();

    const credentials = await getOdooAdminCredentials(ctx.drizzle, organizationId);

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

  @Post("/install-modules")
  @Security("jwt")
  @SuccessResponse("200", "Modules installed successfully")
  public async installOdooModules(
    @Request() req: AuthenticatedRequest,
  ): Promise<{ success: boolean; message: string }> {
    const organizationId = req.betterAuthSession!.session.activeOrganizationId!;
    const ctx = getServerContext();

    const result = await installOdooModulesOp(organizationId, ctx);

    if (!result.success) {
      this.setStatus(500);
    }

    return result;
  }

  @Get("/models/{modelName}/fields")
  @Security("jwt")
  public async getOdooModelFields(
    @Request() req: AuthenticatedRequest,
    @Path() modelName: string,
    @Query() simple?: boolean,
  ): Promise<
    | Record<string, unknown>
    | {
        name: string;
        type: string;
        label: string;
        required?: boolean;
        readonly?: boolean;
      }[]
  > {
    const userId = req.betterAuthSession!.user.id;
    const organizationId = req.betterAuthSession!.session.activeOrganizationId!;

    return await getOdooModelFieldsOp(userId, organizationId, modelName, simple);
  }

  @Get("/database-info")
  @Security("jwt")
  public async getOdooDatabaseInfo(@Request() req: AuthenticatedRequest): Promise<{
    database: {
      name: string;
      exists: boolean;
      loginUrl: string;
    };
    users: {
      id: number;
      name: string;
      login: string;
      email: string;
      active: boolean;
      groups: {
        id: number;
        name: string;
        fullName: string;
      }[];
    }[];
    modules: {
      id: number;
      name: string;
      displayName: string;
      state: string;
      summary: string;
    }[];
    accessGroups: {
      id: number;
      name: string;
      fullName: string;
      category: string;
      users: number[];
    }[];
  }> {
    const organizationId = req.betterAuthSession!.session.activeOrganizationId!;
    const ctx = getServerContext();

    return await getOdooDatabaseInfoOp(ctx.drizzle, organizationId);
  }
}
