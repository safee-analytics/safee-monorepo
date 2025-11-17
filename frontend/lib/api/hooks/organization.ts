import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { authClient } from "@/lib/auth/client";

// Query keys for organization-related data
export const organizationQueryKeys = {
  all: ["organizations"] as const,
  organization: (orgId: string) => ["organization", orgId] as const,
  members: (orgId: string) => ["organization", orgId, "members"] as const,
  member: (orgId: string, userId: string) => ["organization", orgId, "members", userId] as const,
  invitations: (orgId: string) => ["organization", orgId, "invitations"] as const,
  roles: (orgId: string) => ["organization", orgId, "roles"] as const,
  role: (orgId: string, roleId: string) => ["organization", orgId, "roles", roleId] as const,
} as const;

// All hooks use Better Auth's organizationClient plugin
// No custom backend needed - Better Auth provides everything!

// Active Organization Hooks
export function useActiveOrganization() {
  // Get the active organization ID from the session
  const { data: session } = authClient.useSession();
  const activeOrgId = session?.session?.activeOrganizationId;

  return useQuery({
    queryKey: organizationQueryKeys.organization(activeOrgId || ""),
    queryFn: async () => {
      if (!activeOrgId) return null;
      const { data, error } = await authClient.organization.get({
        organizationId: activeOrgId,
      });
      if (error) throw new Error(error.message);
      return data;
    },
    enabled: !!activeOrgId,
  });
}

export function useSetActiveOrganization() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (organizationId: string) => {
      const { data, error } = await authClient.organization.setActive({
        organizationId,
      });
      if (error) throw new Error(error.message);
      return data;
    },
    onSuccess: () => {
      // Invalidate all queries since active org changed
      queryClient.invalidateQueries();
    },
  });
}

// Organization Members

/**
 * List all members of an organization
 */
export function useOrganizationMembers(orgId: string) {
  return useQuery({
    queryKey: organizationQueryKeys.members(orgId),
    queryFn: async () => {
      // Better Auth's listMembers is a GET request with query parameter
      const response = await fetch(`/api/v1/organization/list-members?organizationId=${orgId}`, {
        method: "GET",
        credentials: "include",
      });

      if (!response.ok) {
        throw new Error(`Failed to fetch members: ${response.statusText}`);
      }

      const result = await response.json();

      // Better Auth returns { members: [...] }, not a direct array
      return Array.isArray(result) ? result : result.members || [];
    },
    enabled: !!orgId,
  });
}

/**
 * Get single member details
 */
export function useOrganizationMember(orgId: string, userId: string) {
  return useQuery({
    queryKey: organizationQueryKeys.member(orgId, userId),
    queryFn: async () => {
      const { data, error } = await authClient.organization.getMember({
        organizationId: orgId,
        userId,
      });
      if (error) throw new Error(error.message);
      return data;
    },
    enabled: !!orgId && !!userId,
  });
}

export function useInviteMember() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      orgId,
      invitation,
    }: {
      orgId: string;
      invitation: { email: string; role: string; name?: string };
    }) => {
      const { data, error } = await authClient.organization.inviteMember({
        organizationId: orgId,
        email: invitation.email,
        role: invitation.role,
      });
      if (error) throw new Error(error.message);
      return data;
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: organizationQueryKeys.members(variables.orgId) });
      queryClient.invalidateQueries({ queryKey: organizationQueryKeys.invitations(variables.orgId) });
    },
  });
}

export function useUpdateMemberRole() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ orgId, userId, role }: { orgId: string; userId: string; role: string }) => {
      const { data, error } = await authClient.organization.updateMemberRole({
        organizationId: orgId,
        userId,
        role,
      });
      if (error) throw new Error(error.message);
      return data;
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({
        queryKey: organizationQueryKeys.member(variables.orgId, variables.userId),
      });
      queryClient.invalidateQueries({ queryKey: organizationQueryKeys.members(variables.orgId) });
    },
  });
}

