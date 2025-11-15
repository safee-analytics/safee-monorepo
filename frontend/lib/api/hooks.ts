import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { apiClient, handleApiError } from "./client";
import type { paths } from "./types";
import { z } from "zod";

// Query keys for React Query cache management
export const queryKeys = {
  user: {
    profile: ["user", "profile"] as const,
  },
  storage: {
    files: (folderId?: string) => ["storage", "files", folderId] as const,
    file: (fileId: string) => ["storage", "file", fileId] as const,
    quota: ["storage", "quota"] as const,
  },
  cases: {
    all: ["cases"] as const,
    list: (filters?: { status?: string; priority?: string; assignedTo?: string }) =>
      ["cases", "list", filters] as const,
    detail: (id: string) => ["cases", "detail", id] as const,
    documents: (caseId: string) => ["cases", caseId, "documents"] as const,
    notes: (caseId: string) => ["cases", caseId, "notes"] as const,
    assignments: (caseId: string) => ["cases", caseId, "assignments"] as const,
    history: (caseId: string) => ["cases", caseId, "history"] as const,
  },
  workflows: {
    all: ["workflows"] as const,
    list: (entityType?: string) => ["workflows", "list", entityType] as const,
    detail: (id: string) => ["workflows", "detail", id] as const,
  },
  approvalRules: {
    all: ["approval-rules"] as const,
    list: (entityType?: string) => ["approval-rules", "list", entityType] as const,
    detail: (id: string) => ["approval-rules", "detail", id] as const,
  },
  approvals: {
    all: ["approvals"] as const,
    requests: (status?: string) => ["approvals", "requests", status] as const,
    request: (id: string) => ["approvals", "request", id] as const,
    history: (entityType: string, entityId: string) =>
      ["approvals", "history", entityType, entityId] as const,
  },
} as const;

// User Profile Hooks
export function useUserProfile() {
  return useQuery({
    queryKey: queryKeys.user.profile,
    queryFn: async () => {
      const { data, error } = await apiClient.GET("/users/me");
      if (error) throw new Error(handleApiError(error));
      return data;
    },
  });
}

export function useUpdateUserProfile() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (
      profile: paths["/users/me"]["patch"]["requestBody"]["content"]["application/json"],
    ) => {
      const { data, error } = await apiClient.PATCH("/users/me", {
        body: profile,
      });
      if (error) throw new Error(handleApiError(error));
      return data;
    },
    onSuccess: () => {
      // Invalidate and refetch user profile
      queryClient.invalidateQueries({ queryKey: queryKeys.user.profile });
    },
  });
}

// Storage/File Hooks
export function useStorageFiles(folderId?: string) {
  return useQuery({
    queryKey: queryKeys.storage.files(folderId),
    queryFn: async () => {
      const { data, error } = await apiClient.GET("/api/v1/storage/files/search", {
        params: {
          query: {
            folderId,
          },
        },
      });
      if (error) throw new Error(handleApiError(error));
      return data;
    },
  });
}

export function useStorageFile(fileId: string) {
  return useQuery({
    queryKey: queryKeys.storage.file(fileId),
    queryFn: async () => {
      const { data, error } = await apiClient.GET("/api/v1/storage/files/{fileId}", {
        params: {
          path: { fileId },
        },
      });
      if (error) throw new Error(handleApiError(error));
      return data;
    },
    enabled: !!fileId,
  });
}

const uploadFileSchema = z.object({
  file: z.instanceof(File),
  folderId: z.string().optional(),
  tags: z.array(z.string()).optional(),
  metadata: z.record(z.unknown()).optional(),
});

export function useUploadFile() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (input: z.infer<typeof uploadFileSchema>) => {
      const validated = uploadFileSchema.parse(input);
      const formData = new FormData();
      formData.append("file", validated.file);
      if (validated.folderId) formData.append("folderId", validated.folderId);
      if (validated.tags) formData.append("tags", JSON.stringify(validated.tags));
      if (validated.metadata) formData.append("metadata", JSON.stringify(validated.metadata));

      const { data, error } = await apiClient.POST("/api/v1/storage/upload", {
        // @ts-expect-error FormData is compatible with multipart/form-data
        body: formData,
      });
      if (error) throw new Error(handleApiError(error));
      return data;
    },
    onSuccess: (_, variables) => {
      // Invalidate files list for the folder
      queryClient.invalidateQueries({
        queryKey: queryKeys.storage.files(variables.folderId),
      });
    },
  });
}

