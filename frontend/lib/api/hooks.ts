import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { apiClient, handleApiError } from "./client";
import type { paths } from "./schema";
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
