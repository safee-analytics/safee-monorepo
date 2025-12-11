import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { apiClient } from "../client";
import { queryKeys } from "./queryKeys";

// Types
export interface DatabaseStats {
  totalSize: string;
  tableCount: number;
  rowCount: string;
  lastOptimized: string;
  health: "good" | "warning" | "critical";
}

export interface Backup {
  id: string;
  name: string;
  size: string;
  date: string;
  status: "completed" | "failed" | "in-progress";
  type: "automatic" | "manual";
}

export interface BackupSettings {
  autoBackup: boolean;
  backupFrequency: string;
  backupRetention: string;
  backupLocation: string;
  compressionEnabled: boolean;
  encryptionEnabled: boolean;
}

// Get database stats
export function useGetDatabaseStats() {
  return useQuery<DatabaseStats>({
    queryKey: queryKeys.database.stats,
    queryFn: async () => {
      const { data, error } = await apiClient.GET("/database/stats", {});
      if (error) throw new Error(String(error));
      return data;
    },
  });
}

// Get backup settings
export function useGetBackupSettings() {
  return useQuery<BackupSettings>({
    queryKey: queryKeys.database.backupSettings,
    queryFn: async () => {
      const { data, error } = await apiClient.GET("/database/backup/settings", {});
      if (error) throw new Error(String(error));
      return data;
    },
  });
}

// Update backup settings
export function useUpdateBackupSettings() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (settings: BackupSettings) => {
      const response = await apiClient.PUT("/database/backup/settings", { body: settings });
      return response.data;
    },
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: queryKeys.database.backupSettings });
    },
  });
}

// Get backup history
export function useGetBackupHistory() {
  return useQuery<Backup[]>({
    queryKey: queryKeys.database.backups,
    queryFn: async () => {
      const { data, error } = await apiClient.GET("/database/backups", {});
      if (error) throw new Error(String(error));
      return data;
    },
  });
}

// Create manual backup
export function useCreateBackup() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async () => {
      const response = await apiClient.POST("/database/backup", {});
      return response.data;
    },
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: queryKeys.database.backups });
    },
  });
}

// Restore backup
export function useRestoreBackup() {
  return useMutation({
    mutationFn: async (backupId: string) => {
      const response = await apiClient.POST("/database/backup/{backupId}/restore", {
        params: {
          path: {
            backupId,
          },
        },
      });
      return response.data;
    },
  });
}

// Download backup
export function useDownloadBackup() {
  return useMutation({
    mutationFn: async (backupId: string) => {
      const response = await apiClient.GET("/database/backup/{backupId}/download", {
        params: {
          path: {
            backupId,
          },
        },
        parseAs: "blob",
      });

      // Create download link
      if (response.data) {
        const url = window.URL.createObjectURL(new Blob([response.data]));
        const link = document.createElement("a");
        link.href = url;
        link.setAttribute("download", `backup-${backupId}.sql.gz`);
        document.body.appendChild(link);
        link.click();
        link.remove();
      }

      return response.data;
    },
  });
}

// Optimize database
export function useOptimizeDatabase() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async () => {
      const response = await apiClient.POST("/database/optimize", {});
      return response.data;
    },
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: queryKeys.database.stats });
    },
  });
}

// Run database maintenance
export function useRunMaintenance() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async () => {
      const response = await apiClient.POST("/database/maintenance", {});
      return response.data;
    },
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: queryKeys.database.stats });
    },
  });
}