export function useDeleteFile() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (fileId: string) => {
      const { data, error } = await apiClient.DELETE("/api/v1/storage/files/{fileId}", {
        params: {
          path: { fileId },
        },
      });
      if (error) throw new Error(handleApiError(error));
      return data;
    },
    onSuccess: () => {
      // Invalidate all file queries
      queryClient.invalidateQueries({ queryKey: ["storage", "files"] });
    },
  });
}

export function useStorageQuota() {
  return useQuery({
    queryKey: queryKeys.storage.quota,
    queryFn: async () => {
      const { data, error } = await apiClient.GET("/api/v1/storage/quota");
      if (error) throw new Error(handleApiError(error));
      return data;
    },
  });
}

// Generic hook factory for creating custom API hooks with schema validation
export function createApiHook<
  TPath extends keyof paths,
  TMethod extends keyof paths[TPath],
  TParams extends z.ZodType = z.ZodType<Record<string, unknown>>,
>(path: TPath, method: TMethod, paramsSchema?: TParams) {
  return (params?: z.infer<TParams>) => {
    return useQuery({
      queryKey: [path, method, params],
      queryFn: async () => {
        const validatedParams = paramsSchema ? paramsSchema.parse(params) : params;
        const clientMethod = apiClient[method as "GET" | "POST" | "PUT" | "DELETE" | "PATCH"];
        if (!clientMethod) {
          throw new Error(`Method ${String(method)} not found on apiClient`);
        }
        const { data, error } = await clientMethod(path, validatedParams);
        if (error) throw new Error(handleApiError(error));
        return data;
      },
    });
  };
}

// ============================================================================
// Case Management Hooks
// ============================================================================

export function useCases(filters?: { status?: string; priority?: string; assignedTo?: string }) {
  return useQuery({
    queryKey: queryKeys.cases.list(filters),
    queryFn: async () => {
      const { data, error } = await apiClient.GET("/cases", {
        params: {
          query: filters,
        },
      });
      if (error) throw new Error(handleApiError(error));
      return data;
    },
  });
}

export function useCase(id: string) {
  return useQuery({
    queryKey: queryKeys.cases.detail(id),
    queryFn: async () => {
      const { data, error } = await apiClient.GET("/cases/{id}", {
        params: {
          path: { id },
        },
      });
      if (error) throw new Error(handleApiError(error));
      return data;
    },
    enabled: !!id,
  });
}

export function useCreateCase() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (caseData: paths["/cases"]["post"]["requestBody"]["content"]["application/json"]) => {
      const { data, error } = await apiClient.POST("/cases", {
        body: caseData,
      });
      if (error) throw new Error(handleApiError(error));
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.cases.all });
    },
  });
}

export function useUpdateCase() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      id,
      updates,
    }: {
      id: string;
      updates: paths["/cases/{id}"]["patch"]["requestBody"]["content"]["application/json"];
    }) => {
      const { data, error } = await apiClient.PATCH("/cases/{id}", {
        params: {
          path: { id },
        },
        body: updates,
      });
      if (error) throw new Error(handleApiError(error));
      return data;
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: queryKeys.cases.detail(variables.id) });
      queryClient.invalidateQueries({ queryKey: queryKeys.cases.all });
    },
  });
}

export function useDeleteCase() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (id: string) => {
      const { data, error } = await apiClient.DELETE("/cases/{id}", {
        params: {
          path: { id },
        },
      });
      if (error) throw new Error(handleApiError(error));
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.cases.all });
    },
  });
}

// Case Documents
export function useCaseDocuments(caseId: string) {
  return useQuery({
    queryKey: queryKeys.cases.documents(caseId),
    queryFn: async () => {
      const { data, error } = await apiClient.GET("/cases/{caseId}/documents", {
        params: {
          path: { caseId },
        },
      });
      if (error) throw new Error(handleApiError(error));
      return data;
    },
    enabled: !!caseId,
  });
}

