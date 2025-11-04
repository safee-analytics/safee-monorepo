import fs from "fs/promises";
import path from "path";
import type { StorageAdapter, FileStats, StorageStats } from "./storage-adapter.interface.js";

/**
 * Local File System Storage Adapter
 * Uses the local file system for storage
 */
export class LocalAdapter implements StorageAdapter {
  private basePath: string;

  constructor(basePath: string) {
    this.basePath = basePath;
  }

  private resolvePath(filePath: string): string {
    return path.join(this.basePath, filePath);
  }

  async upload(filePath: string, data: Buffer): Promise<void> {
    const fullPath = this.resolvePath(filePath);
    const dir = path.dirname(fullPath);

    // Ensure directory exists
    await fs.mkdir(dir, { recursive: true });
    await fs.writeFile(fullPath, data);
  }

  async download(filePath: string): Promise<Buffer> {
    const fullPath = this.resolvePath(filePath);
    return await fs.readFile(fullPath);
  }

  async delete(filePath: string): Promise<void> {
    const fullPath = this.resolvePath(filePath);
    await fs.unlink(fullPath);
  }

  async exists(filePath: string): Promise<boolean> {
    const fullPath = this.resolvePath(filePath);
    try {
      await fs.access(fullPath);
      return true;
    } catch {
      return false;
    }
  }

  async stat(filePath: string): Promise<FileStats> {
    const fullPath = this.resolvePath(filePath);
    const stats = await fs.stat(fullPath);

    return {
      size: stats.size,
      createdAt: stats.birthtime,
      modifiedAt: stats.mtime,
      isDirectory: stats.isDirectory(),
    };
  }

  async list(dirPath: string): Promise<string[]> {
    const fullPath = this.resolvePath(dirPath);
    return await fs.readdir(fullPath);
  }

  async mkdir(dirPath: string): Promise<void> {
    const fullPath = this.resolvePath(dirPath);
    await fs.mkdir(fullPath, { recursive: true });
  }

  async getStats(): Promise<StorageStats> {
    // For local storage, we can't easily get disk stats
    // Would need platform-specific commands
    return {
      total: 0,
      used: 0,
      free: 0,
    };
  }
}
