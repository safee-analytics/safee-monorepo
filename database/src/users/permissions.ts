import { eq } from "drizzle-orm";
import type { DbDeps } from "../deps.js";
import {
  roles,
  permissions,
  userRoles,
  rolePermissions,
  type PermissionAction,
  type PermissionResource,
} from "../drizzle/index.js";

export interface UserPermission {
  id: string;
  name: string;
  slug: string;
  resource: PermissionResource;
  action: PermissionAction;
  description?: string | null;
}

export interface UserRole {
  id: string;
  name: string;
  slug: string;
  description?: string | null;
  isSystemRole: boolean;
}

export async function getUserRoles(deps: DbDeps, userId: string): Promise<UserRole[]> {
  const { drizzle } = deps;

  const result = await drizzle
    .select({
      role: roles,
    })
    .from(userRoles)
    .innerJoin(roles, eq(userRoles.roleId, roles.id))
    .where(eq(userRoles.userId, userId));

  return result.map(({ role }) => ({
    id: role.id,
    name: role.name,
    slug: role.slug,
    description: role.description,
    isSystemRole: role.isSystemRole,
  }));
}

export async function getUserPermissions(deps: DbDeps, userId: string): Promise<UserPermission[]> {
  const { drizzle } = deps;

  const result = await drizzle
    .select({
      permission: permissions,
    })
    .from(userRoles)
    .innerJoin(rolePermissions, eq(userRoles.roleId, rolePermissions.roleId))
    .innerJoin(permissions, eq(rolePermissions.permissionId, permissions.id))
    .where(eq(userRoles.userId, userId));

  return result.map(({ permission }) => ({
    id: permission.id,
    name: permission.name,
    slug: permission.slug,
    resource: permission.resource,
    action: permission.action,
    description: permission.description,
  }));
}

export async function userHasPermission(
  deps: DbDeps,
  userId: string,
  resource: PermissionResource,
  action: PermissionAction,
): Promise<boolean> {
  const userPermissions = await getUserPermissions(deps, userId);

  return userPermissions.some(
    (permission) => permission.resource === resource && permission.action === action,
  );
}

export async function userHasAnyPermission(
  deps: DbDeps,
  userId: string,
  requiredPermissions: { resource: PermissionResource; action: PermissionAction }[],
): Promise<boolean> {
  const userPermissions = await getUserPermissions(deps, userId);

  return requiredPermissions.some((required) =>
    userPermissions.some(
      (userPerm) => userPerm.resource === required.resource && userPerm.action === required.action,
    ),
  );
}

export async function assignRoleToUser(deps: DbDeps, userId: string, roleId: string): Promise<void> {
  const { drizzle, logger } = deps;

  try {
    await drizzle
      .insert(userRoles)
      .values({
        userId,
        roleId,
      })
      .onConflictDoNothing();

    logger.info({ userId, roleId }, "Role assigned to user");
  } catch (err) {
    logger.error({ error: err, userId, roleId }, "Failed to assign role to user");
    throw err;
  }
}

export async function removeRoleFromUser(deps: DbDeps, userId: string, roleId: string): Promise<void> {
  const { drizzle, logger } = deps;

  try {
    await drizzle.delete(userRoles).where(eq(userRoles.userId, userId));

    logger.info({ userId, roleId }, "Role removed from user");
  } catch (err) {
    logger.error({ error: err, userId, roleId }, "Failed to remove role from user");
    throw err;
  }
}

export async function getRoleBySlug(deps: DbDeps, slug: string): Promise<UserRole | null> {
  const { drizzle } = deps;

  const role = await drizzle.query.roles.findFirst({
    where: eq(roles.slug, slug),
  });

  if (!role) {
    return null;
  }

  return {
    id: role.id,
    name: role.name,
    slug: role.slug,
    description: role.description,
    isSystemRole: role.isSystemRole,
  };
}

export async function createSystemRoles(deps: DbDeps): Promise<void> {
  const { drizzle, logger } = deps;

  const systemRoles = [
    {
      name: "Admin",
      slug: "admin",
      description: "Full system access",
      isSystemRole: true,
    },
    {
      name: "Manager",
      slug: "manager",
      description: "Management level access",
      isSystemRole: true,
    },
    {
      name: "Accountant",
      slug: "accountant",
      description: "Financial data access",
      isSystemRole: true,
    },
    {
      name: "Employee",
      slug: "employee",
      description: "Basic employee access",
      isSystemRole: true,
    },
  ];

  try {
    for (const role of systemRoles) {
      await drizzle.insert(roles).values(role).onConflictDoNothing();
    }

    logger.info("System roles created successfully");
  } catch (err) {
    logger.error({ error: err }, "Failed to create system roles");
    throw err;
  }
}

export async function getUserPermissionStrings(deps: DbDeps, userId: string): Promise<string[]> {
  const userPermissions = await getUserPermissions(deps, userId);

  const permissionStrings = userPermissions.map((perm) => `${perm.resource}.${perm.action}`);

  const userRolesList = await getUserRoles(deps, userId);
  const isAdmin = userRolesList.some((role) => role.slug === "admin");

  if (isAdmin) {
    return ["*"];
  }

  return permissionStrings;
}

export async function getUserRoleStrings(deps: DbDeps, userId: string): Promise<string[]> {
  const userRolesList = await getUserRoles(deps, userId);
  return userRolesList.map((role) => role.slug);
}
