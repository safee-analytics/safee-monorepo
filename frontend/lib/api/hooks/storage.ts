import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { z } from "zod";
import { apiClient, handleApiError } from "../client";
import { queryKeys } from "./queryKeys";

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
