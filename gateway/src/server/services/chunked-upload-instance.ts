/**
 * Singleton instance of ChunkedUploadService
 * Used to connect WebSocket service during server initialization
 */

import { ChunkedUploadService } from "./chunked-upload.service.js";
import { getStorageConfig } from "../../config/index.js";

let instance: ChunkedUploadService | null = null;

export function getChunkedUploadServiceInstance(): ChunkedUploadService {
  if (!instance) {
    const storageConfig = getStorageConfig();
    instance = new ChunkedUploadService(storageConfig.tempUploadPath);
  }
  return instance;
}

export function resetChunkedUploadServiceInstance(): void {
  instance = null;
}
