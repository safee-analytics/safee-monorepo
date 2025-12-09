/**
 * Shared type definitions for authentication
 */

export interface SafeeUser {
  id: string;
  email: string;
  name: string;
  role: string;
  organizationId?: string;
  isActive?: boolean;
  emailVerified?: boolean;
  banned?: boolean;
}

export interface SafeeSession {
  user: SafeeUser;
  session: {
    id: string;
    userId: string;
    activeOrganizationId?: string;
    expiresAt: Date;
    ipAddress?: string;
    userAgent?: string;
  };
}

export type UserRole = "admin" | "org_admin" | "manager" | "member" | "viewer";

export interface PermissionCheck {
  userId: string;
  role: UserRole;
  organizationId?: string;
}
