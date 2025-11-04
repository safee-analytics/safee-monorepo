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
