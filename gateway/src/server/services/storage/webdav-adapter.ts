import { createClient, type WebDAVClient, type FileStat } from "webdav";
import type { StorageAdapter, FileStats, StorageStats } from "./storage-adapter.interface.js";

/**
 * WebDAV Storage Adapter
 * Connects to NAS/file servers via WebDAV (no mount required!)
 *
 * Supports:
 * - Synology NAS (WebDAV enabled)
 * - QNAP NAS
 * - Nextcloud/ownCloud
 * - Windows IIS WebDAV
 * - Apache mod_dav
 */
export class WebDAVAdapter implements StorageAdapter {
  private client: WebDAVClient;
  private basePath: string;

  constructor(config: {
    url: string;
    username: string;
    password: string;
    basePath?: string;
  }) {
    this.client = createClient(config.url, {
      username: config.username,
      password: config.password,
    });
    this.basePath = config.basePath || "/";
  }

  private resolvePath(path: string): string {
    return `${this.basePath}/${path}`.replace(/\/+/g, "/");
  }

  async upload(path: string, data: Buffer): Promise<void> {
    const fullPath = this.resolvePath(path);
    await this.client.putFileContents(fullPath, data);
  }

  async download(path: string): Promise<Buffer> {
    const fullPath = this.resolvePath(path);
    const contents = await this.client.getFileContents(fullPath);
    return Buffer.from(contents as ArrayBuffer);
  }

  async delete(path: string): Promise<void> {
    const fullPath = this.resolvePath(path);
    await this.client.deleteFile(fullPath);
  }

  async exists(path: string): Promise<boolean> {
    const fullPath = this.resolvePath(path);
    return await this.client.exists(fullPath);
  }

  async stat(path: string): Promise<FileStats> {
    const fullPath = this.resolvePath(path);
    const stat = (await this.client.stat(fullPath)) as FileStat;

    return {
      size: stat.size,
      createdAt: new Date(stat.lastmod),
      modifiedAt: new Date(stat.lastmod),
      isDirectory: stat.type === "directory",
    };
  }

  async list(path: string): Promise<string[]> {
    const fullPath = this.resolvePath(path);
    const contents = await this.client.getDirectoryContents(fullPath);

    return (contents as FileStat[]).map((item) => item.filename);
  }

  async mkdir(path: string): Promise<void> {
    const fullPath = this.resolvePath(path);
    await this.client.createDirectory(fullPath, { recursive: true });
  }

  async getStats(): Promise<StorageStats> {
    try {
      const quota = await this.client.getQuota();
      return {
        total: quota.available === "unlimited" ? 0 : parseInt(quota.available, 10),
        used: quota.used,
        free: quota.available === "unlimited" ? 0 : parseInt(quota.available, 10) - quota.used,
      };
    } catch {
      // Quota not supported
      return {
        total: 0,
        used: 0,
        free: 0,
      };
    }
  }

  /**
   * Test connection to WebDAV server
   */
  async testConnection(): Promise<boolean> {
    try {
      await this.client.getDirectoryContents(this.basePath);
      return true;
    } catch {
      return false;
    }
  }
}