export function useRemoveMember() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ orgId, userId }: { orgId: string; userId: string }) => {
      const { data, error } = await authClient.organization.removeMember({
        organizationId: orgId,
        userId,
      });
      if (error) throw new Error(error.message);
      return data;
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: organizationQueryKeys.members(variables.orgId) });
    },
  });
}

// Organization Invitations
export function useOrganizationInvitations(orgId: string) {
  return useQuery({
    queryKey: organizationQueryKeys.invitations(orgId),
    queryFn: async () => {
      const { data, error } = await authClient.organization.listInvitations({
        organizationId: orgId,
      });
      if (error) throw new Error(error.message);
      return data;
    },
    enabled: !!orgId,
  });
}

export function useCancelInvitation() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ orgId, invitationId }: { orgId: string; invitationId: string }) => {
      const { data, error } = await authClient.organization.cancelInvitation({
        invitationId,
      });
      if (error) throw new Error(error.message);
      return data;
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: organizationQueryKeys.invitations(variables.orgId) });
    },
  });
}

/**
 * Accept invitation to join organization
 */
export function useAcceptInvitation() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ invitationId }: { invitationId: string }) => {
      const { data, error } = await authClient.organization.acceptInvitation({
        invitationId,
      });
      if (error) throw new Error(error.message);
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: organizationQueryKeys.all });
    },
  });
}

/**
 * Reject invitation to join organization
 */
export function useRejectInvitation() {
  return useMutation({
    mutationFn: async ({ invitationId }: { invitationId: string }) => {
      const { data, error } = await authClient.organization.rejectInvitation({
        invitationId,
      });
      if (error) throw new Error(error.message);
      return data;
    },
  });
}

// Organization Management

/**
 * List all organizations user belongs to
 */
export function useListOrganizations() {
  return useQuery({
    queryKey: organizationQueryKeys.all,
    queryFn: async () => {
      const { data, error } = await authClient.organization.list();
      if (error) throw new Error(error.message);
      return data;
    },
  });
}

/**
 * Get single organization details
 */
export function useOrganization(orgId: string) {
  return useQuery({
    queryKey: organizationQueryKeys.organization(orgId),
    queryFn: async () => {
      const { data, error } = await authClient.organization.get({
        organizationId: orgId,
      });
      if (error) throw new Error(error.message);
      return data;
    },
    enabled: !!orgId,
  });
}

/**
 * Create new organization
 */
export function useCreateOrganization() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ name, slug }: { name: string; slug?: string }) => {
      const { data, error } = await authClient.organization.create({
        name,
        slug,
      });
      if (error) throw new Error(error.message);
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: organizationQueryKeys.all });
    },
  });
}

/**
 * Update organization details
 */
export function useUpdateOrganization() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ orgId, name, slug }: { orgId: string; name?: string; slug?: string }) => {
      const { data, error } = await authClient.organization.update({
        organizationId: orgId,
        name,
        slug,
      });
      if (error) throw new Error(error.message);
      return data;
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: organizationQueryKeys.organization(variables.orgId) });
      queryClient.invalidateQueries({ queryKey: organizationQueryKeys.all });
    },
  });
}

/**
 * Delete organization
 */
export function useDeleteOrganization() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ orgId }: { orgId: string }) => {
      const { data, error } = await authClient.organization.delete({
        organizationId: orgId,
      });
      if (error) throw new Error(error.message);
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: organizationQueryKeys.all });
    },
  });
}

/**
 * Leave organization (for members)
 */
export function useLeaveOrganization() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ orgId }: { orgId: string }) => {
      const { data, error } = await authClient.organization.leave({
        organizationId: orgId,
      });
      if (error) throw new Error(error.message);
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: organizationQueryKeys.all });
    },
  });
}

