import { createClient, type WebDAVClient, type FileStat } from "webdav";
import { z } from "zod";
import type { StorageAdapter, FileStats, StorageStats } from "./storage-adapter.interface.js";

const QuotaDataSchema = z.object({
  available: z.union([z.string(), z.number()]),
  used: z.number(),
});

const QuotaResponseSchema = z.union([
  QuotaDataSchema,
  z.object({ data: QuotaDataSchema.nullable() }),
  z.null(),
]);

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

  constructor(config: { url: string; username: string; password: string; basePath?: string }) {
    this.client = createClient(config.url, {
      username: config.username,
      password: config.password,
    });
    this.basePath = config.basePath ?? "/";
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
      const quotaResponse = await this.client.getQuota();
      const parsed = QuotaResponseSchema.safeParse(quotaResponse);

      if (!parsed.success) {
        return { total: 0, used: 0, free: 0 };
      }

      const quota = parsed.data;

      // Handle null response
      if (quota === null) {
        return { total: 0, used: 0, free: 0 };
      }

      // Extract quota data from wrapper if present
      const quotaData = "data" in quota ? quota.data : quota;

      if (!quotaData) {
        return { total: 0, used: 0, free: 0 };
      }

      const available = String(quotaData.available);
      const used = quotaData.used;
      const total = available === "unlimited" ? 0 : parseInt(available, 10);

      return {
        total,
        used,
        free: total - used,
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
