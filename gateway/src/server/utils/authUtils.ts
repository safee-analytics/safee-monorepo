import type { AuthenticatedRequest } from "../middleware/auth.js";
import { BadRequest, Forbidden } from "../errors.js";
import { type DbDeps, schema, eq, and } from "@safee/database";

export interface AuthContext {
  userId: string;
  organizationId: string;
}

export interface AdminAuthContext extends AuthContext {
  role: string;
}

export function requireAuth(request: AuthenticatedRequest): AuthContext {
  const userId = request.betterAuthSession?.user.id;
  const organizationId = request.betterAuthSession?.session.activeOrganizationId;

  if (!userId || !organizationId) {
    throw new BadRequest("User not authenticated or no active organization");
  }

  return { userId, organizationId };
}

export async function requireAdminAuth(
  request: AuthenticatedRequest,
  deps: DbDeps,
): Promise<AdminAuthContext> {
  const { userId, organizationId } = requireAuth(request);

  const member = await deps.drizzle.query.members.findFirst({
    where: and(eq(schema.members.userId, userId), eq(schema.members.organizationId, organizationId)),
  });

  if (!member || (member.role !== "owner" && member.role !== "admin")) {
    throw new Forbidden("Only owners and admins can perform this action");
  }

  return { userId, organizationId, role: member.role };
}

export async function requireManagerAuth(
  request: AuthenticatedRequest,
  deps: DbDeps,
): Promise<AdminAuthContext> {
  const { userId, organizationId } = requireAuth(request);

  const member = await deps.drizzle.query.members.findFirst({
    where: and(eq(schema.members.userId, userId), eq(schema.members.organizationId, organizationId)),
  });

  if (!member || (member.role !== "owner" && member.role !== "admin" && !member.role.includes("manager"))) {
    throw new Forbidden("Only owners, admins, and managers can perform this action");
  }

  return { userId, organizationId, role: member.role };
}
