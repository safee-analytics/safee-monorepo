import { type DbDeps, type ResourceType, schema, eq, and, inArray } from "@safee/database";
import type { ResourceAssignmentResponse } from "../dtos/moduleAccess.js";
import { HierarchyService } from "./hierarchy.service.js";

export interface AssignResourceParams {
  userId: string;
  organizationId: string;
  resourceType: ResourceType;
  resourceId: string;
  role?: string;
  assignedBy: string;
}

export class ResourceAssignmentService {
  private hierarchyService: HierarchyService;

  constructor(private readonly deps: DbDeps) {
    this.hierarchyService = new HierarchyService(deps);
  }

  async getAssignedResources(
    userId: string,
    organizationId: string,
    resourceType: ResourceType,
  ): Promise<string[]> {
    const { drizzle, logger } = this.deps;

    try {
      const member = await drizzle.query.members.findFirst({
        where: and(eq(schema.members.userId, userId), eq(schema.members.organizationId, organizationId)),
      });

      if (!member) {
        logger.warn({ userId, organizationId }, "User is not a member of organization");
        return [];
      }

      const role = member.role;

      if (role === "owner" || role === "admin") {
        return [];
      }

      const userIdsToCheck = [userId];

      const isManager = await this.hierarchyService.isManager(userId, organizationId);
      if (isManager) {
        const subordinateIds = await this.hierarchyService.getSubordinateUserIds(userId, organizationId);
        userIdsToCheck.push(...subordinateIds);
      }

      const assignments = await drizzle.query.resourceAssignments.findMany({
        where: and(
          inArray(schema.resourceAssignments.userId, userIdsToCheck),
          eq(schema.resourceAssignments.organizationId, organizationId),
          eq(schema.resourceAssignments.resourceType, resourceType),
        ),
      });

      return assignments.map((assignment) => assignment.resourceId);
    } catch (err) {
      logger.error({ error: err, userId, organizationId, resourceType }, "Failed to get assigned resources");
      throw err;
    }
  }

  async assignResource(params: AssignResourceParams): Promise<ResourceAssignmentResponse> {
    const { drizzle, logger } = this.deps;
    const { userId, organizationId, resourceType, resourceId, role, assignedBy } = params;

    try {
      const [assignment] = await drizzle
        .insert(schema.resourceAssignments)
        .values({
          userId,
          organizationId,
          resourceType,
          resourceId,
          role: role ?? null,
          assignedBy,
        })
        .returning();

      logger.info({ userId, organizationId, resourceType, resourceId }, "Assigned user to resource");

      return {
        id: assignment.id,
        userId: assignment.userId,
        resourceType: assignment.resourceType,
        resourceId: assignment.resourceId,
        role: assignment.role,
        assignedBy: assignment.assignedBy,
        assignedAt: assignment.assignedAt.toISOString(),
        expiresAt: assignment.expiresAt?.toISOString() ?? null,
      };
    } catch (err) {
      logger.error(
        { error: err, userId, organizationId, resourceType, resourceId },
        "Failed to assign resource",
      );
      throw err;
    }
  }

  async hasResourceAccess(
    userId: string,
    organizationId: string,
    resourceType: ResourceType,
    resourceId: string,
  ): Promise<boolean> {
    const { drizzle } = this.deps;

    const member = await drizzle.query.members.findFirst({
      where: and(eq(schema.members.userId, userId), eq(schema.members.organizationId, organizationId)),
    });

    if (!member) {
      return false;
    }

    const role = member.role;

    if (role === "owner" || role === "admin") {
      return true;
    }

    const userIdsToCheck = [userId];

    const isManager = await this.hierarchyService.isManager(userId, organizationId);
    if (isManager) {
      const subordinateIds = await this.hierarchyService.getSubordinateUserIds(userId, organizationId);
      userIdsToCheck.push(...subordinateIds);
    }

    const assignment = await drizzle.query.resourceAssignments.findFirst({
      where: and(
        inArray(schema.resourceAssignments.userId, userIdsToCheck),
        eq(schema.resourceAssignments.organizationId, organizationId),
        eq(schema.resourceAssignments.resourceType, resourceType),
        eq(schema.resourceAssignments.resourceId, resourceId),
      ),
    });

    return !!assignment;
  }

  async unassignResource(userId: string, resourceType: ResourceType, resourceId: string): Promise<void> {
    const { drizzle, logger } = this.deps;

    try {
      await drizzle
        .delete(schema.resourceAssignments)
        .where(
          and(
            eq(schema.resourceAssignments.userId, userId),
            eq(schema.resourceAssignments.resourceType, resourceType),
            eq(schema.resourceAssignments.resourceId, resourceId),
          ),
        );

      logger.info({ userId, resourceType, resourceId }, "Unassigned user from resource");
    } catch (err) {
      logger.error({ error: err, userId, resourceType, resourceId }, "Failed to unassign resource");
      throw err;
    }
  }

  async getResourceAssignments(
    organizationId: string,
    resourceType: ResourceType,
    resourceId: string,
  ): Promise<ResourceAssignmentResponse[]> {
    const { drizzle } = this.deps;

    const assignments = await drizzle.query.resourceAssignments.findMany({
      where: and(
        eq(schema.resourceAssignments.organizationId, organizationId),
        eq(schema.resourceAssignments.resourceType, resourceType),
        eq(schema.resourceAssignments.resourceId, resourceId),
      ),
    });

    return assignments.map((assignment) => ({
      id: assignment.id,
      userId: assignment.userId,
      resourceType: assignment.resourceType,
      resourceId: assignment.resourceId,
      role: assignment.role,
      assignedBy: assignment.assignedBy,
      assignedAt: assignment.assignedAt.toISOString(),
      expiresAt: assignment.expiresAt?.toISOString() ?? null,
    }));
  }
}
