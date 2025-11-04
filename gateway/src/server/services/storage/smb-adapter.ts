import SMB2 from "@marsaud/smb2";
import type { StorageAdapter, FileStats, StorageStats } from "./storage-adapter.interface.js";

/**
 * SMB/CIFS Storage Adapter
 * Connects to Windows/Samba shares via pure JavaScript (no mount required!)
 *
 * Uses @marsaud/smb2 - a pure JS SMB2/SMB3 client
 * No system commands, no root access needed!
 */
export class SMBAdapter implements StorageAdapter {
  private client: any;
  private connected: boolean = false;

  constructor(config: {
    host: string;
    share: string;
    username?: string;
    password?: string;
    domain?: string;
    port?: number;
  }) {
    this.client = new SMB2({
      share: `\\\\${config.host}\\${config.share}`,
      domain: config.domain || "WORKGROUP",
      username: config.username || "guest",
      password: config.password || "",
      port: config.port || 445,
      autoCloseTimeout: 10000,
    });
  }

  private async ensureConnected(): Promise<void> {
    if (!this.connected) {
      // Connection is automatic on first operation
      this.connected = true;
    }
  }

  async upload(path: string, data: Buffer): Promise<void> {
    await this.ensureConnected();

    return new Promise((resolve, reject) => {
      this.client.writeFile(path, data, (err: Error) => {
        if (err) reject(err);
        else resolve();
      });
    });
  }

  async download(path: string): Promise<Buffer> {
    await this.ensureConnected();

    return new Promise((resolve, reject) => {
      this.client.readFile(path, (err: Error, data: Buffer) => {
        if (err) reject(err);
        else resolve(data);
      });
    });
  }

  async delete(path: string): Promise<void> {
    await this.ensureConnected();

    return new Promise((resolve, reject) => {
      this.client.unlink(path, (err: Error) => {
        if (err) reject(err);
        else resolve();
      });
    });
  }

  async exists(path: string): Promise<boolean> {
    await this.ensureConnected();

    return new Promise((resolve) => {
      this.client.exists(path, (exists: boolean) => {
        resolve(exists);
      });
    });
  }

  async stat(path: string): Promise<FileStats> {
    await this.ensureConnected();

    return new Promise((resolve, reject) => {
      this.client.stat(path, (err: Error, stats: any) => {
        if (err) {
          reject(err);
          return;
        }

        resolve({
          size: stats.size,
          createdAt: stats.birthtime,
          modifiedAt: stats.mtime,
          isDirectory: stats.isDirectory(),
        });
      });
    });
  }

  async list(path: string): Promise<string[]> {
    await this.ensureConnected();

    return new Promise((resolve, reject) => {
      this.client.readdir(path, (err: Error, files: string[]) => {
        if (err) reject(err);
        else resolve(files);
      });
    });
  }

  async mkdir(path: string): Promise<void> {
    await this.ensureConnected();

    return new Promise((resolve, reject) => {
      this.client.mkdir(path, (err: Error) => {
        if (err) reject(err);
        else resolve();
      });
    });
  }

  async getStats(): Promise<StorageStats> {
    // SMB2 doesn't provide quota info easily
    // Would need to implement custom disk space check
    return {
      total: 0,
      used: 0,
      free: 0,
    };
  }

  async disconnect(): Promise<void> {
    if (this.client) {
      this.client.disconnect();
      this.connected = false;
    }
  }

  /**
   * Test connection to SMB server
   */
  async testConnection(): Promise<boolean> {
    try {
      await this.ensureConnected();
      await this.list("/");
      return true;
    } catch {
      return false;
    }
  }
}
