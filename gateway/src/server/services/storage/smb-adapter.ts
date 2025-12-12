import SMB2Constructor from "@marsaud/smb2";
import type { StorageAdapter, FileStats, StorageStats } from "./storage-adapter.interface.js";

// Type the SMB2 class properly based on the library's actual interface
// Based on @marsaud/smb2 documentation
interface ISMB2 {
  exists(path: string, cb: (err: Error | null, exists: boolean) => void): void;
  mkdir(path: string, mode: number, cb: (err: Error | null) => void): void;
  mkdir(path: string, cb: (err: Error | null) => void): void;
  readdir(path: string, cb: (err: Error | null, files: string[]) => void): void;
  stat(
    path: string,
    cb: (
      err: Error | null,
      stats: { birthtime: Date; mtime: Date; atime: Date; ctime: Date; isDirectory(): boolean },
    ) => void,
  ): void;
  readFile(path: string, cb: (err: Error | null, data: Buffer) => void): void;
  writeFile(path: string, data: string | Buffer, cb: (err: Error | null) => void): void;
  rename(oldPath: string, newPath: string, cb: (err: Error | null) => void): void;
  rmdir(path: string, cb: (err: Error | null) => void): void;
  unlink(path: string, cb: (err: Error | null) => void): void;
  close(fd: number, cb: (err: Error | null) => void): void;
  disconnect(): void;
}

/**
 * SMB/CIFS Storage Adapter
 * Connects to Windows/Samba shares via pure JavaScript (no mount required!)
 *
 * Uses @marsaud/smb2 - a pure JS SMB2/SMB3 client
 * No system commands, no root access needed!
 */
export class SMBAdapter implements StorageAdapter {
  private client: ISMB2;
  private connected = false;

  constructor(config: {
    host: string;
    share: string;
    username?: string;
    password?: string;
    domain?: string;
    port?: number;
  }) {
    // SMB2 package has incorrect type definitions, casting to function type
    const smb2Factory = SMB2Constructor as unknown as (config: {
      share: string;
      domain: string;
      username: string;
      password: string;
      port: number;
      autoCloseTimeout: number;
    }) => ISMB2;

    this.client = smb2Factory({
      share: `\\\\${config.host}\\${config.share}`,
      domain: config.domain ?? "WORKGROUP",
      username: config.username ?? "guest",
      password: config.password ?? "",
      port: config.port ?? 445,
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
      this.client.writeFile(path, data, (err: Error | null) => {
        if (err) reject(err);
        else resolve();
      });
    });
  }

  async download(path: string): Promise<Buffer> {
    await this.ensureConnected();

    return new Promise((resolve, reject) => {
      this.client.readFile(path, (err: Error | null, data: Buffer) => {
        if (err) reject(err);
        else resolve(data);
      });
    });
  }

  async delete(path: string): Promise<void> {
    await this.ensureConnected();

    return new Promise((resolve, reject) => {
      this.client.unlink(path, (err: Error | null) => {
        if (err) reject(err);
        else resolve();
      });
    });
  }

  async exists(path: string): Promise<boolean> {
    await this.ensureConnected();

    return new Promise((resolve, reject) => {
      this.client.exists(path, (err: Error | null, exists: boolean) => {
        if (err) reject(err);
        else resolve(exists);
      });
    });
  }

  async stat(path: string): Promise<FileStats> {
    await this.ensureConnected();

    return new Promise<FileStats>((resolve, reject) => {
      this.client.stat(
        path,
        (
          err: Error | null,
          stats: { birthtime: Date; mtime: Date; atime: Date; ctime: Date; isDirectory(): boolean },
        ) => {
          if (err) {
            reject(err);
            return;
          }

          resolve({
            size: 0, // SMB2 stat doesn't return size - would need to open and get file info separately
            createdAt: stats.birthtime,
            modifiedAt: stats.mtime,
            isDirectory: stats.isDirectory(),
          });
        },
      );
    });
  }

  async list(path: string): Promise<string[]> {
    await this.ensureConnected();

    return new Promise((resolve, reject) => {
      this.client.readdir(path, (err: Error | null, files: string[]) => {
        if (err) reject(err);
        else resolve(files);
      });
    });
  }

  async mkdir(path: string): Promise<void> {
    await this.ensureConnected();

    return new Promise((resolve, reject) => {
      this.client.mkdir(path, (err: Error | null) => {
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
    // this.client is always defined in constructor, just disconnect
    this.client.disconnect();
    this.connected = false;
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
