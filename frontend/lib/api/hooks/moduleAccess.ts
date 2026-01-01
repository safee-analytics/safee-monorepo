import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { authClient } from "@/lib/auth/client";
import { apiClient, handleApiError } from "../client";
import { z } from "zod";

// Zod schemas
export const resourceTypeSchema = z.enum([
  "audit_case",
  "accounting_client",
  "crm_lead",
  "crm_deal",
  "hr_department",
]);

export const hrSectionTypeSchema = z.enum(["self_service", "management"]);

export const hrSectionSchema = z.object({
  id: z.string(),
  sectionKey: z.string(),
  sectionType: hrSectionTypeSchema,
  displayName: z.string(),
  description: z.string().nullable(),
  path: z.string(),
  requiredPermissions: z.string().nullable(),
  minimumRole: z.string().nullable(),
  sortOrder: z.number(),
  isActive: z.boolean(),
});

export const resourceAssignmentSchema = z.object({
  id: z.string(),
  userId: z.string(),
  resourceType: resourceTypeSchema,
  resourceId: z.string(),
  role: z.string().nullable(),
  assignedBy: z.string().nullable(),
  assignedAt: z.string(),
  expiresAt: z.string().nullable(),
});

export const assignResourceRequestSchema = z.object({
  userId: z.string(),
  resourceType: resourceTypeSchema,
  resourceId: z.string(),
  role: z.string().optional(),
});

// TypeScript types inferred from Zod schemas
export type ResourceType = z.infer<typeof resourceTypeSchema>;
export type HRSectionType = z.infer<typeof hrSectionTypeSchema>;
export type HRSection = z.infer<typeof hrSectionSchema>;
export type ResourceAssignment = z.infer<typeof resourceAssignmentSchema>;
export type AssignResourceRequest = z.infer<typeof assignResourceRequestSchema>;

export const moduleAccessQueryKeys = {
  all: ["module-access"] as const,
  modules: (orgId: string) => ["module-access", orgId, "modules"] as const,
  hrSections: (orgId: string) => ["module-access", orgId, "hr-sections"] as const,
  assignedResources: (orgId: string, resourceType: string) =>
    ["module-access", orgId, "assigned-resources", resourceType] as const,
  resourceAssignments: (orgId: string, resourceType: string, resourceId: string) =>
    ["module-access", orgId, "resource-assignments", resourceType, resourceId] as const,
} as const;

export function useAccessibleModules() {
  const { data: session } = authClient.useSession();
  const activeOrgId = session?.session?.activeOrganizationId;

  return useQuery({
    queryKey: moduleAccessQueryKeys.modules(activeOrgId || ""),
    queryFn: async () => {
      if (!activeOrgId) return [];

      const { data, error } = await apiClient.GET("/module-access/modules");
      if (error) throw new Error(handleApiError(error));

      return (data?.modules ?? []) as string[];
    },
    enabled: !!activeOrgId,
    staleTime: 60000, // 1 minute cache
  });
}

export function useHasModuleAccess(moduleKey: string): boolean {
  const { data: accessibleModules } = useAccessibleModules();
  return accessibleModules?.includes(moduleKey) ?? false;
}

export function useAccessibleHRSections() {
  const { data: session } = authClient.useSession();
  const activeOrgId = session?.session?.activeOrganizationId;

  return useQuery({
    queryKey: moduleAccessQueryKeys.hrSections(activeOrgId || ""),
    queryFn: async () => {
      if (!activeOrgId) return [];

      const { data, error } = await apiClient.GET("/module-access/hr-sections");
      if (error) throw new Error(handleApiError(error));

      return (data?.sections ?? []) as HRSection[];
    },
    enabled: !!activeOrgId,
    staleTime: 60000, // 1 minute cache
  });
}

export function useHasHRSectionAccess(sectionKey: string): boolean {
  const { data: sections } = useAccessibleHRSections();
  return sections?.some((section) => section.sectionKey === sectionKey) ?? false;
}

export function useAssignedResources(resourceType: ResourceType) {
  const { data: session } = authClient.useSession();
  const activeOrgId = session?.session?.activeOrganizationId;

  return useQuery({
    queryKey: moduleAccessQueryKeys.assignedResources(activeOrgId || "", resourceType),
    queryFn: async () => {
      if (!activeOrgId) return [];

      const { data, error } = await apiClient.GET("/module-access/assigned-resources", {
        params: { query: { resourceType } },
      });
      if (error) throw new Error(handleApiError(error));

      return (data?.resourceIds ?? []) as string[];
    },
    enabled: !!activeOrgId && !!resourceType,
    staleTime: 30000, // 30 second cache
  });
}