// Custom Organization Roles (Permission Mappings)
export function useOrganizationRoles(orgId: string) {
  return useQuery({
    queryKey: organizationQueryKeys.roles(orgId),
    queryFn: async () => {
      // Better Auth's listRoles is a GET request
      const response = await fetch(`/api/v1/organization/list-roles?organizationId=${orgId}`, {
        method: "GET",
        credentials: "include",
      });

      if (!response.ok) {
        throw new Error(`Failed to fetch roles: ${response.statusText}`);
      }

      return response.json();
    },
    enabled: !!orgId,
  });
}

export function useCreateRole() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ orgId, role, permission }: { orgId: string; role: string; permission: string }) => {
      const response = await fetch("/api/v1/organization/create-role", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({
          organizationId: orgId,
          role,
          permission,
        }),
      });

      if (!response.ok) {
        const error = await response.json().catch(() => ({ message: response.statusText }));
        throw new Error(error.message || "Failed to create role");
      }

      return response.json();
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: organizationQueryKeys.roles(variables.orgId) });
    },
  });
}

export function useUpdateRolePermissions() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      orgId,
      roleId,
      permissions,
    }: {
      orgId: string;
      roleId: string;
      permissions: string[];
    }) => {
      const response = await fetch("/api/v1/organization/update-role", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({
          organizationId: orgId,
          roleId,
          permissions,
        }),
      });

      if (!response.ok) {
        const error = await response.json().catch(() => ({ message: response.statusText }));
        throw new Error(error.message || "Failed to update role");
      }

      return response.json();
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: organizationQueryKeys.roles(variables.orgId) });
      queryClient.invalidateQueries({
        queryKey: organizationQueryKeys.role(variables.orgId, variables.roleId),
      });
    },
  });
}

export function useDeleteRole() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ orgId, roleId }: { orgId: string; roleId: string }) => {
      const response = await fetch("/api/v1/organization/delete-role", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({
          organizationId: orgId,
          roleId,
        }),
      });

      if (!response.ok) {
        const error = await response.json().catch(() => ({ message: response.statusText }));
        throw new Error(error.message || "Failed to delete role");
      }

      return response.json();
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: organizationQueryKeys.roles(variables.orgId) });
    },
  });
}

export function useHasPermission() {
  return useMutation({
    mutationFn: async ({ orgId, permission }: { orgId: string; permission: string }) => {
      const response = await fetch("/api/v1/organization/has-permission", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({
          organizationId: orgId,
          permission,
        }),
      });

      if (!response.ok) {
        const error = await response.json().catch(() => ({ message: response.statusText }));
        throw new Error(error.message || "Failed to check permission");
      }

      return response.json();
    },
  });
}

// ============================================================================
// Additional Organization Endpoints
// ============================================================================

/**
 * Get full organization details including all metadata
 */
export function useFullOrganization(orgId: string) {
  return useQuery({
    queryKey: [...organizationQueryKeys.organization(orgId), "full"] as const,
    queryFn: async () => {
      const { data, error } = await authClient.organization.getFullOrganization({
        organizationId: orgId,
      });
      if (error) throw new Error(error.message);
      return data;
    },
    enabled: !!orgId,
  });
}

/**
 * Check if organization slug is available
 */
export function useCheckOrgSlug() {
  return useMutation({
    mutationFn: async (slug: string) => {
      const { data, error } = await authClient.organization.checkSlug({
        slug,
      });
      if (error) throw new Error(error.message);
      return data;
    },
  });
}

/**
 * Get active member details
 */
export function useActiveOrgMember(orgId: string) {
  return useQuery({
    queryKey: [...organizationQueryKeys.organization(orgId), "active-member"] as const,
    queryFn: async () => {
      const { data, error } = await authClient.organization.getActiveMember({
        organizationId: orgId,
      });
      if (error) throw new Error(error.message);
      return data;
    },
    enabled: !!orgId,
  });
}

/**
 * Get active member's role
 */
