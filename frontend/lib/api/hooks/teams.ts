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





export const teamQueryKeys = {
  all: (orgId: string) => ["teams", orgId] as const,
  team: (orgId: string, teamId: string) => ["teams", orgId, teamId] as const,
  members: (orgId: string, teamId: string) => ["teams", orgId, teamId, "members"] as const,
  activeTeam: (orgId: string) => ["teams", orgId, "active"] as const,
} as const;





/**
 * List all teams in an organization
 */
export function useTeams(orgId: string) {
  return useQuery({
    queryKey: teamQueryKeys.all(orgId),
    queryFn: async () => {
      const { data, error } = await authClient.organization.listTeams({
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
 * Get single team details
 */
export function useTeam(orgId: string, teamId: string) {
  return useQuery({
    queryKey: teamQueryKeys.team(orgId, teamId),
    queryFn: async () => {
      // better-auth doesn't have getTeam, use listTeams and filter
      const { data, error } = await authClient.organization.listTeams({
        query: {
          organizationId: orgId,
        },
      });
      if (error) throw new Error(error.message);
      // data is array of teams, not object with teams property
      return Array.isArray(data) ? (data.find((t: { id: string }) => t.id === teamId) ?? null) : null;
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
        name: data.name,
        organizationId: data.organizationId,
      });
      if (error) throw new Error(error.message);
      return result;
    },
    onSuccess: (_, variables) => {
      void queryClient.invalidateQueries({ queryKey: teamQueryKeys.all(variables.organizationId) });
    },
  });
}

export function useUpdateTeam() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (data: { organizationId: string; teamId: string; name?: string; slug?: string }) => {
      const { data: result, error } = await authClient.organization.updateTeam({
        teamId: data.teamId,
        data: {
          name: data.name,
          organizationId: data.organizationId,
        },
      });
      if (error) throw new Error(error.message);
      return result;
    },
    onSuccess: (_, variables) => {
      void queryClient.invalidateQueries({
        queryKey: teamQueryKeys.team(variables.organizationId, variables.teamId),
      });
      void queryClient.invalidateQueries({ queryKey: teamQueryKeys.all(variables.organizationId) });
    },
  });
}

export function useDeleteTeam() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (data: { organizationId: string; teamId: string }) => {
      const { data: result, error } = await authClient.organization.removeTeam({
        organizationId: data.organizationId,
        teamId: data.teamId,
      });
      if (error) throw new Error(error.message);
      return result;
    },
    onSuccess: (_, variables) => {
      void queryClient.invalidateQueries({ queryKey: teamQueryKeys.all(variables.organizationId) });
    },
  });
}

export function useTeamMembers(orgId: string, teamId: string) {
  return useQuery({
    queryKey: teamQueryKeys.members(orgId, teamId),
    queryFn: async () => {
      const { data, error } = await authClient.organization.listTeamMembers({
        query: {
          teamId,
        },
      });
      if (error) throw new Error(error.message);
      return data;
    },
    enabled: !!orgId && !!teamId,
  });
}

export function useAddMemberToTeam() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (data: { organizationId: string; teamId: string; userId: string; role?: string }) => {
      const { data: result, error } = await authClient.organization.addTeamMember({
        teamId: data.teamId,
        userId: data.userId,
      });
      if (error) throw new Error(error.message);
      return result;
    },
    onSuccess: (_, variables) => {
      void queryClient.invalidateQueries({
        queryKey: teamQueryKeys.members(variables.organizationId, variables.teamId),
      });
    },
  });
}

export function useRemoveMemberFromTeam() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (data: { organizationId: string; teamId: string; userId: string }) => {
      const { data: result, error } = await authClient.organization.removeTeamMember({
        teamId: data.teamId,
        userId: data.userId,
      });
      if (error) throw new Error(error.message);
      return result;
    },
    onSuccess: (_, variables) => {
      void queryClient.invalidateQueries({
        queryKey: teamQueryKeys.members(variables.organizationId, variables.teamId),
      });
    },
  });
}

export function useUpdateTeamMemberRole() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (data: { organizationId: string; teamId: string; userId: string; role: string }) => {
      const { data: result, error } = await authClient.organization.updateMemberRole({
        memberId: data.userId,
        role: data.role as "member" | "admin" | "owner",
        organizationId: data.organizationId,
      });
      if (error) throw new Error(error.message);
      return result;
    },
    onSuccess: (_, variables) => {
      void queryClient.invalidateQueries({
        queryKey: teamQueryKeys.members(variables.organizationId, variables.teamId),
      });
    },
  });
}


export function useSetActiveTeam() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (data: { organizationId: string; teamId: string }) => {
      const { data: result, error } = await authClient.organization.setActiveTeam({
        teamId: data.teamId,
      });
      if (error) throw new Error(error.message);
      return result;
    },
    onSuccess: (_, variables) => {
      void queryClient.invalidateQueries({ queryKey: teamQueryKeys.activeTeam(variables.organizationId) });
      void queryClient.invalidateQueries({ queryKey: ["auth", "session"] });
    },
  });
}
