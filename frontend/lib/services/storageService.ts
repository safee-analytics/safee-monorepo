import { z } from "zod";

const API_BASE = process.env.NEXT_PUBLIC_API_URL || "http://localhost:3001";

export const fileMetadataSchema = z.object({
  id: z.string(),
  name: z.string(),
  path: z.string(),
  size: z.number(),
  mimeType: z.string(),
  createdAt: z.string(),
  modifiedAt: z.string(),
  createdBy: z.string(),
  modifiedBy: z.string().optional(),
  folderId: z.string().optional(),
  tags: z.array(z.string()).optional(),
  metadata: z.record(z.string(), z.unknown()).optional(),
});

export type FileMetadata = z.infer<typeof fileMetadataSchema>;

export interface FolderMetadata {
  id: string;
  name: string;
  path: string;
  parentId?: string;
  createdAt: string;
  modifiedAt: string;
  fileCount: number;
  subFolderCount: number;
}

export interface UploadProgress {
  fileId: string;
  fileName: string;
  loaded: number;
  total: number;
  percentage: number;
  status: "pending" | "uploading" | "completed" | "error";
  error?: string;
}

export interface FileSearchParams {
  query?: string;
  folderId?: string;
  mimeTypes?: string[];
  tags?: string[];
  dateFrom?: string;
  dateTo?: string;
  createdBy?: string;
  limit?: number;
  offset?: number;
}

export interface FileSearchResult {
  files: FileMetadata[];
  total: number;
  hasMore: boolean;
}

export interface StorageQuota {
  used: number;
  total: number;
  remaining: number;
  unit: string;
}

class StorageService {
  private uploadProgressCallbacks = new Map<string, (progress: UploadProgress) => void>();

  /**
   * Upload single file
   */
  async uploadFile(
    file: File,
    options?: {
      folderId?: string;
      tags?: string[];
      metadata?: Record<string, unknown>;
      onProgress?: (progress: UploadProgress) => void;
    },
  ): Promise<FileMetadata> {
    const formData = new FormData();
    formData.append("file", file);
    if (options?.folderId) formData.append("folderId", options.folderId);
    if (options?.tags) formData.append("tags", JSON.stringify(options.tags));
    if (options?.metadata) formData.append("metadata", JSON.stringify(options.metadata));

    return new Promise((resolve, reject) => {
      const xhr = new XMLHttpRequest();

      // Track progress
      if (options?.onProgress) {
        xhr.upload.addEventListener("progress", (event) => {
          if (event.lengthComputable) {
            const progress: UploadProgress = {
              fileId: "",
              fileName: file.name,
              loaded: event.loaded,
              total: event.total,
              percentage: Math.round((event.loaded / event.total) * 100),
              status: "uploading",
            };
            options.onProgress!(progress);
          }
        });
      }

      xhr.addEventListener("load", () => {
        if (xhr.status === 201) {
          const result: FileMetadata = JSON.parse(xhr.responseText);
          if (options?.onProgress) {
            options.onProgress({
              fileId: result.id,
              fileName: file.name,
              loaded: file.size,
              total: file.size,
              percentage: 100,
              status: "completed",
            });
          }
          resolve(result);
        } else {
          const error = `Upload failed with status ${xhr.status}`;
          if (options?.onProgress) {
            options.onProgress({
              fileId: "",
              fileName: file.name,
              loaded: 0,
              total: file.size,
              percentage: 0,
              status: "error",
              error,
            });
          }
          reject(new Error(error));
        }
      });

      xhr.addEventListener("error", () => {
        const error = "Upload failed";
        if (options?.onProgress) {
          options.onProgress({
            fileId: "",
            fileName: file.name,
            loaded: 0,
            total: file.size,
            percentage: 0,
            status: "error",
            error,
          });
        }
        reject(new Error(error));
      });

      xhr.open("POST", `${API_BASE}/api/v1/storage/upload`);
      xhr.setRequestHeader("Authorization", `Bearer ${this.getToken()}`);
      xhr.send(formData);
    });
  }

  /**
   * Upload multiple files
   */
  async uploadFiles(
    files: File[],
    options?: {
      folderId?: string;
      tags?: string[];
      metadata?: Record<string, unknown>;
      onProgress?: (fileId: string, progress: UploadProgress) => void;
    },
  ): Promise<FileMetadata[]> {
    const uploadPromises = files.map((file) =>
      this.uploadFile(file, {
        ...options,
        onProgress: options?.onProgress
          ? (progress) => {
              options.onProgress!(file.name, progress);
            }
          : undefined,
      }),
    );

    return await Promise.all(uploadPromises);
  }

