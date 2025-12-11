import { useActiveOrganization, useOrganizationMembers } from "./organization";
import { authClient } from "@/lib/auth/client";
import {
  settingsPermissions,
  modulePermissions,
  canManageRole,
  getManageableRoles,
} from "@/lib/permissions/accessControl";
import { useQuery } from "@tanstack/react-query";

export function useIsOrganizationOwner(): boolean {
  const { data: session } = authClient.useSession();
  const { data: organization } = useActiveOrganization();
  const { data: members } = useOrganizationMembers(organization?.id || "");

  if (!session?.user || !members) return false;

  // Check if user has "owner" role in the organization
  const currentMember = members.find((m) => m.userId === session.user.id);
  return currentMember?.role === "owner";
}

export function useIsOrganizationAdmin(): boolean {
  const { data: session } = authClient.useSession();
  const { data: organization } = useActiveOrganization();
  const { data: members } = useOrganizationMembers(organization?.id || "");

  if (!session?.user || !members) return false;

  // Check if user has "admin" or "owner" role
  const currentMember = members.find((m) => m.userId === session.user.id);
  return currentMember?.role === "admin" || currentMember?.role === "owner";
}

export function useOrganizationRole(): "owner" | "admin" | "member" | null {
  const { data: session } = authClient.useSession();
  const { data: organization } = useActiveOrganization();
  const { data: members } = useOrganizationMembers(organization?.id || "");

  if (!session?.user || !members) return null;

  const currentMember = members.find((m) => m.userId === session.user.id);
  return currentMember?.role ?? null;
}

/**
 * Check if the current user has a specific permission using Better Auth API
 */
export function useHasPermission(permission: string): boolean {
  const { data: organization } = useActiveOrganization();
  const { data: session } = authClient.useSession();

  // Owner has all permissions
  const isOwner = useIsOrganizationOwner();

  // Query the has-permission endpoint
  const { data: result } = useQuery({
    queryKey: ["permission", organization?.id, permission],
    queryFn: async () => {
      if (!organization?.id) return false;

      try {
        // Convert string permission to object format (resource:action -> {resource: [action]})
        const [resource, action] = permission.split(":");
        const permissionObj = { [resource]: [action] };

        const response = await authClient.organization.hasPermission({
          organizationId: organization.id,
          permission: permissionObj as Record<string, string[]>,
        });
        return response.data?.success ?? false;
      } catch (err) {
        console.error("Error checking permission:", err);
        return false;
      }
    },
    enabled: !!session?.user && !!organization?.id && !isOwner,
    staleTime: 30000, // Cache for 30 seconds
  });

  // Owner has all permissions
  if (isOwner) {
    return true;
  }

  return result ?? false;
}

/**
 * Check if the current user has any of the specified permissions
 */
export function useHasAnyPermission(permissions: string[]): boolean {
  const { data: organization } = useActiveOrganization();
  const { data: session } = authClient.useSession();
  const isOwner = useIsOrganizationOwner();

  // Check all permissions in parallel
  const { data: results } = useQuery({
    queryKey: ["permissions-any", organization?.id, permissions],
    queryFn: async () => {
      if (!organization?.id) return false;

      try {
        const checks = await Promise.all(
          permissions.map(async (permission) => {
            try {
              // Convert string permission to object format
              const [resource, action] = permission.split(":");
              const permissionObj = { [resource]: [action] };

              const response = await authClient.organization.hasPermission({
                organizationId: organization.id,
                permission: permissionObj as Record<string, string[]>,
              });
              return response.data?.success ?? false;
            } catch (err) {
              console.error(`Error checking permission ${permission}:`, err);
              return false;
            }
          }),
        );
        // Return true if ANY permission is true
        return checks.some((result) => result);
      } catch (err) {
        console.error("Error checking permissions:", err);
        return false;
      }
    },
    enabled: !!session?.user && !!organization?.id && !isOwner && permissions.length > 0,
    staleTime: 30000, // Cache for 30 seconds
  });

  // If no permissions required, return true
  if (permissions.length === 0) {
    return true;
  }

  // Owner has all permissions
  if (isOwner) {
    return true;
  }

  if (!session?.user || !organization?.id) {
    return false;
  }

  return results ?? false;
}

/**
 * Check if the current user has all of the specified permissions
 */