export function useActiveOrgMemberRole(orgId: string) {
  return useQuery({
    queryKey: [...organizationQueryKeys.organization(orgId), "active-member-role"] as const,
    queryFn: async () => {
      const { data, error } = await authClient.organization.getActiveMemberRole({
        organizationId: orgId,
      });
      if (error) throw new Error(error.message);
      return data;
    },
    enabled: !!orgId,
  });
}

// ============================================================================
// User-Specific Organization Queries
// ============================================================================

/**
 * List all invitations for current user across all organizations
 */
export function useUserOrganizationInvitations() {
  return useQuery({
    queryKey: ["user", "organization-invitations"] as const,
    queryFn: async () => {
      const { data, error } = await authClient.organization.listUserInvitations();
      if (error) throw new Error(error.message);
      return data;
    },
  });
}

/**
 * List all teams current user belongs to
 */
export function useUserTeams(orgId: string) {
  return useQuery({
    queryKey: ["user", "teams", orgId] as const,
    queryFn: async () => {
      const { data, error } = await authClient.organization.listUserTeams({
        organizationId: orgId,
      });
      if (error) throw new Error(error.message);
      return data;
    },
    enabled: !!orgId,
  });
}

/**
 * Get single invitation details
 */
export function useInvitation(invitationId: string) {
  return useQuery({
    queryKey: ["invitation", invitationId] as const,
    queryFn: async () => {
      const { data, error } = await authClient.organization.getInvitation({
        invitationId,
      });
      if (error) throw new Error(error.message);
      return data;
    },
    enabled: !!invitationId,
  });
}

/**
 * Get single role details
 */
export function useOrganizationRole(orgId: string, roleId: string) {
  return useQuery({
    queryKey: organizationQueryKeys.role(orgId, roleId),
    queryFn: async () => {
      const { data, error } = await authClient.organization.getRole({
        organizationId: orgId,
        roleId,
      });
      if (error) throw new Error(error.message);
      return data;
    },
    enabled: !!orgId && !!roleId,
  });
}

// ============================================================================
// Audit Logs
// ============================================================================

export interface AuditLogFilters {
  startDate?: Date;
  endDate?: Date;
  userId?: string;
  actionType?: string;
  resourceType?: string;
  limit?: number;
  offset?: number;
}

export interface AuditLog {
  id: string;
  organizationId: string;
  userId: string;
  userName?: string;
  action: string;
  resourceType: string;
  resourceId?: string;
  metadata?: Record<string, unknown>;
  ipAddress?: string;
  userAgent?: string;
  createdAt: string;
}

/**
 * Get organization audit logs with filtering
 */
export function useOrganizationAuditLogs(orgId: string, filters?: AuditLogFilters) {
  return useQuery({
    queryKey: ["organization", orgId, "audit-logs", filters] as const,
    queryFn: async () => {
      // Note: Better Auth might not have built-in audit logs
      // This may need to be a custom endpoint
      const { data, error } = await authClient.organization.getAuditLogs?.({
        organizationId: orgId,
        ...filters,
      });
      if (error) throw new Error(error.message);
      return data as AuditLog[];
    },
    enabled: !!orgId,
  });
}

/**
 * Get user activity logs
 */
export function useUserActivityLogs(userId: string, filters?: AuditLogFilters) {
  return useQuery({
    queryKey: ["user", userId, "activity-logs", filters] as const,
    queryFn: async () => {
      const { data, error } = await authClient.getUserActivityLogs?.({
        userId,
        ...filters,
      });
      if (error) throw new Error(error.message);
      return data as AuditLog[];
    },
    enabled: !!userId,
  });
}

/**
 * Export audit logs to CSV/JSON
 */
export function useExportAuditLogs() {
  return useMutation({
    mutationFn: async (data: { orgId: string; format: "csv" | "json"; filters?: AuditLogFilters }) => {
      const { data: result, error } = await authClient.organization.exportAuditLogs?.({
        organizationId: data.orgId,
        format: data.format,
        ...data.filters,
      });
      if (error) throw new Error(error.message);
      return result;
    },
  });
}