export function useUploadCaseDocument() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      caseId,
      document,
    }: {
      caseId: string;
      document: paths["/cases/{caseId}/documents"]["post"]["requestBody"]["content"]["application/json"];
    }) => {
      const { data, error } = await apiClient.POST("/cases/{caseId}/documents", {
        params: {
          path: { caseId },
        },
        body: document,
      });
      if (error) throw new Error(handleApiError(error));
      return data;
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: queryKeys.cases.documents(variables.caseId) });
    },
  });
}

// Case Notes
export function useCaseNotes(caseId: string) {
  return useQuery({
    queryKey: queryKeys.cases.notes(caseId),
    queryFn: async () => {
      const { data, error } = await apiClient.GET("/cases/{caseId}/notes", {
        params: {
          path: { caseId },
        },
      });
      if (error) throw new Error(handleApiError(error));
      return data;
    },
    enabled: !!caseId,
  });
}

export function useAddCaseNote() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      caseId,
      note,
    }: {
      caseId: string;
      note: paths["/cases/{caseId}/notes"]["post"]["requestBody"]["content"]["application/json"];
    }) => {
      const { data, error } = await apiClient.POST("/cases/{caseId}/notes", {
        params: {
          path: { caseId },
        },
        body: note,
      });
      if (error) throw new Error(handleApiError(error));
      return data;
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: queryKeys.cases.notes(variables.caseId) });
    },
  });
}

// Case Assignments
export function useCaseAssignments(caseId: string) {
  return useQuery({
    queryKey: queryKeys.cases.assignments(caseId),
    queryFn: async () => {
      const { data, error } = await apiClient.GET("/cases/{caseId}/assignments", {
        params: {
          path: { caseId },
        },
      });
      if (error) throw new Error(handleApiError(error));
      return data;
    },
    enabled: !!caseId,
  });
}

export function useAssignCase() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      caseId,
      assignment,
    }: {
      caseId: string;
      assignment: paths["/cases/{caseId}/assignments"]["post"]["requestBody"]["content"]["application/json"];
    }) => {
      const { data, error } = await apiClient.POST("/cases/{caseId}/assignments", {
        params: {
          path: { caseId },
        },
        body: assignment,
      });
      if (error) throw new Error(handleApiError(error));
      return data;
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: queryKeys.cases.assignments(variables.caseId) });
      queryClient.invalidateQueries({ queryKey: queryKeys.cases.detail(variables.caseId) });
    },
  });
}

// Case History
export function useCaseHistory(caseId: string) {
  return useQuery({
    queryKey: queryKeys.cases.history(caseId),
    queryFn: async () => {
      const { data, error } = await apiClient.GET("/cases/{caseId}/history", {
        params: {
          path: { caseId },
        },
      });
      if (error) throw new Error(handleApiError(error));
      return data;
    },
    enabled: !!caseId,
  });
}

// ============================================================================
// Approval Workflow Hooks
// ============================================================================

export function useWorkflows(entityType?: string) {
  return useQuery({
    queryKey: queryKeys.workflows.list(entityType),
    queryFn: async () => {
      const { data, error } = await apiClient.GET("/workflows", {
        params: {
          query: entityType ? { entityType } : undefined,
        },
      });
      if (error) throw new Error(handleApiError(error));
      return data;
    },
  });
}

export function useWorkflow(id: string) {
  return useQuery({
    queryKey: queryKeys.workflows.detail(id),
    queryFn: async () => {
      const { data, error } = await apiClient.GET("/workflows/{id}", {
        params: {
          path: { id },
        },
      });
      if (error) throw new Error(handleApiError(error));
      return data;
    },
    enabled: !!id,
  });
}

export function useCreateWorkflow() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (
      workflow: paths["/workflows"]["post"]["requestBody"]["content"]["application/json"],
    ) => {
      const { data, error } = await apiClient.POST("/workflows", {
        body: workflow,
      });
      if (error) throw new Error(handleApiError(error));
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.workflows.all });
    },
  });
}

export function useUpdateWorkflow() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      id,
      updates,
    }: {
      id: string;
      updates: paths["/workflows/{id}"]["patch"]["requestBody"]["content"]["application/json"];
    }) => {
      const { data, error } = await apiClient.PATCH("/workflows/{id}", {
        params: {
          path: { id },
        },
        body: updates,
      });
      if (error) throw new Error(handleApiError(error));
      return data;
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: queryKeys.workflows.detail(variables.id) });
      queryClient.invalidateQueries({ queryKey: queryKeys.workflows.all });
    },
  });
}

