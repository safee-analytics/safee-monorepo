export interface StorageMetadata {
  contentType?: string;
  cacheControl?: string;
  contentDisposition?: string;
  contentEncoding?: string;
  metadata?: Record<string, string>;
}

export interface StorageResult {
  key: string;
  bucket: string;
  url: string;
  size?: number;
  etag?: string;
  lastModified?: Date;
}

export interface Storage {
  /**
   * Save a file to storage
   */
  saveFile(path: string, data: Buffer, metadata?: StorageMetadata): Promise<StorageResult>;

  /**
   * Get a file from storage
   */
  getFile(path: string): Promise<Buffer>;

  /**
   * Check if a file exists
   */
  fileExists(path: string): Promise<boolean>;

  /**
   * Delete a file from storage
   */
  deleteFile(path: string): Promise<void>;

  /**
   * Get file metadata
   */
  getFileMetadata(path: string): Promise<StorageResult>;

  /**
   * List files with optional prefix
   */
  listFiles(prefix?: string, limit?: number): Promise<StorageResult[]>;

  /**
   * Generate a signed URL for temporary access
   */
  getSignedUrl(path: string, expiresIn?: number): Promise<string>;

  /**
   * Copy a file within the storage
   */
  copyFile(sourcePath: string, destinationPath: string): Promise<StorageResult>;
}
