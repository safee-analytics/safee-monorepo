import type { DrizzleClient } from "@safee/database";
import { schema } from "@safee/database";
import { eq, and } from "drizzle-orm";
import { RoleNotFound } from "../errors.js";

export interface PermissionCheck {
  resource: string;
  action: string;
}

export interface RBACService {
  hasPermission(userId: string, resource: string, action: string): Promise<boolean>;
  hasAnyPermission(userId: string, permissions: PermissionCheck[]): Promise<boolean>;
  hasAllPermissions(userId: string, permissions: PermissionCheck[]): Promise<boolean>;
  getUserPermissions(userId: string): Promise<string[]>;
  getUserRoles(userId: string): Promise<string[]>;
  checkServiceAccess(userId: string, organizationId: string, serviceName: string): Promise<boolean>;
}

export class RBACServiceImpl implements RBACService {
  constructor(private readonly drizzle: DrizzleClient) {}

  async hasPermission(userId: string, resource: string, action: string): Promise<boolean> {
    const permissions = await this.getUserPermissions(userId);

    if (permissions.includes("*")) {
      return true;
    }

    if (permissions.includes(`${resource}.${action}`)) {
      return true;
    }

    if (permissions.includes(`${resource}.*`)) {
      return true;
    }

    if (permissions.includes(`*.${action}`)) {
      return true;
    }

    return false;
  }

  async hasAnyPermission(userId: string, permissions: PermissionCheck[]): Promise<boolean> {
    for (const { resource, action } of permissions) {
      if (await this.hasPermission(userId, resource, action)) {
        return true;
      }
    }
    return false;
  }

  async hasAllPermissions(userId: string, permissions: PermissionCheck[]): Promise<boolean> {
    for (const { resource, action } of permissions) {
      if (!(await this.hasPermission(userId, resource, action))) {
        return false;
      }
    }
    return true;
  }

  async getUserPermissions(userId: string): Promise<string[]> {
    const result = await this.drizzle
      .select({
        resource: schema.permissions.resource,
        action: schema.permissions.action,
      })
      .from(schema.userRoles)
      .innerJoin(schema.rolePermissions, eq(schema.userRoles.roleId, schema.rolePermissions.roleId))
      .innerJoin(schema.permissions, eq(schema.rolePermissions.permissionId, schema.permissions.id))
      .where(eq(schema.userRoles.userId, userId));

    return result.map((p) => `${p.resource}.${p.action}`);
  }

  async getUserRoles(userId: string): Promise<string[]> {
    const result = await this.drizzle
      .select({
        slug: schema.roles.slug,
      })
      .from(schema.userRoles)
      .innerJoin(schema.roles, eq(schema.userRoles.roleId, schema.roles.id))
      .where(and(eq(schema.userRoles.userId, userId), eq(schema.roles.isActive, true)));

    return result.map((r) => r.slug);
  }

  async checkServiceAccess(userId: string, organizationId: string, serviceName: string): Promise<boolean> {
    const service = await this.drizzle.query.services.findFirst({
      where: eq(schema.services.name, serviceName),
    });

    if (!service) {
      return false; // Service doesn't exist
    }

    const orgService = await this.drizzle.query.organizationServices.findFirst({
      where: and(
        eq(schema.organizationServices.organizationId, organizationId),
        eq(schema.organizationServices.serviceId, service.id),
      ),
    });

    if (!orgService || !orgService.isEnabled) {
      return false; // Service not enabled for organization
    }

    const userService = await this.drizzle.query.userServices.findFirst({
      where: and(eq(schema.userServices.userId, userId), eq(schema.userServices.serviceId, service.id)),
    });

    if (userService) {
      return userService.isEnabled;
    }

    return true;
  }

  async assignRoleToUser(userId: string, roleSlug: string): Promise<void> {
    const role = await this.drizzle.query.roles.findFirst({
      where: eq(schema.roles.slug, roleSlug),
    });

    if (!role) {
      throw new RoleNotFound(roleSlug);
    }

    const existing = await this.drizzle.query.userRoles.findFirst({
      where: and(eq(schema.userRoles.userId, userId), eq(schema.userRoles.roleId, role.id)),
    });

    if (existing) {
      return; // Already assigned
    }

    await this.drizzle.insert(schema.userRoles).values({
      userId,
      roleId: role.id,
    });
  }

  async removeRoleFromUser(userId: string, roleSlug: string): Promise<void> {
    // Get role ID
    const role = await this.drizzle.query.roles.findFirst({
      where: eq(schema.roles.slug, roleSlug),
    });

    if (!role) {
      throw new RoleNotFound(roleSlug);
    }

    // Remove role
    await this.drizzle
      .delete(schema.userRoles)
      .where(and(eq(schema.userRoles.userId, userId), eq(schema.userRoles.roleId, role.id)));
  }

  async getAllRoles(): Promise<
    Array<{
      id: string;
      name: string;
      slug: string;
      description: string | null;
      isSystemRole: boolean;
    }>
  > {
    return this.drizzle.query.roles.findMany({
      where: eq(schema.roles.isActive, true),
    });
  }

  async getAllPermissions(): Promise<
    Array<{
      id: string;
      name: string;
      slug: string;
      resource: string;
      action: string;
      description: string | null;
    }>
  > {
    return this.drizzle.query.permissions.findMany();
  }

  async getRolePermissions(roleSlug: string): Promise<string[]> {
    const role = await this.drizzle.query.roles.findFirst({
      where: eq(schema.roles.slug, roleSlug),
      with: {
        rolePermissions: {
          with: {
            permission: true,
          },
        },
      },
    });

    if (!role) {
      return [];
    }

    return role.rolePermissions.map((rp) => `${rp.permission.resource}.${rp.permission.action}`);
  }
}

export function hasPermission(user: { permissions: string[] }, resource: string, action: string): boolean {
  if (user.permissions.includes("*")) {
    return true;
  }

  if (user.permissions.includes(`${resource}.${action}`)) {
    return true;
  }

  if (user.permissions.includes(`${resource}.*`)) {
    return true;
  }

  if (user.permissions.includes(`*.${action}`)) {
    return true;
  }

  return false;
}

export function hasAnyPermission(user: { permissions: string[] }, permissions: PermissionCheck[]): boolean {
  for (const { resource, action } of permissions) {
    if (hasPermission(user, resource, action)) {
      return true;
    }
  }
  return false;
}

export function hasRole(user: { roles: string[] }, role: string): boolean {
  return user.roles.includes(role) || user.roles.includes("admin");
}
