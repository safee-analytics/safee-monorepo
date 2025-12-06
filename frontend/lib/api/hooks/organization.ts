import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { authClient } from "@/lib/auth/client";
import { apiClient, handleApiError } from "../client";

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

export function useActiveOrganization() {
  // Get the active organization ID from the session
  const { data: session } = authClient.useSession();
  const activeOrgId = session?.session?.activeOrganizationId;

  return useQuery({
    queryKey: organizationQueryKeys.organization(activeOrgId || ""),
    queryFn: async () => {
      if (!activeOrgId) return null;
      const { data, error } = await authClient.organization.getFullOrganization();
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
      queryClient.invalidateQueries();
    },
  });
}

export function useOrganizationMembers(orgId: string) {
  const { data: session } = authClient.useSession();
  const activeOrgId = session?.session?.activeOrganizationId;

  return useQuery({
    queryKey: organizationQueryKeys.members(orgId),
    queryFn: async () => {
      if (orgId !== activeOrgId) {
        throw new Error("Can only list members for active organization. Set it as active first.");
      }

      const { data, error } = await authClient.organization.listMembers();
      if (error) throw new Error(error.message);

      return data?.members ?? [];
    },
    enabled: !!orgId && orgId === activeOrgId,
  });
}

export function useOrganizationMember(orgId: string, userId: string) {
  return useQuery({
    queryKey: organizationQueryKeys.member(orgId, userId),
    queryFn: async () => {
      // Get all members and filter for the specific user
      const { data, error } = await authClient.organization.listMembers();
      if (error) throw new Error(error.message);
      return data?.members?.find((m) => m.userId === userId) ?? null;
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
        role: invitation.role as "member" | "admin" | "owner",
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
        memberId: userId,
        role: role as "member" | "admin" | "owner",
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
        memberIdOrEmail: userId,
      });
      if (error) throw new Error(error.message);
      return data;
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: organizationQueryKeys.members(variables.orgId) });
    },
  });
}

export function useOrganizationInvitations(orgId: string) {
  return useQuery({
    queryKey: organizationQueryKeys.invitations(orgId),
    queryFn: async () => {
      const { data, error } = await authClient.organization.listInvitations();
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
      console.warn(`Canceling invitation ${invitationId} for organization ${orgId}`);

      const { data, error } = await authClient.organization.cancelInvitation({
        invitationId,
      });
      if (error) {
        console.error(`Failed to cancel invitation ${invitationId} for org ${orgId}:`, error.message);
        throw new Error(error.message);
      }

      console.warn(`Successfully canceled invitation ${invitationId} for organization ${orgId}`);
      return data;
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: organizationQueryKeys.invitations(variables.orgId) });
    },
  });
}

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

export function useOrganization(orgId: string) {
  return useQuery({
    queryKey: organizationQueryKeys.organization(orgId),
    queryFn: async () => {
      const { data: orgs, error } = await authClient.organization.list();
      if (error) throw new Error(error.message);

      const org = orgs?.find((o) => o.id === orgId);
      return org ?? null;
    },
    enabled: !!orgId,
  });
}

export function useCreateOrganization() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ name, slug, logo }: { name: string; slug: string; logo?: string }) => {
      // Get the next available slug from the backend
      const { data: slugData, error: slugError } = await apiClient.GET("/organizations/slugs/next", {
        params: { query: { baseSlug: slug } },
      });

      if (slugError || !slugData) {
        throw new Error("Failed to generate unique slug");
      }

      const { data, error } = await authClient.organization.create({
        name,
        slug: slugData.nextSlug,
        ...(logo && { logo }),
        keepCurrentActiveOrganization: false,
      });
      if (error) throw new Error(error.message);
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: organizationQueryKeys.all });
    },
  });
}

export function useUpdateOrganization() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      orgId,
      name,
      slug,
    }: {
      orgId: string;
      name?: string;
      slug?: string;
      logo?: string;
      metadata?: Record<string, unknown>;
    }) => {
      const { data, error } = await authClient.organization.update({
        organizationId: orgId,

        data: {
          name,
          slug,
        },
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

export function useOrganizationRoles(orgId: string) {
  const { data: session } = authClient.useSession();
  const activeOrgId = session?.session?.activeOrganizationId;

  return useQuery({
    queryKey: organizationQueryKeys.roles(orgId),
    queryFn: async () => {
      // Verify requested org is the active one
      if (orgId !== activeOrgId) {
        throw new Error("Can only list roles for active organization. Set it as active first.");
      }

      const { data, error } = await authClient.organization.listRoles();
      if (error) throw new Error(error.message);
      return data;
    },
    enabled: !!orgId && orgId === activeOrgId,
  });
}

export function useCreateRole() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      orgId,
      role,
      permission,
    }: {
      orgId: string;
      role: string;
      permission: string | Record<string, string[]>;
    }) => {
      // Convert string permission to object format if needed
      let permissionObj: Record<string, string[]>;
      if (typeof permission === "string") {
        const [resource, ...actions] = permission.split(":");
        permissionObj = { [resource]: actions };
      } else {
        permissionObj = permission;
      }

      const { data, error } = await authClient.organization.createRole({
        organizationId: orgId,
        role,
        permission: permissionObj,
      });
      if (error) throw new Error(error.message || "Failed to create role");
      return data;
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
      roleName,
      permissions,
    }: {
      orgId: string;
      roleName: string;
      permissions: string[];
    }) => {
      // Convert array of permissions to object format
      const permissionObj: Record<string, string[]> = {};
      permissions.forEach((perm) => {
        const [resource, action] = perm.split(":");
        if (!permissionObj[resource]) {
          permissionObj[resource] = [];
        }
        if (action) {
          permissionObj[resource].push(action);
        }
      });

      const { data, error } = await authClient.organization.updateRole({
        roleName,
        organizationId: orgId,
        data: {
          permission: permissionObj,
        },
      } as Parameters<(typeof authClient.organization)["updateRole"]>[0]);

      if (error) throw new Error(error.message || "Failed to update role");
      return data;
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: organizationQueryKeys.roles(variables.orgId) });
      queryClient.invalidateQueries({
        queryKey: organizationQueryKeys.role(variables.orgId, variables.roleName),
      });
    },
  });
}

