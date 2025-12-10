/**
 * Upload Service
 * Handles file uploads with automatic chunking for large files,
 * progress tracking via WebSocket, and encryption support
 */

export interface FileMetadata {
  id: string;
  name: string;
  path: string;
  size: number;
  mimeType: string;
  createdAt: string;
  modifiedAt: string;
  createdBy: string;
  folderId?: string;
  tags?: string[];
  metadata?: Record<string, unknown>;
}

export interface UploadOptions {
  folderId?: string;
  tags?: string[];
  metadata?: Record<string, unknown>;
  onProgress?: (progress: number) => void;
  encrypt?: boolean;
  encryptionKey?: ArrayBuffer; // Organization encryption key
  chunkSize?: number;
  endpoint?: string; // Custom upload endpoint (e.g., '/api/v1/users/me/avatar')
  method?: 'POST' | 'PUT'; // HTTP method for custom endpoint (default: POST)
}

export interface UploadResult {
  file: File;
  metadata?: FileMetadata;
  error?: Error;
  status: "pending" | "uploading" | "completed" | "failed";
}

const DEFAULT_CHUNK_SIZE = 5 * 1024 * 1024; // 5MB
const CHUNK_THRESHOLD = 10 * 1024 * 1024; // 10MB

export class UploadService {
  private readonly chunkSize: number;
  private readonly chunkThreshold: number;

  constructor() {
    this.chunkSize =
      Number(process.env.NEXT_PUBLIC_CHUNK_SIZE) || DEFAULT_CHUNK_SIZE;
    this.chunkThreshold =
      Number(process.env.NEXT_PUBLIC_CHUNK_THRESHOLD) || CHUNK_THRESHOLD;
  }

  /**
   * Auto-select upload method based on file size
   */
  public async upload(
    file: File,
    options: UploadOptions = {},
  ): Promise<FileMetadata> {
    if (this.shouldUseChunkedUpload(file.size)) {
      return this.uploadChunked(file, options);
    }
    return this.uploadDirect(file, options);
  }

  /**
   * Direct upload for small files
   */
  public async uploadDirect(
    file: File,
    options: UploadOptions = {},
  ): Promise<FileMetadata> {
    const formData = new FormData();
    formData.append("file", file);

    // Only add these fields if using the default storage endpoint
    if (!options.endpoint) {
      if (options.folderId) {
        formData.append("folderId", options.folderId);
      }
      if (options.tags) {
        formData.append("tags", JSON.stringify(options.tags));
      }
      if (options.metadata) {
        formData.append("metadata", JSON.stringify(options.metadata));
      }
    }

    const endpoint = options.endpoint || "/api/v1/storage/upload";
    const method = options.method || "POST";

    const response = await fetch(endpoint, {
      method,
      body: formData,
      credentials: "include",
    });

    if (!response.ok) {
      throw new Error(`Upload failed: ${response.statusText}`);
    }

    return response.json();
  }

  /**
   * Chunked upload for large files
   */
  public async uploadChunked(
    file: File,
    options: UploadOptions = {},
  ): Promise<FileMetadata> {
    let processedFile = file;
    let encryptionMetadata: { iv: string; authTag?: string } | undefined;

    // Step 0: Encrypt file if requested
    if (options.encrypt && options.encryptionKey) {
      const encryptedData = await this.encryptFile(file, options.encryptionKey, options.onProgress);
      processedFile = new File([encryptedData.data], file.name, { type: file.type });
      encryptionMetadata = { iv: encryptedData.iv, authTag: encryptedData.authTag };
    }

    const chunkSize = options.chunkSize || this.chunkSize;
    const totalChunks = Math.ceil(processedFile.size / chunkSize);

    // Step 1: Initialize chunked upload
    const { uploadId } = await this.initChunkedUpload(
      processedFile.name,
      processedFile.size,
      processedFile.type,
      totalChunks,
      chunkSize,
      {
        ...options.metadata,
        encrypted: options.encrypt || false,
        encryptionMetadata,
      },
    );

    try {
      // Step 2: Upload chunks
      await this.uploadChunks(processedFile, uploadId, chunkSize, totalChunks);

      // Step 3: Complete upload
      const metadata = await this.completeChunkedUpload(uploadId, {
        folderId: options.folderId,
        tags: options.tags,
        metadata: {
          ...options.metadata,
          encrypted: options.encrypt || false,
          encryptionMetadata,
        },
      });

      return metadata;
    } catch (error) {
      // Cancel upload on error
      await this.cancelChunkedUpload(uploadId).catch(() => {
        // Ignore cancel errors
      });
      throw error;
    }
  }

  /**
   * Initialize chunked upload session
   */
  private async initChunkedUpload(
    fileName: string,
    fileSize: number,
    mimeType: string,
    totalChunks: number,
    chunkSize: number,
    metadata?: Record<string, unknown>,
  ): Promise<{ uploadId: string; expiresAt: string }> {
    const response = await fetch("/api/v1/storage/upload/chunked/init", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      credentials: "include",
      body: JSON.stringify({
        fileName,
        fileSize,
        mimeType,
        totalChunks,
        chunkSize,
        metadata,
      }),
    });

    if (!response.ok) {
      throw new Error(`Failed to initialize upload: ${response.statusText}`);
    }

