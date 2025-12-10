import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { z } from "zod";
import { apiClient, handleApiError } from "../client";
import { queryKeys } from "./queryKeys";
import { encryptedStorageService } from "@/lib/services/encryptedStorageService";
import { useEncryptionStatus } from "@/stores/useEncryptionStore";

export function useStorageFiles(folderId?: string) {
  return useQuery({
    queryKey: queryKeys.storage.files(folderId),
    queryFn: async () => {
      const { data, error } = await apiClient.GET("/storage/files/search", {
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
      const { data, error } = await apiClient.GET("/storage/files/{fileId}", {
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
  metadata: z.record(z.string(), z.unknown()).optional(),
  onProgress: z
    .function()
    .args(z.object({ percentage: z.number(), stage: z.string() }))
    .optional(),
});

export function useUploadFile() {
  const queryClient = useQueryClient();
  const { canEncrypt } = useEncryptionStatus();

  return useMutation({
    mutationFn: async (input: z.infer<typeof uploadFileSchema>) => {
      const validated = uploadFileSchema.parse(input);

      // Use encrypted upload if encryption is enabled
      if (canEncrypt) {
        return await encryptedStorageService.uploadEncryptedFile(validated.file, {
          folderId: validated.folderId,
          tags: validated.tags,
          metadata: validated.metadata,
          onProgress: validated.onProgress,
        });
      }

      // Regular upload
      const formData = new FormData();
      formData.append("file", validated.file);
      if (validated.folderId) formData.append("folderId", validated.folderId);
      if (validated.tags) formData.append("tags", JSON.stringify(validated.tags));
      if (validated.metadata) formData.append("metadata", JSON.stringify(validated.metadata));

      const { data, error } = await apiClient.POST("/storage/upload", {
        // @ts-expect-error FormData is compatible with multipart/form-data
        body: formData,
      });
      if (error) throw new Error(handleApiError(error));
      return data;
    },
    onSuccess: (_, variables) => {
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
      const { data, error } = await apiClient.DELETE("/storage/files/{fileId}", {
        params: {
          path: { fileId },
        },
      });
      if (error) throw new Error(handleApiError(error));
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["storage", "files"] });
    },
  });
}

export function useStorageQuota() {
  return useQuery({
    queryKey: queryKeys.storage.quota,
    queryFn: async () => {
      const { data, error } = await apiClient.GET("/storage/quota");
      if (error) throw new Error(handleApiError(error));
      return data;
    },
  });
}

/**
 * Hook to download a file with automatic decryption if encrypted
 */
export function useDownloadFile() {
  return useMutation({
    mutationFn: async ({
      fileId,
      fileName,
      isEncrypted,
      onProgress,
    }: {
      fileId: string;
      fileName: string;
      isEncrypted?: boolean;
      onProgress?: (progress: { stage: string; percentage: number }) => void;
    }) => {
      if (isEncrypted) {
        // Use encrypted download with decryption
        await encryptedStorageService.downloadDecryptedFile(fileId, fileName, onProgress);
      } else {
        // Regular download
        const { data, error } = await apiClient.GET("/storage/files/{fileId}/download", {
          params: { path: { fileId } },
        });
        if (error) throw new Error(handleApiError(error));

        // Trigger browser download
        const url = data as unknown as string; // Assuming API returns download URL
        const a = document.createElement("a");
        a.href = url;
        a.download = fileName;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
      }
    },
  });
}

/**
 * Hook to check if a file is encrypted
 */
export function useCheckFileEncryption(fileId: string) {
  return useQuery<boolean>({
    queryKey: ["storage", "file-encryption", fileId],
    queryFn: async () => {
      return await encryptedStorageService.isFileEncrypted(fileId);
    },
    enabled: !!fileId,
  });
}