export function useDeleteRole() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ orgId, roleName }: { orgId: string; roleName: string }) => {
      const { data, error } = await authClient.organization.deleteRole({
        roleName,
        organizationId: orgId,
      } as Parameters<(typeof authClient.organization)["deleteRole"]>[0]);
      if (error) throw new Error(error.message || "Failed to delete role");
      return data;
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: organizationQueryKeys.roles(variables.orgId) });
    },
  });
}

export function useCheckPermissionMutation() {
  return useMutation({
    mutationFn: async ({ orgId, permission }: { orgId: string; permission: string }) => {
      const [resource, action] = permission.split(":");
      const permissionObj = { [resource]: [action] };

      const { data, error } = await authClient.organization.hasPermission({
        organizationId: orgId,
        permission: permissionObj as Record<string, string[]>,
      });
      if (error) throw new Error(error.message || "Failed to check permission");
      return data;
    },
  });
}

export function useFullOrganization(orgId: string) {
  const { data: session } = authClient.useSession();
  const activeOrgId = session?.session?.activeOrganizationId;

  return useQuery({
    queryKey: [...organizationQueryKeys.organization(orgId), "full"] as const,
    queryFn: async () => {
      // Verify the requested org is the active one
      if (orgId !== activeOrgId) {
        throw new Error("Can only get full details for active organization. Set it as active first.");
      }

      const { data, error } = await authClient.organization.getFullOrganization();
      if (error) throw new Error(error.message);
      return data;
    },
    enabled: !!orgId && orgId === activeOrgId,
  });
}

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

export function useActiveOrgMember(orgId: string) {
  return useQuery({
    queryKey: [...organizationQueryKeys.organization(orgId), "active-member"] as const,
    queryFn: async () => {
      const { data, error } = await authClient.organization.getActiveMember({
        query: {
          organizationId: orgId,
        },
      });
      if (error) throw new Error(error.message);
      return data;
    },
    enabled: !!orgId,
  });
}

export function useActiveOrgMemberRole(orgId: string) {
  return useQuery({
    queryKey: [...organizationQueryKeys.organization(orgId), "active-member-role"] as const,
    queryFn: async () => {
      const { data, error } = await authClient.organization.getActiveMemberRole({
        query: {
          organizationId: orgId,
        },
      });
      if (error) throw new Error(error.message);
      return data;
    },
    enabled: !!orgId,
  });
}

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

export function useUserTeams(orgId: string) {
  return useQuery({
    queryKey: ["user", "teams", orgId] as const,
    queryFn: async () => {
      const { data, error } = await authClient.organization.listUserTeams({
        query: {
          organizationId: orgId,
        },
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
        query: {
          id: invitationId,
        },
      });
      if (error) throw new Error(error.message);
      return data;
    },
    enabled: !!invitationId,
  });
}

/**
 * Get single role details
 * Renamed to avoid conflict with useOrganizationRole from permissions.ts
 */
export function useOrganizationRoleDetails(orgId: string, roleId: string) {
  return useQuery({
    queryKey: organizationQueryKeys.role(orgId, roleId),
    queryFn: async () => {
      const { data, error } = await authClient.organization.getRole({
        query: {
          organizationId: orgId,
          roleId,
        },
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
  entityType?: string;
  entityId?: string;
  action?: string;
  userId?: string;
  startDate?: string;
  endDate?: string;
  limit?: number;
  offset?: number;
}

export interface AuditLog {
  id: string;
  entityType: string;
  entityId: string;
  action: string;
  organizationId: string | null;
  userId: string | null;
  metadata: Record<string, unknown> | null;
  ipAddress: string | null;
  userAgent: string | null;
  createdAt: Date;
  user?: {
    id: string;
    name: string | null;
    email: string;
  } | null;
}

/**
 * Get organization audit logs with filtering
 */
export function useOrganizationAuditLogs(orgId: string, filters?: AuditLogFilters) {
  return useQuery({
    queryKey: ["organization", orgId, "audit-logs", filters] as const,
    queryFn: async () => {
      const { data, error } = await apiClient.GET("/organizations/{orgId}/audit-logs", {
        params: { path: { orgId }, query: filters as Record<string, string | number | undefined> },
      });
      if (error) throw new Error(handleApiError(error));
      return (data?.logs ?? []) as unknown as AuditLog[];
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
      const { data, error } = await apiClient.GET("/users/{userId}/activity-logs", {
        params: { path: { userId }, query: filters as Record<string, string | number | undefined> },
      });
      if (error) throw new Error(handleApiError(error));
      return (data?.logs ?? []) as unknown as AuditLog[];
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
      const { data: result, error } = await apiClient.POST("/organizations/{orgId}/audit-logs/export", {
        params: { path: { orgId: data.orgId } },
        body: {
          format: data.format,
          filters: data.filters as Record<string, string | number | undefined> | undefined,
        },
      });
      if (error) throw new Error(handleApiError(error));
      return result;
    },
  });
}