  /**
   * Get file metadata
   */
  async getFileMetadata(fileId: string): Promise<FileMetadata> {
    const response = await fetch(`${API_BASE}/api/v1/storage/files/${fileId}`, {
      headers: {
        Authorization: `Bearer ${this.getToken()}`,
      },
    });

    if (!response.ok) {
      throw new Error(`Failed to get file metadata: ${response.statusText}`);
    }

    return await response.json();
  }

  /**
   * Download file
   */
  async downloadFile(fileId: string, fileName: string): Promise<void> {
    const response = await fetch(`${API_BASE}/api/v1/storage/files/${fileId}/download`, {
      headers: {
        Authorization: `Bearer ${this.getToken()}`,
      },
    });

    if (!response.ok) {
      throw new Error(`Failed to download file: ${response.statusText}`);
    }

    const blob = await response.blob();
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = fileName;
    document.body.appendChild(a);
    a.click();
    window.URL.revokeObjectURL(url);
    document.body.removeChild(a);
  }

  /**
   * Delete file
   */
  async deleteFile(fileId: string): Promise<void> {
    const response = await fetch(`${API_BASE}/api/v1/storage/files/${fileId}`, {
      method: "DELETE",
      headers: {
        Authorization: `Bearer ${this.getToken()}`,
      },
    });

    if (!response.ok) {
      throw new Error(`Failed to delete file: ${response.statusText}`);
    }
  }

  /**
   * Search files
   */
  async searchFiles(params: FileSearchParams): Promise<FileSearchResult> {
    const queryParams = new URLSearchParams();
    if (params.query) queryParams.append("query", params.query);
    if (params.folderId) queryParams.append("folderId", params.folderId);
    if (params.mimeTypes) for (const type of params.mimeTypes) queryParams.append("mimeTypes", type);
    if (params.tags) for (const tag of params.tags) queryParams.append("tags", tag);
    if (params.dateFrom) queryParams.append("dateFrom", params.dateFrom);
    if (params.dateTo) queryParams.append("dateTo", params.dateTo);
    if (params.createdBy) queryParams.append("createdBy", params.createdBy);
    if (params.limit) queryParams.append("limit", params.limit.toString());
    if (params.offset) queryParams.append("offset", params.offset.toString());

    const response = await fetch(`${API_BASE}/api/v1/storage/files/search?${queryParams}`, {
      headers: {
        Authorization: `Bearer ${this.getToken()}`,
      },
    });

    if (!response.ok) {
      throw new Error(`Failed to search files: ${response.statusText}`);
    }

    return await response.json();
  }

  /**
   * Create folder
   */
  async createFolder(name: string, parentId?: string): Promise<FolderMetadata> {
    const response = await fetch(`${API_BASE}/api/v1/storage/folders`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${this.getToken()}`,
      },
      body: JSON.stringify({ name, parentId }),
    });

    if (!response.ok) {
      throw new Error(`Failed to create folder: ${response.statusText}`);
    }

    return await response.json();
  }

  /**
   * Get folder contents
   */
  async getFolderContents(folderId: string): Promise<{
    folder: FolderMetadata;
    files: FileMetadata[];
    subFolders: FolderMetadata[];
  }> {
    const response = await fetch(`${API_BASE}/api/v1/storage/folders/${folderId}`, {
      headers: {
        Authorization: `Bearer ${this.getToken()}`,
      },
    });

    if (!response.ok) {
      throw new Error(`Failed to get folder contents: ${response.statusText}`);
    }

    return await response.json();
  }

  /**
   * Delete folder
   */
  async deleteFolder(folderId: string): Promise<void> {
    const response = await fetch(`${API_BASE}/api/v1/storage/folders/${folderId}`, {
      method: "DELETE",
      headers: {
        Authorization: `Bearer ${this.getToken()}`,
      },
    });

    if (!response.ok) {
      throw new Error(`Failed to delete folder: ${response.statusText}`);
    }
  }

  /**
   * Get storage quota
   */
  async getQuota(): Promise<StorageQuota> {
    const response = await fetch(`${API_BASE}/api/v1/storage/quota`, {
      headers: {
        Authorization: `Bearer ${this.getToken()}`,
      },
    });

    if (!response.ok) {
      throw new Error(`Failed to get quota: ${response.statusText}`);
    }

    return await response.json();
  }

  /**
   * Format file size
   */
  formatFileSize(bytes: number): string {
    if (bytes === 0) return "0 Bytes";
    const k = 1024;
    const sizes = ["Bytes", "KB", "MB", "GB", "TB"];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return `${Math.round((bytes / Math.pow(k, i)) * 100) / 100} ${sizes[i]}`;
  }

  /**
   * Get auth token
   */
  private getToken(): string {
    // Get token from localStorage or cookie
    return localStorage.getItem("auth_token") || "";
  }
}

export const storageService = new StorageService();
