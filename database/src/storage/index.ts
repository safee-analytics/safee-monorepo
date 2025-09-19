import { GoogleCloudStorage } from "./googleCloudStorage.js";
import { AzureBlobStorage } from "./azureBlobStorage.js";
import { FileSystemStorage } from "./fileSystemStorage.js";
import type { Storage } from "./storage.js";
import { IS_LOCAL } from "../env.js";

export type StorageProvider = "google" | "azure" | "filesystem";

export interface StorageConfig {
  provider: StorageProvider;
  bucket: string;
  connectionString?: string;
  localPath?: string;
}

/**
 * Create a storage instance based on configuration
 */
export function createStorage(config: StorageConfig): Storage {
  switch (config.provider) {
    case "google":
      return new GoogleCloudStorage(config.bucket);
    case "azure":
      if (!config.connectionString) {
        throw new Error("Azure Blob Storage requires a connection string");
      }
      return new AzureBlobStorage(config.bucket, config.connectionString);
    case "filesystem":
      return new FileSystemStorage(config.localPath ?? "public", config.bucket);
    default:
      throw new Error(`Unsupported storage provider: ${String(config.provider)}`);
  }
}

/**
 * Get default storage based on environment (backward compatibility)
 */
export function getStorage(bucket: string): Storage {
  if (IS_LOCAL) {
    return new FileSystemStorage("public", bucket);
  }
  return new GoogleCloudStorage(bucket);
}

// Re-export types and classes
export type { Storage } from "./storage.js";
export { GoogleCloudStorage } from "./googleCloudStorage.js";
export { AzureBlobStorage } from "./azureBlobStorage.js";
export { FileSystemStorage } from "./fileSystemStorage.js";
