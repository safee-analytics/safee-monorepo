import { headers } from "next/headers";

/**
 * Permission helpers for Server Components
 * Access user context from middleware headers
 */

export interface CurrentUser {
  id: string;
  role: string;
  email: string;
  name: string;
  organizationId: string;
}

/**
 * Get current user from middleware headers
 * Use this in Server Components to access authenticated user
 */
export async function getCurrentUser(): Promise<CurrentUser> {
  const headersList = await headers();

  return {
    id: headersList.get("x-user-id") || "",
    role: headersList.get("x-user-role") || "",
    email: headersList.get("x-user-email") || "",
    name: headersList.get("x-user-name") || "",
    organizationId: headersList.get("x-org-id") || "",
  };
}

/**
 * Check if current user is a super admin
 */
export async function isSuperAdmin(): Promise<boolean> {
  const user = await getCurrentUser();
  return user.role === "admin";
}

/**
 * Check if current user is an org admin or super admin
 */
export async function isOrgAdmin(): Promise<boolean> {
  const user = await getCurrentUser();
  return user.role === "admin" || user.role === "org_admin";
}

/**
 * Check if current user can access a specific organization
 */
export async function canAccessOrg(targetOrgId: string): Promise<boolean> {
  const user = await getCurrentUser();

  // Super admins can access all orgs
  if (user.role === "admin") return true;

  // Org admins can only access their own org
  return user.organizationId === targetOrgId;
}

/**
 * Get access scope for current user
 */
export async function getAccessScope(): Promise<"global" | "organization" | "none"> {
  const user = await getCurrentUser();

  if (user.role === "admin") return "global";
  if (user.role === "org_admin") return "organization";
  return "none";
}
