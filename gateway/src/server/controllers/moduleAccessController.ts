import {
  Controller,
  Get,
  Post,
  Put,
  Delete,
  Route,
  Tags,
  Security,
  Request,
  Body,
  Path,
  Query,
  OperationId,
} from "tsoa";
import type { AuthenticatedRequest } from "../middleware/auth.js";
import { ModuleAccessService } from "../services/moduleAccess.service.js";
import {
  ResourceAssignmentService,
  type AssignResourceParams,
} from "../services/resourceAssignment.service.js";
import {
  type ModuleAccessResponse,
  type HRSectionsResponse,
  type UpdateModuleAccessRequest,
  type AssignResourceRequest,
  type ResourceAssignmentResponse,
  type AssignedResourcesResponse,
} from "../dtos/moduleAccess.js";
import { getServerContext } from "../serverContext.js";
import { requireAuth, requireAdminAuth, requireManagerAuth } from "../utils/authUtils.js";

@Route("module-access")
@Tags("Module Access")
export class ModuleAccessController extends Controller {
  @Get("modules")
  @Security("jwt")
  @OperationId("GetAccessibleModules")
  public async getAccessibleModules(@Request() request: AuthenticatedRequest): Promise<ModuleAccessResponse> {
    const { userId, organizationId } = requireAuth(request);

    const { drizzle, logger } = getServerContext();
    const service = new ModuleAccessService({ drizzle, logger });

    const modules = await service.getAccessibleModules(userId, organizationId);

    return { modules };
  }

  @Get("hr-sections")
  @Security("jwt")
  @OperationId("GetAccessibleHRSections")
  public async getAccessibleHRSections(
    @Request() request: AuthenticatedRequest,
  ): Promise<HRSectionsResponse> {
    const { userId, organizationId } = requireAuth(request);

    const { drizzle, logger } = getServerContext();
    const service = new ModuleAccessService({ drizzle, logger });

    const sections = await service.getAccessibleHRSections(userId, organizationId);

    return { sections };
  }

  @Put("rules")
  @Security("jwt")
  @OperationId("UpdateModuleAccessRules")
  public async updateModuleAccessRules(
    @Request() request: AuthenticatedRequest,
    @Body() body: UpdateModuleAccessRequest,
  ): Promise<{ success: boolean }> {
    const { drizzle, logger } = getServerContext();
    const { organizationId } = await requireAdminAuth(request, { drizzle, logger });

    const service = new ModuleAccessService({ drizzle, logger });
    const targetOrgId = body.organizationId ?? organizationId;

    await service.updateModuleAccessRules(targetOrgId, body.rules);

    return { success: true };
  }

  @Post("assignments")
  @Security("jwt")
  @OperationId("AssignResource")
  public async assignResource(
    @Request() request: AuthenticatedRequest,
    @Body() body: AssignResourceRequest,
  ): Promise<ResourceAssignmentResponse> {
    const { drizzle, logger } = getServerContext();
    const { userId: assignedBy, organizationId } = await requireManagerAuth(request, { drizzle, logger });

    const service = new ResourceAssignmentService({ drizzle, logger });

    const params: AssignResourceParams = {
      userId: body.userId,
      organizationId,
      resourceType: body.resourceType,
      resourceId: body.resourceId,
      role: body.role,
      assignedBy,
    };

    return service.assignResource(params);
  }

  @Get("assignments/{resourceType}/{resourceId}")
  @Security("jwt")
  @OperationId("GetResourceAssignments")
  public async getResourceAssignments(
    @Request() request: AuthenticatedRequest,
    @Path() resourceType: "audit_case" | "accounting_client" | "crm_lead" | "crm_deal" | "hr_department",
    @Path() resourceId: string,
  ): Promise<{ assignments: ResourceAssignmentResponse[] }> {
    const { organizationId } = requireAuth(request);

    const { drizzle, logger } = getServerContext();
    const service = new ResourceAssignmentService({ drizzle, logger });

    const assignments = await service.getResourceAssignments(organizationId, resourceType, resourceId);

    return { assignments };
  }

  @Delete("assignments/{userId}/{resourceType}/{resourceId}")
  @Security("jwt")
  @OperationId("UnassignResource")
  public async unassignResource(
    @Request() request: AuthenticatedRequest,
    @Path() userId: string,
    @Path() resourceType: "audit_case" | "accounting_client" | "crm_lead" | "crm_deal" | "hr_department",
    @Path() resourceId: string,
  ): Promise<{ success: boolean }> {
    const { drizzle, logger } = getServerContext();
    await requireManagerAuth(request, { drizzle, logger });

    const service = new ResourceAssignmentService({ drizzle, logger });

    await service.unassignResource(userId, resourceType, resourceId);

    return { success: true };
  }

  @Get("assigned-resources")
  @Security("jwt")
  @OperationId("GetAssignedResources")
  public async getAssignedResources(
    @Request() request: AuthenticatedRequest,
    @Query() resourceType: "audit_case" | "accounting_client" | "crm_lead" | "crm_deal" | "hr_department",
  ): Promise<AssignedResourcesResponse> {
    const { userId, organizationId } = requireAuth(request);

    const { drizzle, logger } = getServerContext();
    const service = new ResourceAssignmentService({ drizzle, logger });

    const resourceIds = await service.getAssignedResources(userId, organizationId, resourceType);

    return { resourceIds };
  }
}
