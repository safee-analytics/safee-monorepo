/**
 * Permission checking utilities
 * Shared across admin dashboard and main application
 */

import type { SafeeUser, UserRole } from "./types.js";

/**
 * Check if a user is a super admin (platform-wide access)
 */
export function isSuperAdmin(user: { role: string }): boolean {
  return user.role === "admin";
}

/**
 * Check if a user is an organization admin
 */
export function isOrgAdmin(user: { role: string }): boolean {
  return user.role === "org_admin" || user.role === "admin";
}

/**
 * Check if a user can access a specific organization's data
 * Super admins can access all orgs, org admins can only access their own
 */
export function canAccessOrg(
  user: { role: string; organizationId?: string },
  targetOrgId: string,
): boolean {
  if (isSuperAdmin(user)) return true;
  if (!user.organizationId) return false;
  return user.organizationId === targetOrgId;
}

/**
 * Check if a user has admin privileges (super admin or org admin)
 */
export function hasAdminAccess(user: { role: string }): boolean {
  return isSuperAdmin(user) || isOrgAdmin(user);
}

/**
 * Get the scope of data a user can access
 * Returns 'global' for super admins, 'organization' for org admins
 */
export function getAccessScope(user: { role: string }): "global" | "organization" | "none" {
  if (isSuperAdmin(user)) return "global";
  if (isOrgAdmin(user)) return "organization";
  return "none";
}

/**
 * Filter items by organization access
 * Super admins see all, org admins see only their org
 */
export function filterByOrgAccess<T extends { organizationId?: string | null }>(
  items: T[],
  user: { role: string; organizationId?: string },
): T[] {
  if (isSuperAdmin(user)) return items;
  if (!user.organizationId) return [];

  return items.filter((item) => item.organizationId === user.organizationId);
}
