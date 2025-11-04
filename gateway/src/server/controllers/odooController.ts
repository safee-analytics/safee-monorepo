import { Controller, Get, Post, Delete, Route, Tags, Security, Request, Path, Body } from "tsoa";
import { odooDatabaseService } from "../services/odoo/database.service.js";
import { getOdooClientManager } from "../services/odoo/manager.service.js";
import { OdooClient } from "../services/odoo/client.js";
import type { AuthenticatedRequest } from "../middleware/auth.js";

interface OdooProvisionResponse {
  success: boolean;
  databaseName: string;
  adminLogin: string;
  adminPassword: string;
  odooUrl: string;
  loginUrl: string;
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
  @Post("/provision")
  @Security("jwt")
  public async provisionDatabase(@Request() request: AuthenticatedRequest): Promise<OdooProvisionResponse> {
    const organizationId = request.user!.organizationId;

    const result = await odooDatabaseService.provisionDatabase(organizationId);

    const loginUrl = await odooDatabaseService.getAuthUrl(organizationId);

    return {
      success: true,
      ...result,
      loginUrl,
    };
  }

  @Get("/info")
  @Security("jwt")
  public async getDatabaseInfo(@Request() request: AuthenticatedRequest): Promise<OdooInfoResponse> {
    const organizationId = request.user!.organizationId;

    const info = await odooDatabaseService.getDatabaseInfo(organizationId);

    let loginUrl: string | null = null;
    if (info.exists) {
      loginUrl = await odooDatabaseService.getAuthUrl(organizationId);
    }

    return {
      ...info,
      loginUrl,
    };
  }

  @Delete("/")
  @Security("jwt")
  public async deleteDatabase(@Request() request: AuthenticatedRequest): Promise<OdooDeleteResponse> {
    const organizationId = request.user!.organizationId;

    await odooDatabaseService.deleteDatabase(organizationId);

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
    const organizationId = request.user!.organizationId;

    const info = await odooDatabaseService.getDatabaseInfo(organizationId);
    if (!info.exists) {
      throw new Error("Cannot duplicate: Database does not exist");
    }

    const odooClient = new OdooClient();
    const masterPassword = process.env.ODOO_MASTER_PASSWORD || "admin";

    await odooClient.duplicateDatabase(
      masterPassword,
      info.databaseName,
      body.newName,
      body.neutralize || false,
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
    const organizationId = request.user!.organizationId;

    const info = await odooDatabaseService.getDatabaseInfo(organizationId);
    if (!info.exists) {
      throw new Error("Cannot backup: Database does not exist");
    }

    const odooClient = new OdooClient();
    const masterPassword = process.env.ODOO_MASTER_PASSWORD || "admin";

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
    const databases = await odooDatabaseService.listAllDatabases();

    return {
      databases,
    };
  }

  @Get("/organizations/{organizationId}/info")
  @Security("jwt")
  public async getDatabaseInfoByOrganization(@Path() organizationId: string): Promise<OdooInfoResponse> {
    // TODO: Add role-based authorization to restrict this to admins only
    const info = await odooDatabaseService.getDatabaseInfo(organizationId);

    let loginUrl: string | null = null;
    if (info.exists) {
      loginUrl = await odooDatabaseService.getAuthUrl(organizationId);
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
    const userId = request.user!.id;
    const organizationId = request.user!.organizationId;
    const client = await getOdooClientManager().getClient(userId, organizationId);

    return client.search(body.model, body.domain || [], {
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
    const userId = request.user!.id;
    const organizationId = request.user!.organizationId;
    const client = await getOdooClientManager().getClient(userId, organizationId);

    return client.searchRead(
      body.model,
      body.domain || [],
      body.fields || [],
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
    const userId = request.user!.id;
    const organizationId = request.user!.organizationId;
    const client = await getOdooClientManager().getClient(userId, organizationId);

    return client.read(body.model, body.ids, body.fields || [], body.context);
  }

  @Post("/rpc/create")
  @Security("jwt")
  public async create(
    @Request() request: AuthenticatedRequest,
    @Body() body: OdooCreateRequest,
  ): Promise<{ id: number }> {
    const userId = request.user!.id;
    const organizationId = request.user!.organizationId;
    const client = await getOdooClientManager().getClient(userId, organizationId);

    const id = await client.create(body.model, body.values, body.context);

    return { id };
  }

  @Post("/rpc/write")
  @Security("jwt")
  public async write(
    @Request() request: AuthenticatedRequest,
    @Body() body: OdooWriteRequest,
  ): Promise<{ success: boolean }> {
    const userId = request.user!.id;
    const organizationId = request.user!.organizationId;
    const client = await getOdooClientManager().getClient(userId, organizationId);

    const success = await client.write(body.model, body.ids, body.values, body.context);

    return { success };
  }

  @Post("/rpc/unlink")
  @Security("jwt")
  public async unlink(
    @Request() request: AuthenticatedRequest,
    @Body() body: OdooUnlinkRequest,
  ): Promise<{ success: boolean }> {
    const userId = request.user!.id;
    const organizationId = request.user!.organizationId;
    const client = await getOdooClientManager().getClient(userId, organizationId);

    const success = await client.unlink(body.model, body.ids, body.context);

    return { success };
  }

  @Post("/rpc/execute")
  @Security("jwt")
  public async execute(
    @Request() request: AuthenticatedRequest,
    @Body() body: OdooExecuteRequest,
  ): Promise<unknown> {
    const userId = request.user!.id;
    const organizationId = request.user!.organizationId;
    const client = await getOdooClientManager().getClient(userId, organizationId);

    return client.execute(body.model, body.method, body.args || [], body.kwargs || {});
  }
}
