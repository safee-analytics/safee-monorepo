/**
 * Encrypted Storage Service
 *
 * Handles file encryption before upload and decryption after download.
 * Uses Web Worker for background processing to keep UI responsive.
 */

import type { FileMetadata, UploadProgress } from "./storageService";
import { useEncryptionStore } from "@/stores/useEncryptionStore";
import type { ResponseMessage, EncryptMessage, DecryptMessage } from "@/lib/crypto/encryptionWorker";

const API_BASE = process.env.NEXT_PUBLIC_API_URL || "http://localhost:3001";

export interface EncryptedUploadProgress extends UploadProgress {
  encryptionProgress?: number; // 0-100
  uploadProgress?: number; // 0-100
  stage: "encrypting" | "uploading" | "completed" | "error";
}

export interface FileEncryptionMetadata {
  iv: string;
  authTag: string;
  algorithm: string;
  chunkSize: number;
  keyVersion: number;
}

class EncryptedStorageService {
  private worker: Worker | null = null;

  /**
   * Initializes the encryption worker
   */
  private getWorker(): Worker {
    if (!this.worker) {
      // Create worker from the worker file
      this.worker = new Worker(new URL("@/lib/crypto/encryptionWorker.ts", import.meta.url));
    }
    return this.worker;
  }

  /**
   * Exports the organization key as raw ArrayBuffer for worker
   */
  private async exportOrgKey(key: CryptoKey): Promise<ArrayBuffer> {
    return await crypto.subtle.exportKey("raw", key);
  }

  /**
   * Upload an encrypted file
   */
  async uploadEncryptedFile(
    file: File,
    options?: {
      folderId?: string;
      tags?: string[];
      metadata?: Record<string, unknown>;
      onProgress?: (progress: EncryptedUploadProgress) => void;
    },
  ): Promise<FileMetadata> {
    const { orgKey } = useEncryptionStore.getState();

    if (!orgKey) {
      throw new Error("Encryption key not available. Please unlock encryption first.");
    }

    // Read file as ArrayBuffer
    const fileData = await file.arrayBuffer();

    // Export org key for worker
    const orgKeyData = await this.exportOrgKey(orgKey);

    // Create progress tracking
    const progressCallback = options?.onProgress;
    let encryptionProgress = 0;
    let uploadProgress = 0;

    const updateProgress = (stage: EncryptedUploadProgress["stage"]) => {
      if (progressCallback) {
        progressCallback({
          fileId: crypto.randomUUID(), // Temporary ID until upload completes
          fileName: file.name,
          loaded: 0,
          total: file.size,
          percentage: stage === "encrypting" ? encryptionProgress : uploadProgress,
          status: stage === "error" ? "error" : stage === "completed" ? "completed" : "uploading",
          encryptionProgress,
          uploadProgress,
          stage,
        });
      }
    };

    // Encrypt file using Web Worker
    const { encryptedData, iv, authTag } = await new Promise<{
      encryptedData: ArrayBuffer;
      iv: string;
      authTag: string;
    }>((resolve, reject) => {
      const worker = this.getWorker();

      const message: EncryptMessage = {
        type: "encrypt",
        fileData,
        orgKeyData,
      };

      worker.onmessage = (event: MessageEvent<ResponseMessage>) => {
        const response = event.data;

        if (response.type === "progress") {
          encryptionProgress = response.progress;
          updateProgress("encrypting");
        } else if (response.type === "complete") {
          // GCM auth tag is included in the encrypted data (last 16 bytes)
          const encrypted = response.result;
          const authTagBytes = new Uint8Array(encrypted.slice(-16));
          const ciphertext = encrypted.slice(0, -16);

          // Convert auth tag to base64
          const authTagBase64 = btoa(String.fromCharCode(...authTagBytes));

          resolve({
            encryptedData: ciphertext,
            iv: response.iv!,
            authTag: authTagBase64,
          });
        } else if (response.type === "error") {
          reject(new Error(response.error));
        }
      };

      worker.onerror = (error) => {
        reject(new Error(`Worker error: ${error.message}`));
      };

      worker.postMessage(message);
    });

    // Create encrypted blob
    const encryptedBlob = new Blob([encryptedData], { type: "application/octet-stream" });

    // Upload encrypted file with metadata
    updateProgress("uploading");

    const formData = new FormData();
    formData.append("file", encryptedBlob, file.name);
    if (options?.folderId) formData.append("folderId", options.folderId);
    if (options?.tags) formData.append("tags", JSON.stringify(options.tags));
    if (options?.metadata) formData.append("metadata", JSON.stringify(options.metadata));

    // Add encryption metadata
    const encryptionMetadata: FileEncryptionMetadata = {
      iv,
      authTag,
      algorithm: "AES-256-GCM",
      chunkSize: 128 * 1024, // 128KB
      keyVersion: 1, // TODO: Get from encryption store
    };
    formData.append("encryptionMetadata", JSON.stringify(encryptionMetadata));

    // Upload with progress tracking
    const uploadedFile = await new Promise<FileMetadata>((resolve, reject) => {
      const xhr = new XMLHttpRequest();

      xhr.upload.onprogress = (event) => {
        if (event.lengthComputable) {
          uploadProgress = Math.round((event.loaded / event.total) * 100);
          updateProgress("uploading");
        }
      };

      xhr.onload = () => {
        if (xhr.status >= 200 && xhr.status < 300) {
          updateProgress("completed");
          resolve(JSON.parse(xhr.responseText) as FileMetadata);
        } else {
          reject(new Error(`Upload failed: ${xhr.statusText}`));
        }
      };

      xhr.onerror = () => reject(new Error("Upload failed"));

      xhr.open("POST", `${API_BASE}/api/v1/storage/files`);
      // Add auth header if available
      const authHeader = document.cookie
        .split("; ")
        .find((row) => row.startsWith("auth_token="))
        ?.split("=")[1];
      if (authHeader) {
        xhr.setRequestHeader("Authorization", `Bearer ${authHeader}`);
      }

      xhr.send(formData);
    });

    return uploadedFile;
  }

