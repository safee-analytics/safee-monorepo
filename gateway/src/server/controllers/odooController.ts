import { Controller, Get, Post, Delete, Route, Tags, Security, Request, Path } from "tsoa";
import { odooDatabaseService } from "../services/odoo/database.service.js";
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

@Route("api/v1/odoo")
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
}