    return response.json();
  }

  /**
   * Upload all chunks
   */
  private async uploadChunks(
    file: File,
    uploadId: string,
    chunkSize: number,
    totalChunks: number,
  ): Promise<void> {
    const promises: Promise<void>[] = [];

    for (let i = 0; i < totalChunks; i++) {
      const start = i * chunkSize;
      const end = Math.min(start + chunkSize, file.size);
      const chunk = file.slice(start, end);

      // Upload chunk
      const promise = this.uploadChunk(uploadId, i, chunk);
      promises.push(promise);

      // Limit concurrent uploads (3 at a time)
      if (promises.length >= 3 || i === totalChunks - 1) {
        await Promise.all(promises);
        promises.length = 0; // Clear array
      }
    }
  }

  /**
   * Upload a single chunk
   */
  private async uploadChunk(
    uploadId: string,
    chunkNumber: number,
    chunk: Blob,
  ): Promise<void> {
    const formData = new FormData();
    formData.append("chunk", chunk);

    const response = await fetch(
      `/api/v1/storage/upload/chunked/${uploadId}/chunk/${chunkNumber}`,
      {
        method: "POST",
        body: formData,
        credentials: "include",
      },
    );

    if (!response.ok) {
      throw new Error(
        `Failed to upload chunk ${chunkNumber}: ${response.statusText}`,
      );
    }
  }

  /**
   * Complete chunked upload
   */
  private async completeChunkedUpload(
    uploadId: string,
    options: {
      folderId?: string;
      tags?: string[];
      metadata?: Record<string, unknown>;
    },
  ): Promise<FileMetadata> {
    const response = await fetch(
      `/api/v1/storage/upload/chunked/${uploadId}/complete`,
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        credentials: "include",
        body: JSON.stringify(options),
      },
    );

    if (!response.ok) {
      throw new Error(`Failed to complete upload: ${response.statusText}`);
    }

    return response.json();
  }

  /**
   * Cancel chunked upload
   */
  public async cancelChunkedUpload(uploadId: string): Promise<void> {
    const response = await fetch(
      `/api/v1/storage/upload/chunked/${uploadId}/cancel`,
      {
        method: "DELETE",
        credentials: "include",
      },
    );

    if (!response.ok) {
      throw new Error(`Failed to cancel upload: ${response.statusText}`);
    }
  }

  /**
   * Get upload status
   */
  public async getUploadStatus(uploadId: string): Promise<{
    uploadId: string;
    fileName: string;
    fileSize: number;
    uploadedBytes: number;
    uploadedChunks: number[];
    totalChunks: number;
    percentage: number;
    status: "pending" | "uploading" | "completed" | "failed" | "expired";
  }> {
    const response = await fetch(
      `/api/v1/storage/upload/chunked/${uploadId}/status`,
      {
        method: "GET",
        credentials: "include",
      },
    );

    if (!response.ok) {
      throw new Error(`Failed to get upload status: ${response.statusText}`);
    }

    return response.json();
  }

  /**
   * Determine if file should use chunked upload
   */
  private shouldUseChunkedUpload(fileSize: number): boolean {
    return fileSize > this.chunkThreshold;
  }

  /**
   * Encrypt file using Web Worker
   */
  private async encryptFile(
    file: File,
    encryptionKey: ArrayBuffer,
    onProgress?: (progress: number) => void,
  ): Promise<{
    data: ArrayBuffer;
    iv: string;
    authTag?: string;
  }> {
    return new Promise((resolve, reject) => {
      const worker = new Worker(
        new URL("@/lib/crypto/encryptionWorker.ts", import.meta.url),
      );

      worker.onmessage = (event) => {
        const message = event.data;

        if (message.type === "progress") {
          // Update progress (encryption takes 0-30% of total progress)
          onProgress?.(Math.round(message.progress * 0.3));
        } else if (message.type === "complete") {
          worker.terminate();
          resolve({
            data: message.result,
            iv: message.iv,
            authTag: message.authTag,
          });
        } else if (message.type === "error") {
          worker.terminate();
          reject(new Error(message.error));
        }
      };

      worker.onerror = (error) => {
        worker.terminate();
        reject(error);
      };

      // Read file as ArrayBuffer
      const reader = new FileReader();
      reader.onload = () => {
        worker.postMessage({
          type: "encrypt",
          fileData: reader.result as ArrayBuffer,
          orgKeyData: encryptionKey,
        });
      };
      reader.onerror = () => {
        worker.terminate();
        reject(new Error("Failed to read file"));
      };
      reader.readAsArrayBuffer(file);
    });
  }

  /**
   * Upload multiple files
   */
  public async uploadMultiple(
    files: File[],
    options: UploadOptions = {},
  ): Promise<UploadResult[]> {
    const results: UploadResult[] = files.map((file) => ({
      file,
      status: "pending" as const,
    }));

    // Upload files sequentially to avoid overwhelming the server
    for (let i = 0; i < files.length; i++) {
      const file = files[i];
      results[i].status = "uploading";

      try {
        const metadata = await this.upload(file, options);
        results[i].metadata = metadata;
        results[i].status = "completed";
      } catch (error) {
        results[i].error = error as Error;
        results[i].status = "failed";
      }
    }

    return results;
  }
}

// Export singleton instance
export const uploadService = new UploadService();
