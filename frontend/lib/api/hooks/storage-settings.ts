import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { apiClient } from "../client";
import { queryKeys } from "./queryKeys";

// Types
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

// Get storage configuration
export function useGetStorageConfig() {
  return useQuery<NASConfig>({
    queryKey: queryKeys.storage.config,
    queryFn: async () => {
      const response = await apiClient.get("/storage/config");
      return response.data;
    },
  });
}

// Update storage configuration
export function useUpdateStorageConfig() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (config: NASConfig) => {
      const response = await apiClient.put("/storage/config", config);
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.storage.config });
    },
  });
}

// Test storage connection
export function useTestStorageConnection() {
  return useMutation({
    mutationFn: async (config: NASConfig) => {
      const response = await apiClient.post("/storage/test-connection", config);
      return response.data;
    },
  });
}

// Get storage information
export function useGetStorageInfo() {
  return useQuery<StorageInfo>({
    queryKey: queryKeys.storage.info,
    queryFn: async () => {
      const response = await apiClient.get("/storage/info");
      return response.data;
    },
  });
}
