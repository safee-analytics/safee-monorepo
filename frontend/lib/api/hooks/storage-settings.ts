import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { apiClient } from "../client";
import { queryKeys } from "./queryKeys";


export interface NASConfig {
  type: "smb" | "nfs" | "webdav" | "local";
  host: string;
  shareName: string;
  username: string;
  password: string;
  domain?: string;
  mountPoint?: string;
  port?: number;
}

export interface StorageInfo {
  totalSpace: string;
  usedSpace: string;
  availableSpace: string;
  usagePercentage: number;
}


export function useGetStorageConfig() {
  return useQuery<NASConfig>({
    queryKey: queryKeys.storage.config,
    queryFn: async () => {
      const response = await apiClient.GET("/storage/config", {});
      if (!response.data) throw new Error("Failed to fetch storage config");
      return response.data;
    },
  });
}


export function useUpdateStorageConfig() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (config: NASConfig) => {
      const response = await apiClient.PUT("/storage/config", { body: config });
      return response.data;
    },
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: queryKeys.storage.config });
    },
  });
}


export function useTestStorageConnection() {
  return useMutation({
    mutationFn: async (config: NASConfig) => {
      const response = await apiClient.POST("/storage/test-connection", { body: config });
      return response.data;
    },
  });
}


export function useGetStorageInfo() {
  return useQuery<StorageInfo>({
    queryKey: queryKeys.storage.info,
    queryFn: async () => {
      const response = await apiClient.GET("/storage/info", {});
      if (!response.data) throw new Error("Failed to fetch storage info");
      return response.data;
    },
  });
}
