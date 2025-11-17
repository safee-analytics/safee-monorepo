/**
 * Team Management Hooks for Better Auth
 *
 * Teams are sub-groups within organizations.
 * Better Auth's organization plugin with teams enabled provides:
 * - Create/manage teams within organizations
 * - Add/remove members from teams
 * - Set active team
 * - Team-level permissions
 */

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { authClient } from "@/lib/auth/client";

// ============================================================================
// Query Keys
// ============================================================================

export const teamQueryKeys = {
  all: (orgId: string) => ["teams", orgId] as const,
  team: (orgId: string, teamId: string) => ["teams", orgId, teamId] as const,
  members: (orgId: string, teamId: string) => ["teams", orgId, teamId, "members"] as const,
  activeTeam: (orgId: string) => ["teams", orgId, "active"] as const,
} as const;

// ============================================================================
// Team Management
// ============================================================================

/**
 * List all teams in an organization
 */
export function useTeams(orgId: string) {
  return useQuery({
    queryKey: teamQueryKeys.all(orgId),
    queryFn: async () => {
      const { data, error } = await authClient.organization.listTeams({
        organizationId: orgId,
      });
      if (error) throw new Error(error.message);
      return data;
    },
    enabled: !!orgId,
  });
}

/**
 * Get single team details
 */
export function useTeam(orgId: string, teamId: string) {
  return useQuery({
    queryKey: teamQueryKeys.team(orgId, teamId),
    queryFn: async () => {
      const { data, error } = await authClient.organization.getTeam({
        organizationId: orgId,
        teamId,
      });
      if (error) throw new Error(error.message);
      return data;
    },
    enabled: !!orgId && !!teamId,
  });
}

/**
 * Create new team
 */
export function useCreateTeam() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (data: { organizationId: string; name: string; slug?: string }) => {
      const { data: result, error } = await authClient.organization.createTeam({
        organizationId: data.organizationId,
        name: data.name,
        slug: data.slug,
      });
      if (error) throw new Error(error.message);
      return result;
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: teamQueryKeys.all(variables.organizationId) });
    },
  });
}

/**
 * Update team details
 */
export function useUpdateTeam() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (data: { organizationId: string; teamId: string; name?: string; slug?: string }) => {
      const { data: result, error } = await authClient.organization.updateTeam({
        organizationId: data.organizationId,
        teamId: data.teamId,
        name: data.name,
        slug: data.slug,
      });
      if (error) throw new Error(error.message);
      return result;
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({
        queryKey: teamQueryKeys.team(variables.organizationId, variables.teamId),
      });
      queryClient.invalidateQueries({ queryKey: teamQueryKeys.all(variables.organizationId) });
    },
  });
}

/**
 * Delete team
 */
export function useDeleteTeam() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (data: { organizationId: string; teamId: string }) => {
      const { data: result, error } = await authClient.organization.deleteTeam({
        organizationId: data.organizationId,
        teamId: data.teamId,
      });
      if (error) throw new Error(error.message);
      return result;
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: teamQueryKeys.all(variables.organizationId) });
    },
  });
}

// ============================================================================
// Team Member Management
// ============================================================================

/**
 * List team members
 */
export function useTeamMembers(orgId: string, teamId: string) {
  return useQuery({
    queryKey: teamQueryKeys.members(orgId, teamId),
    queryFn: async () => {
      const { data, error } = await authClient.organization.listTeamMembers({
        organizationId: orgId,
        teamId,
      });
      if (error) throw new Error(error.message);
      return data;
    },
    enabled: !!orgId && !!teamId,
  });
}

/**
 * Add member to team
 */
export function useAddMemberToTeam() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (data: { organizationId: string; teamId: string; userId: string; role?: string }) => {
      const { data: result, error } = await authClient.organization.addTeamMember({
        organizationId: data.organizationId,
        teamId: data.teamId,
        userId: data.userId,
        role: data.role,
      });
      if (error) throw new Error(error.message);
      return result;
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({
        queryKey: teamQueryKeys.members(variables.organizationId, variables.teamId),
      });
    },
  });
}

/**
 * Remove member from team
 */
export function useRemoveMemberFromTeam() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (data: { organizationId: string; teamId: string; userId: string }) => {
      const { data: result, error } = await authClient.organization.removeTeamMember({
        organizationId: data.organizationId,
        teamId: data.teamId,
        userId: data.userId,
      });
      if (error) throw new Error(error.message);
      return result;
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({
        queryKey: teamQueryKeys.members(variables.organizationId, variables.teamId),
      });
    },
  });
}

/**
 * Update team member role
 */
export function useUpdateTeamMemberRole() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (data: { organizationId: string; teamId: string; userId: string; role: string }) => {
      const { data: result, error } = await authClient.organization.updateTeamMemberRole({
        organizationId: data.organizationId,
        teamId: data.teamId,
        userId: data.userId,
        role: data.role,
      });
      if (error) throw new Error(error.message);
      return result;
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({
        queryKey: teamQueryKeys.members(variables.organizationId, variables.teamId),
      });
    },
  });
}

// ============================================================================
// Active Team Management
// ============================================================================

/**
 * Get active team for current user in organization
 */
export function useActiveTeam(orgId: string) {
  return useQuery({
    queryKey: teamQueryKeys.activeTeam(orgId),
    queryFn: async () => {
      const { data, error } = await authClient.organization.getActiveTeam({
        organizationId: orgId,
      });
      if (error) throw new Error(error.message);
      return data;
    },
    enabled: !!orgId,
  });
}

/**
 * Set active team
 */
export function useSetActiveTeam() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (data: { organizationId: string; teamId: string }) => {
      const { data: result, error } = await authClient.organization.setActiveTeam({
        organizationId: data.organizationId,
        teamId: data.teamId,
      });
      if (error) throw new Error(error.message);
      return result;
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: teamQueryKeys.activeTeam(variables.organizationId) });
      // Invalidate session since activeTeamId is stored there
      queryClient.invalidateQueries({ queryKey: ["auth", "session"] });
    },
  });
}
