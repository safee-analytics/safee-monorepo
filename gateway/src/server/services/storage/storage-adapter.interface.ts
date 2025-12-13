/**
 * Storage Adapter Interface
 * Abstracts different storage backends (local, S3, NAS, WebDAV)
 */

export interface StorageAdapter {
  /**
   * Upload a file
   */
  upload(path: string, data: Buffer): Promise<void>;

  /**
   * Download a file
   */
  download(path: string): Promise<Buffer>;

  /**
   * Delete a file
   */
  delete(path: string): Promise<void>;

  /**
   * Check if file exists
   */
  exists(path: string): Promise<boolean>;

  /**
   * Get file metadata
   */
  stat(path: string): Promise<FileStats>;

  /**
   * List files in directory
   */
  list(path: string): Promise<string[]>;

  /**
   * Create directory
   */
  mkdir(path: string): Promise<void>;

  /**
   * Get storage stats
   */
  getStats(): Promise<StorageStats>;

  /**
   * Get signed URL for temporary file access
   * @param path - File path
   * @param expiresIn - Expiration time in seconds (default: 3600)
   * @param action - Action type: 'read' or 'write'
   */
  getSignedUrl?(path: string, expiresIn?: number, action?: "read" | "write"): Promise<string>;
}

export interface FileStats {
  size: number;
  createdAt: Date;
  modifiedAt: Date;
  isDirectory: boolean;
}

export interface StorageStats {
  total: number;
  used: number;
  free: number;
}