export function useHasAllPermissions(permissions: string[]): boolean {
  const { data: organization } = useActiveOrganization();
  const { data: session } = authClient.useSession();
  const isOwner = useIsOrganizationOwner();

  // Check all permissions in parallel
  const { data: results } = useQuery({
    queryKey: ["permissions-all", organization?.id, permissions],
    queryFn: async () => {
      if (!organization?.id) return false;

      try {
        const checks = await Promise.all(
          permissions.map(async (permission) => {
            try {
              // Convert string permission to object format
              const [resource, action] = permission.split(":");
              const permissionObj = { [resource]: [action] };

              const response = await authClient.organization.hasPermission({
                organizationId: organization.id,
                permission: permissionObj as Record<string, string[]>,
              });
              return response.data?.success ?? false;
            } catch (err) {
              console.error(`Error checking permission ${permission}:`, err);
              return false;
            }
          }),
        );
        // Return true only if ALL permissions are true
        return checks.every((result) => result);
      } catch (err) {
        console.error("Error checking permissions:", err);
        return false;
      }
    },
    enabled: !!session?.user && !!organization?.id && !isOwner && permissions.length > 0,
    staleTime: 30000, // Cache for 30 seconds
  });

  // If no permissions required, return true
  if (permissions.length === 0) {
    return true;
  }

  // Owner has all permissions
  if (isOwner) {
    return true;
  }

  if (!session?.user || !organization?.id) {
    return false;
  }

  return results ?? false;
}

/**
 * Check if user can access a settings page
 */
export function useCanAccessSettingsPage(page: keyof typeof settingsPermissions): boolean {
  const requiredPermissions = settingsPermissions[page];
  return useHasAnyPermission([...requiredPermissions]);
}

/**
 * Check if user can access a module
 */
export function useCanAccessModule(moduleKey: keyof typeof modulePermissions): boolean {
  const requiredPermissions = modulePermissions[moduleKey] || [];
  return useHasAnyPermission([...requiredPermissions]);
}

/**
 * Get current user's role in the organization
 */
export function useCurrentUserRole(): string | null {
  const { data: session } = authClient.useSession();
  const { data: organization } = useActiveOrganization();

  // Query the get-role endpoint for current user's role
  const { data: roleData } = useQuery({
    queryKey: ["user-role", organization?.id],
    queryFn: async () => {
      if (!organization?.id) return null;

      try {
        // Get current member's role
        const membersResponse = await authClient.organization.listMembers();
        const currentMember = membersResponse.data?.members?.find(
          (m) => m.userId === session?.user?.id && m.organizationId === organization.id,
        );
        return currentMember?.role || null;
      } catch (err) {
        console.error("Error fetching user role:", err);
        return null;
      }
    },
    enabled: !!session?.user && !!organization?.id,
    staleTime: 60000, // Cache for 1 minute
  });

  return roleData ?? null;
}

/**
 * Check if current user can manage another user based on role hierarchy
 *
 * @param targetUserId - The ID of the user to check management rights for
 * @returns true if current user can manage the target user
 */
export function useCanManageUser(targetUserId: string): boolean {
  const { data: session } = authClient.useSession();
  const { data: organization } = useActiveOrganization();
  const { data: members } = useOrganizationMembers(organization?.id || "");

  if (!session?.user || !organization || !members) {
    return false;
  }

  // Cannot manage yourself
  if (targetUserId === session.user.id) {
    return false;
  }

  // Find both users' roles
  const currentMember = members.find((m) => m.userId === session.user.id);
  const targetMember = members.find((m) => m.userId === targetUserId);

  // Owner can manage everyone except themselves
  if (currentMember?.role === "owner") {
    return targetUserId !== session.user.id;
  }

  if (!currentMember?.role || !targetMember?.role) {
    return false;
  }

  // Check hierarchy
  return canManageRole(currentMember.role, targetMember.role);
}

/**
 * Get list of users that the current user can manage
 *
 * @returns Array of user IDs that can be managed
 */
export function useManageableUsers(): string[] {
  const { data: session } = authClient.useSession();
  const { data: organization } = useActiveOrganization();
  const { data: members } = useOrganizationMembers(organization?.id || "");

  if (!session?.user || !organization || !members) {
    return [];
  }

  // Find current user's role
  const currentMember = members.find((m) => m.userId === session.user.id);

  // Owner can manage everyone except themselves
  if (currentMember?.role === "owner") {
    return members.filter((m) => m.userId !== session.user.id).map((m) => m.userId);
  }
  if (!currentMember?.role) {
    return [];
  }

  // Filter members based on hierarchy
  return members
    .filter((member) => {
      // Cannot manage yourself
      if (member.userId === session.user.id) return false;

      // Cannot manage if no role
      if (!member.role) return false;

      // Check hierarchy
      return canManageRole(currentMember.role, member.role);
    })
    .map((m) => m.userId);
}

/**
 * Get list of roles that the current user can assign to others
 *
 * @returns Array of role names that can be assigned
 */
export function useAssignableRoles(): string[] {
  const currentRole = useCurrentUserRole();

  if (!currentRole) {
    return [];
  }

  return getManageableRoles(currentRole);
}
