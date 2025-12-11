import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { apiClient, handleApiError } from "../client";
import type { paths } from "../types";
import { queryKeys } from "./queryKeys";

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
      const { data, error } = await apiClient.GET("/workflows/{workflowId}", {
        params: {
          path: { workflowId: id },
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
      void queryClient.invalidateQueries({ queryKey: queryKeys.workflows.all });
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
      updates: paths["/workflows/{workflowId}"]["put"]["requestBody"]["content"]["application/json"];
    }) => {
      const { data, error } = await apiClient.PUT("/workflows/{workflowId}", {
        params: {
          path: { workflowId: id },
        },
        body: updates,
      });
      if (error) throw new Error(handleApiError(error));
      return data;
    },
    onSuccess: (_, variables) => {
      void queryClient.invalidateQueries({ queryKey: queryKeys.workflows.detail(variables.id) });
      void queryClient.invalidateQueries({ queryKey: queryKeys.workflows.all });
    },
  });
}

export function useDeleteWorkflow() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (id: string) => {
      const { data, error } = await apiClient.DELETE("/workflows/{workflowId}", {
        params: {
          path: { workflowId: id },
        },
      });
      if (error) throw new Error(handleApiError(error));
      return data;
    },
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: queryKeys.workflows.all });
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
      void queryClient.invalidateQueries({ queryKey: queryKeys.approvalRules.all });
    },
  });
}

export function useDeleteApprovalRule() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (id: string) => {
      const { data, error } = await apiClient.DELETE("/workflows/rules/{ruleId}", {
        params: {
          path: { ruleId: id },
        },
      });
      if (error) throw new Error(handleApiError(error));
      return data;
    },
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: queryKeys.approvalRules.all });
    },
  });
}

// Approval Requests
export function useApprovalRequests(status?: "pending" | "approved" | "rejected" | "cancelled") {
  return useQuery({
    queryKey: queryKeys.approvals.requests(status),
    queryFn: async () => {
      const { data, error } = await apiClient.GET("/approvals", {
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
      const { data, error } = await apiClient.GET("/approvals/{requestId}", {
        params: {
          path: { requestId: id },
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
      void queryClient.invalidateQueries({ queryKey: queryKeys.approvals.all });
    },
  });
}

export function useApproveRequest() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ requestId, comments }: { requestId: string; comments?: string }) => {
      const { data, error } = await apiClient.POST("/approvals/{requestId}/approve", {
        params: {
          path: { requestId },
        },
        body: { comments },
      });
      if (error) throw new Error(handleApiError(error));
      return data;
    },
    onSuccess: (_, variables) => {
      void queryClient.invalidateQueries({ queryKey: queryKeys.approvals.request(variables.requestId) });
      void queryClient.invalidateQueries({ queryKey: queryKeys.approvals.all });
    },
  });
}

export function useRejectRequest() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ requestId, comments }: { requestId: string; comments?: string }) => {
      const { data, error } = await apiClient.POST("/approvals/{requestId}/reject", {
        params: {
          path: { requestId },
        },
        body: { comments },
      });
      if (error) throw new Error(handleApiError(error));
      return data;
    },
    onSuccess: (_, variables) => {
      void queryClient.invalidateQueries({ queryKey: queryKeys.approvals.request(variables.requestId) });
      void queryClient.invalidateQueries({ queryKey: queryKeys.approvals.all });
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
      const { data, error } = await apiClient.POST("/approvals/{requestId}/delegate", {
        params: {
          path: { requestId },
        },
        body: { delegateToUserId, comments },
      });
      if (error) throw new Error(handleApiError(error));
      return data;
    },
    onSuccess: (_, variables) => {
      void queryClient.invalidateQueries({ queryKey: queryKeys.approvals.request(variables.requestId) });
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