export function useDeleteWorkflow() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (id: string) => {
      const { data, error } = await apiClient.DELETE("/workflows/{id}", {
        params: {
          path: { id },
        },
      });
      if (error) throw new Error(handleApiError(error));
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.workflows.all });
    },
  });
}

// Approval Rules
export function useApprovalRules(entityType?: string) {
  return useQuery({
    queryKey: queryKeys.approvalRules.list(entityType),
    queryFn: async () => {
      const { data, error } = await apiClient.GET("/workflows/rules", {
        params: {
          query: entityType ? { entityType } : undefined,
        },
      });
      if (error) throw new Error(handleApiError(error));
      return data;
    },
  });
}

export function useCreateApprovalRule() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (
      rule: paths["/workflows/rules"]["post"]["requestBody"]["content"]["application/json"],
    ) => {
      const { data, error } = await apiClient.POST("/workflows/rules", {
        body: rule,
      });
      if (error) throw new Error(handleApiError(error));
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.approvalRules.all });
    },
  });
}

export function useDeleteApprovalRule() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (id: string) => {
      const { data, error } = await apiClient.DELETE("/workflows/rules/{id}", {
        params: {
          path: { id },
        },
      });
      if (error) throw new Error(handleApiError(error));
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.approvalRules.all });
    },
  });
}

// Approval Requests
export function useApprovalRequests(status?: string) {
  return useQuery({
    queryKey: queryKeys.approvals.requests(status),
    queryFn: async () => {
      const { data, error } = await apiClient.GET("/approvals/requests", {
        params: {
          query: status ? { status } : undefined,
        },
      });
      if (error) throw new Error(handleApiError(error));
      return data;
    },
  });
}

export function useApprovalRequest(id: string) {
  return useQuery({
    queryKey: queryKeys.approvals.request(id),
    queryFn: async () => {
      const { data, error } = await apiClient.GET("/approvals/requests/{id}", {
        params: {
          path: { id },
        },
      });
      if (error) throw new Error(handleApiError(error));
      return data;
    },
    enabled: !!id,
  });
}

export function useSubmitForApproval() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (
      request: paths["/approvals/submit"]["post"]["requestBody"]["content"]["application/json"],
    ) => {
      const { data, error } = await apiClient.POST("/approvals/submit", {
        body: request,
      });
      if (error) throw new Error(handleApiError(error));
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.approvals.all });
    },
  });
}

export function useApproveRequest() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ requestId, comments }: { requestId: string; comments?: string }) => {
      const { data, error } = await apiClient.POST("/approvals/requests/{requestId}/approve", {
        params: {
          path: { requestId },
        },
        body: { comments },
      });
      if (error) throw new Error(handleApiError(error));
      return data;
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: queryKeys.approvals.request(variables.requestId) });
      queryClient.invalidateQueries({ queryKey: queryKeys.approvals.all });
    },
  });
}

export function useRejectRequest() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ requestId, comments }: { requestId: string; comments?: string }) => {
      const { data, error } = await apiClient.POST("/approvals/requests/{requestId}/reject", {
        params: {
          path: { requestId },
        },
        body: { comments },
      });
      if (error) throw new Error(handleApiError(error));
      return data;
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: queryKeys.approvals.request(variables.requestId) });
      queryClient.invalidateQueries({ queryKey: queryKeys.approvals.all });
    },
  });
}

export function useDelegateApproval() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      requestId,
      delegateToUserId,
      comments,
    }: {
      requestId: string;
      delegateToUserId: string;
      comments?: string;
    }) => {
      const { data, error } = await apiClient.POST("/approvals/requests/{requestId}/delegate", {
        params: {
          path: { requestId },
        },
        body: { delegateToUserId, comments },
      });
      if (error) throw new Error(handleApiError(error));
      return data;
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: queryKeys.approvals.request(variables.requestId) });
    },
  });
}

export function useApprovalHistory(entityType: string, entityId: string) {
  return useQuery({
    queryKey: queryKeys.approvals.history(entityType, entityId),
    queryFn: async () => {
      const { data, error } = await apiClient.GET("/approvals/history/{entityType}/{entityId}", {
        params: {
          path: { entityType, entityId },
        },
      });
      if (error) throw new Error(handleApiError(error));
      return data;
    },
    enabled: !!entityType && !!entityId,
  });
}
