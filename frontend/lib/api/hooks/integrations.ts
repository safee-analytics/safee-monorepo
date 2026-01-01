import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { apiClient } from "../client";
import { queryKeys } from "./queryKeys";

export interface Integration {
  id: string;
  name: string;
  description: string;
  logo: string;
  connected: boolean;
  category: "accounting" | "communication" | "storage" | "productivity";
  configUrl?: string;
}

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
      void queryClient.invalidateQueries({ queryKey: queryKeys.integrations.all });
    },
  });
}

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
      void queryClient.invalidateQueries({ queryKey: queryKeys.integrations.all });
    },
  });
}
