import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { apiClient } from "../client";
import { queryKeys } from "./queryKeys";

// Types
export interface Integration {
  id: string;
  name: string;
  description: string;
  logo: string;
  connected: boolean;
  category: "accounting" | "communication" | "storage" | "productivity";
  configUrl?: string;
}

// Get all integrations
export function useGetIntegrations() {
  return useQuery<Integration[]>({
    queryKey: queryKeys.integrations.all,
    queryFn: async () => {
      const { data, error } = await apiClient.GET("/integrations", {});
      if (error) throw new Error(String(error));
      return data;
    },
  });
}

// Connect integration
export function useConnectIntegration() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (integrationId: string) => {
      const response = await apiClient.POST("/integrations/{integrationId}/connect", {
        params: {
          path: {
            integrationId,
          },
        },
      });
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.integrations.all });
    },
  });
}

// Disconnect integration
export function useDisconnectIntegration() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (integrationId: string) => {
      const response = await apiClient.POST("/integrations/{integrationId}/disconnect", {
        params: {
          path: {
            integrationId,
          },
        },
      });
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.integrations.all });
    },
  });
}
