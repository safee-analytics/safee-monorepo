import type { AuthenticatedRequest } from "./auth.js";
import { getServerContext } from "../serverContext.js";
import { eq, and, schema } from "@safee/database";
import { InsufficientPermissions } from "../errors.js";
import { defaultRoles } from "../../auth/accessControl.js";

/**
 * Permission actions that can be checked
 */
export type PermissionAction =
  | "create"
  | "read"
  | "update"
  | "delete"
  | "list"
  | "export"
  | "import"
  | "approve"
  | "reject"
  | "manage";

/**
 * Permission resources/entities
 */
export type PermissionResource =
  | "users"
  | "roles"
  | "permissions"
  | "organizations"
  | "invoices"
  | "accounts"
  | "contacts"
  | "deals"
  | "employees"
  | "payroll"
  | "reports"
  | "settings"
  | "audit"
  | "approvals"
  | "teams";

/**
 * Check if user has a specific permission by querying database
 */
export async function hasPermission(
  userId: string,
  organizationId: string,
  action: PermissionAction,
  resource: PermissionResource,
): Promise<boolean> {
  const ctx = getServerContext();

  try {
    // Query user's role in the organization
    const { drizzle } = ctx;
    const { members } = schema;

    const member = await drizzle.query.members.findFirst({
      where: and(eq(members.userId, userId), eq(members.organizationId, organizationId)),
    });

    if (!member) {
      return false;
    }

    // Check if the role has the required permission
    const permissionString = `${resource}:${action}`;
    const role = defaultRoles[member.role as keyof typeof defaultRoles];

    return role.permissions.includes(permissionString);
  } catch (err) {
    ctx.logger.error({ error: err, userId, action, resource }, "Error checking permission");
    return false;
  }
}

/**
 * Check if user is a member of a specific team
 */
export async function isTeamMember(userId: string, teamId: string): Promise<boolean> {
  const ctx = getServerContext();

  try {
    // Query team members directly from database
    const { drizzle } = ctx;
    const { teamMembers } = schema;

    const member = await drizzle.query.teamMembers.findFirst({
      where: and(eq(teamMembers.userId, userId), eq(teamMembers.teamId, teamId)),
    });

    return !!member;
  } catch (err) {
    ctx.logger.error({ error: err, userId, teamId }, "Error checking team membership");
    return false;
  }
}

/**
 * Check if user has a specific role in the organization
 */
export async function hasRole(userId: string, organizationId: string, role: string): Promise<boolean> {
  const ctx = getServerContext();

  try {
    const member = await ctx.drizzle.query.members.findFirst({
      where: and(eq(schema.members.userId, userId), eq(schema.members.organizationId, organizationId)),
    });

    return member?.role === role;
  } catch (err) {
    ctx.logger.error({ error: err, userId, organizationId, role }, "Error checking role");
    return false;
  }
}

/**
 * Middleware to require a specific permission
 */
export function requirePermission(action: PermissionAction, resource: PermissionResource) {
  return async (request: AuthenticatedRequest): Promise<void> => {
    const session = request.betterAuthSession;
    if (!session) {
      throw new InsufficientPermissions();
    }

    const organizationId = session.session.activeOrganizationId;
    if (!organizationId) {
      throw new InsufficientPermissions();
    }

    const allowed = await hasPermission(session.user.id, organizationId, action, resource);

    if (!allowed) {
      throw new InsufficientPermissions();
    }
  };
}

/**
 * Check if user can approve for a specific entity type
 */
export async function canApprove(
  userId: string,
  organizationId: string,
  entityType: string,
): Promise<boolean> {
  return hasPermission(userId, organizationId, "approve", entityType as PermissionResource);
}

/**
 * Check if user can submit an entity for approval
 */
export async function canSubmitForApproval(
  userId: string,
  organizationId: string,
  entityType: string,
): Promise<boolean> {
  return hasPermission(userId, organizationId, "create", entityType as PermissionResource);
}

/**
 * Check if user is part of the approval workflow for an entity
 */
export async function isInApprovalWorkflow(
  userId: string,
  workflowId: string,
  stepOrder: number,
): Promise<boolean> {
  const ctx = getServerContext();

  try {
    // Get the workflow step
    const step = await ctx.drizzle.query.approvalWorkflowSteps.findFirst({
      where: and(
        eq(schema.approvalWorkflowSteps.workflowId, workflowId),
        eq(schema.approvalWorkflowSteps.stepOrder, stepOrder),
      ),
    });

    if (!step) {
      return false;
    }

    // Check based on approver type
    if (step.approverType === "user") {
      return step.approverId === userId;
    }

    if (step.approverType === "team" && step.approverId) {
      return await isTeamMember(userId, step.approverId);
    }

    if (step.approverType === "role" && step.approverId) {
      // approverId in this case is actually a role name stored as string
      const member = await ctx.drizzle.query.members.findFirst({
        where: eq(schema.members.userId, userId),
      });
      return member?.role === step.approverId;
    }

    return false;
  } catch (err) {
    ctx.logger.error(
      { error: err, userId, workflowId, stepOrder },
      "Error checking approval workflow membership",
    );
    return false;
  }
}
