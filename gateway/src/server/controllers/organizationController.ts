import {
  Controller,
  Put,
  Route,
  Tags,
  Security,
  Path,
  Request,
  UploadedFile,
  SuccessResponse,
} from "tsoa";
import type { AuthenticatedRequest } from "../middleware/auth.js";
import { getServerContext, type ServerContext } from "../serverContext.js";
import { updateOrganizationLogo } from "@safee/database";
import { Unauthorized } from "../errors.js";
import { StorageServiceV2 } from "../services/storage.service.v2.js";
import { StorageConnectorService } from "../services/storage/storage-connector.service.js";

interface OrganizationResponse {
  id: string;
  name: string;
  slug: string;
  logo?: string | null;
  industry?: string | null;
  size?: string | null;
  country?: string | null;
  createdAt: string;
  updatedAt: string;
}

@Route("organizations")
@Tags("Organizations")
export class OrganizationController extends Controller {
  private context: ServerContext;

  constructor(context?: ServerContext) {
    super();
    this.context = context ?? getServerContext();
  }

  @Put("{orgId}/logo")
  @Security("jwt")
  @SuccessResponse("200", "Organization logo updated")
  public async updateLogo(
    @Path() orgId: string,
    @Request() req: AuthenticatedRequest,
    @UploadedFile() file: globalThis.Express.Multer.File,
  ): Promise<OrganizationResponse> {
    const deps = { drizzle: this.context.drizzle, logger: this.context.logger };
    const userId = req.betterAuthSession?.user.id;
    const activeOrgId = req.betterAuthSession?.session.activeOrganizationId;

    if (!userId) {
      throw new Unauthorized("User not authenticated");
    }

    // Verify user has access to this organization
    if (activeOrgId !== orgId) {
      throw new Unauthorized("You do not have access to this organization");
    }

    try {
      // Get storage service for organization
      const connectorService = new StorageConnectorService(this.context.drizzle);
      const adapter = await connectorService.getAdapter(orgId);
      const storageService = new StorageServiceV2(adapter);

      // Upload file to storage
      const metadata = await storageService.uploadFile(file, {
        folderId: `organizations/${orgId}/logo`,
        tags: ["logo"],
        userId,
      });

      // Update organization record with file path
      const updatedOrg = await updateOrganizationLogo(deps, orgId, metadata.path);

      return {
        id: updatedOrg.id,
        name: updatedOrg.name,
        slug: updatedOrg.slug,
        logo: updatedOrg.logo,
        industry: updatedOrg.industry,
        createdAt: updatedOrg.createdAt.toISOString(),
        updatedAt: updatedOrg.updatedAt.toISOString(),
      };
    } catch (error) {
      this.context.logger.error({ error, orgId }, "Failed to update organization logo");
      throw error;
    }
  }
}