  /**
   * Download and decrypt a file
   */
  async downloadDecryptedFile(
    fileId: string,
    fileName: string,
    onProgress?: (progress: { stage: string; percentage: number }) => void,
  ): Promise<void> {
    const { orgKey } = useEncryptionStore.getState();

    if (!orgKey) {
      throw new Error("Encryption key not available. Please unlock encryption first.");
    }

    // Fetch encryption metadata
    onProgress?.({ stage: "fetching-metadata", percentage: 0 });
    const metadataResponse = await fetch(`${API_BASE}/api/v1/storage/files/${fileId}/encryption-metadata`);

    if (!metadataResponse.ok) {
      throw new Error("Failed to fetch encryption metadata");
    }

    const encryptionMetadata: FileEncryptionMetadata = await metadataResponse.json();

    // Fetch encrypted file
    onProgress?.({ stage: "downloading", percentage: 25 });
    const fileResponse = await fetch(`${API_BASE}/api/v1/storage/files/${fileId}/download`);

    if (!fileResponse.ok) {
      throw new Error("Failed to download file");
    }

    const encryptedData = await fileResponse.arrayBuffer();

    // Decrypt file using Web Worker
    onProgress?.({ stage: "decrypting", percentage: 50 });

    const orgKeyData = await this.exportOrgKey(orgKey);

    const decryptedData = await new Promise<ArrayBuffer>((resolve, reject) => {
      const worker = this.getWorker();

      const message: DecryptMessage = {
        type: "decrypt",
        encryptedData,
        orgKeyData,
        iv: encryptionMetadata.iv,
        chunkSize: encryptionMetadata.chunkSize,
      };

      worker.onmessage = (event: MessageEvent<ResponseMessage>) => {
        const response = event.data;

        if (response.type === "progress") {
          const percentage = 50 + response.progress / 2; // 50-100%
          onProgress?.({ stage: "decrypting", percentage });
        } else if (response.type === "complete") {
          resolve(response.result);
        } else if (response.type === "error") {
          reject(new Error(response.error));
        }
      };

      worker.onerror = (error) => {
        reject(new Error(`Worker error: ${error.message}`));
      };

      worker.postMessage(message);
    });

    // Trigger download
    onProgress?.({ stage: "downloading-decrypted", percentage: 100 });

    const blob = new Blob([decryptedData]);
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = fileName;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  }

  /**
   * Check if a file is encrypted
   */
  async isFileEncrypted(fileId: string): Promise<boolean> {
    try {
      const response = await fetch(`${API_BASE}/api/v1/storage/files/${fileId}/encryption-metadata`);
      return response.ok;
    } catch {
      return false;
    }
  }

  /**
   * Cleanup worker on unmount
   */
  destroy(): void {
    if (this.worker) {
      this.worker.terminate();
      this.worker = null;
    }
  }
}

// Export singleton instance
export const encryptedStorageService = new EncryptedStorageService();