export function useHasResourceAccess(resourceType: ResourceType, resourceId: string): boolean {
  const { data: assignedResources } = useAssignedResources(resourceType);

  // If assignedResources is empty array, it means user is owner/admin and has access to all
  if (assignedResources && assignedResources.length === 0) return true;

  return assignedResources?.includes(resourceId) ?? false;
}

export function useAssignResource() {
  const queryClient = useQueryClient();
  const { data: session } = authClient.useSession();
  const activeOrgId = session?.session?.activeOrganizationId;

  return useMutation({
    mutationFn: async (params: AssignResourceRequest) => {
      // Validate input with Zod
      const validatedParams = assignResourceRequestSchema.parse(params);

      const { data, error } = await apiClient.POST("/module-access/assignments", {
        body: validatedParams,
      });
      if (error) throw new Error(handleApiError(error));
      return data;
    },
    onSuccess: (_, variables) => {
      if (!activeOrgId) return;

      // Invalidate assigned resources for this resource type
      void queryClient.invalidateQueries({
        queryKey: moduleAccessQueryKeys.assignedResources(activeOrgId, variables.resourceType),
      });

      // Invalidate resource assignments for this specific resource
      void queryClient.invalidateQueries({
        queryKey: moduleAccessQueryKeys.resourceAssignments(
          activeOrgId,
          variables.resourceType,
          variables.resourceId,
        ),
      });
    },
  });
}

export function useUnassignResource() {
  const queryClient = useQueryClient();
  const { data: session } = authClient.useSession();
  const activeOrgId = session?.session?.activeOrganizationId;

  return useMutation({
    mutationFn: async (params: { userId: string; resourceType: ResourceType; resourceId: string }) => {
      // Validate input with Zod
      const validatedResourceType = resourceTypeSchema.parse(params.resourceType);

      const { data, error } = await apiClient.DELETE(
        "/module-access/assignments/{userId}/{resourceType}/{resourceId}",
        {
          params: {
            path: {
              userId: params.userId,
              resourceType: validatedResourceType,
              resourceId: params.resourceId,
            },
          },
        },
      );
      if (error) throw new Error(handleApiError(error));
      return data;
    },
    onSuccess: (_, variables) => {
      if (!activeOrgId) return;

      // Invalidate assigned resources for this resource type
      void queryClient.invalidateQueries({
        queryKey: moduleAccessQueryKeys.assignedResources(activeOrgId, variables.resourceType),
      });

      // Invalidate resource assignments for this specific resource
      void queryClient.invalidateQueries({
        queryKey: moduleAccessQueryKeys.resourceAssignments(
          activeOrgId,
          variables.resourceType,
          variables.resourceId,
        ),
      });
    },
  });
}

export function useResourceAssignments(resourceType: ResourceType, resourceId: string) {
  const { data: session } = authClient.useSession();
  const activeOrgId = session?.session?.activeOrganizationId;

  return useQuery({
    queryKey: moduleAccessQueryKeys.resourceAssignments(activeOrgId || "", resourceType, resourceId),
    queryFn: async () => {
      if (!activeOrgId) return [];

      const { data, error } = await apiClient.GET("/module-access/assignments/{resourceType}/{resourceId}", {
        params: { path: { resourceType, resourceId } },
      });
      if (error) throw new Error(handleApiError(error));

      return (data?.assignments ?? []) as ResourceAssignment[];
    },
    enabled: !!activeOrgId && !!resourceType && !!resourceId,
    staleTime: 30000, // 30 second cache
  });
}

export function useUpdateModuleAccessRules() {
  const queryClient = useQueryClient();
  const { data: session } = authClient.useSession();
  const activeOrgId = session?.session?.activeOrganizationId;

  return useMutation({
    mutationFn: async (params: {
      organizationId: string | null;
      rules: Array<{ moduleKey: string; role: string; hasAccess: boolean }>;
    }) => {
      const { data, error } = await apiClient.PUT("/module-access/rules", {
        body: {
          organizationId: params.organizationId ?? undefined,
          rules: params.rules,
        },
      });
      if (error) throw new Error(handleApiError(error));
      return data;
    },
    onSuccess: () => {
      if (!activeOrgId) return;

      // Invalidate all module access queries to refetch with new rules
      void queryClient.invalidateQueries({
        queryKey: moduleAccessQueryKeys.modules(activeOrgId),
      });
      void queryClient.invalidateQueries({
        queryKey: moduleAccessQueryKeys.hrSections(activeOrgId),
      });
    },
  });
}
