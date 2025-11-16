import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { authClient } from "@/lib/auth/client";

// Query keys for organization-related data
export const organizationQueryKeys = {
  organization: (orgId: string) => ["organization", orgId] as const,
  members: (orgId: string) => ["organization", orgId, "members"] as const,
  member: (orgId: string, userId: string) => ["organization", orgId, "members", userId] as const,
  invitations: (orgId: string) => ["organization", orgId, "invitations"] as const,
  roles: (orgId: string) => ["organization", orgId, "roles"] as const,
  role: (orgId: string, roleId: string) => ["organization", orgId, "roles", roleId] as const,
} as const;

// All hooks use Better Auth's organizationClient plugin
// No custom backend needed - Better Auth provides everything!

// Organization Members
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
      queryClient.invalidateQueries({ queryKey: organizationQueryKeys.member(variables.orgId, variables.userId) });
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

export function useResendInvitation() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ invitationId }: { invitationId: string }) => {
      // Better Auth might have this - check docs
      // For now, just cancel and re-invite
      throw new Error("Resend invitation not yet implemented - cancel and reinvite instead");
    },
  });
}

// Organization Management
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
      // Invalidate user profile to reflect new organization
      queryClient.invalidateQueries({ queryKey: ["user", "profile"] });
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
      queryClient.invalidateQueries({ queryKey: ["user", "profile"] });
    },
  });
}

export function useSetActiveOrganization() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ orgId }: { orgId: string }) => {
      const { data, error } = await authClient.organization.setActive({
        organizationId: orgId,
      });
      if (error) throw new Error(error.message);
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["user", "profile"] });
      // Invalidate everything since we switched orgs
      queryClient.invalidateQueries();
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
    mutationFn: async ({ orgId, roleId, permissions }: { orgId: string; roleId: string; permissions: string[] }) => {
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
      queryClient.invalidateQueries({ queryKey: organizationQueryKeys.role(variables.orgId, variables.roleId) });
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
