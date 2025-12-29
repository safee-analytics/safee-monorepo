import { useQuery, type UseQueryOptions } from "@tanstack/react-query";
import { useActiveOrgMemberRole } from "./organization";
import { useAssignedResources, type ResourceType } from "./moduleAccess";
import { authClient } from "@/lib/auth/client";

export function useFilteredData<T>(
  queryKey: unknown[],
  fetchFn: (assignedIds?: string[]) => Promise<T[]>,
  resourceType: ResourceType,
  options?: Omit<UseQueryOptions<T[], Error>, "queryKey" | "queryFn">
) {
  const { data: session } = authClient.useSession();
  const activeOrgId = session?.session?.activeOrganizationId;
  const { data: memberRole } = useActiveOrgMemberRole(activeOrgId || "");
  const { data: assignedIds, isLoading: assignedIdsLoading } = useAssignedResources(resourceType);

  const role = memberRole?.role;

  return useQuery<T[], Error>({
    queryKey: [...queryKey, assignedIds],
    queryFn: async () => {
      // Owners/admins get all data (empty array means no filtering)
      if (role === "owner" || role === "admin") {
        return fetchFn();
      }

      // Others get filtered data
      // If assignedIds is empty array, it means the backend returned [] which means "all access"
      // If assignedIds is undefined or null, we shouldn't fetch yet
      if (!assignedIds) {
        return [];
      }

      return fetchFn(assignedIds.length > 0 ? assignedIds : undefined);
    },
    enabled: !!activeOrgId && !!role && !assignedIdsLoading && (options?.enabled ?? true),
    ...options,
  });
}

/**
 * Helper hook to check if the current user has filtering restrictions
 * Returns true if user is owner/admin (no filtering needed)
 * Returns false if user has assignment-based filtering
 */
export function useHasUnrestrictedAccess(): boolean {
  const { data: session } = authClient.useSession();
  const activeOrgId = session?.session?.activeOrganizationId;
  const { data: memberRole } = useActiveOrgMemberRole(activeOrgId || "");

  const role = memberRole?.role;
  return role === "owner" || role === "admin";
}

/**
 * Helper hook to get the resource IDs a user can access for a given resource type
 * Returns undefined if owner/admin (meaning: all resources)
 * Returns array of IDs if regular user (meaning: only these resources)
 */
export function useAccessibleResourceIds(resourceType: ResourceType): string[] | undefined {
  const hasUnrestrictedAccess = useHasUnrestrictedAccess();
  const { data: assignedIds } = useAssignedResources(resourceType);

  if (hasUnrestrictedAccess) {
    return undefined; // undefined means "all resources"
  }

  return assignedIds;
}
