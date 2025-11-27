import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { apiClient } from "../client";
import { queryKeys } from "./queryKeys";

// Types
export interface APIKey {
  id: string;
  name: string;
  key: string;
  created: string;
  lastUsed: string;
  status: "active" | "revoked";
  permissions: string[];
}

export interface CreateAPIKeyRequest {
  name: string;
  permissions: string[];
}

export interface Permission {
  id: string;
  name: string;
  description: string;
}

// Get all API keys
export function useGetAPIKeys() {
  return useQuery<APIKey[]>({
    queryKey: queryKeys.apiKeys.all,
    queryFn: async () => {
      const response = await apiClient.GET("/api-keys", {});
      if (response.error) throw response.error;
      return response.data;
    },
  });
}

// Get available permissions
export function useGetAvailablePermissions() {
  return useQuery<Permission[]>({
    queryKey: queryKeys.apiKeys.permissions,
    queryFn: async () => {
      const response = await apiClient.GET("/api-keys/permissions", {});
      if (response.error) throw response.error;
      return response.data;
    },
  });
}

// Create API key
export function useCreateAPIKey() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (request: CreateAPIKeyRequest) => {
      const response = await apiClient.POST("/api-keys", { body: request });
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.apiKeys.all });
    },
  });
}

// Revoke API key
export function useRevokeAPIKey() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (keyId: string) => {
      const response = await apiClient.POST(`/api-keys/${keyId}/revoke`, {});
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.apiKeys.all });
    },
  });
}

// Delete API key
export function useDeleteAPIKey() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (keyId: string) => {
      const response = await apiClient.DELETE(`/api-keys/${keyId}`, {});
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.apiKeys.all });
    },
  });
}
