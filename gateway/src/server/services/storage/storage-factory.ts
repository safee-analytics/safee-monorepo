import type { StorageAdapter } from "./storage-adapter.interface.js";
import { LocalAdapter } from "./local-adapter.js";
import { WebDAVAdapter } from "./webdav-adapter.js";
import { SMBAdapter } from "./smb-adapter.js";

export type StorageType = "local" | "webdav" | "smb" | "cloud";

export interface LocalStorageConfig {
  type: "local";
  basePath: string;
}

export interface WebDAVStorageConfig {
  type: "webdav";
  url: string;
  username: string;
  password: string;
  basePath?: string;
}

export interface SMBStorageConfig {
  type: "smb";
  host: string;
  share: string;
  username?: string;
  password?: string;
  domain?: string;
  port?: number;
}

export interface CloudStorageConfig {
  type: "cloud";
  organizationId: string;
}

export type StorageConfig = LocalStorageConfig | WebDAVStorageConfig | SMBStorageConfig | CloudStorageConfig;

/**
 * Storage Factory
 * Creates the appropriate storage adapter based on configuration
 */
export class StorageFactory {
  /**
   * Create a storage adapter from configuration
   */
  static createAdapter(config: StorageConfig): StorageAdapter {
    switch (config.type) {
      case "local":
        return new LocalAdapter(config.basePath);

      case "webdav":
        return new WebDAVAdapter({
          url: config.url,
          username: config.username,
          password: config.password,
          basePath: config.basePath,
        });

      case "smb":
        return new SMBAdapter({
          host: config.host,
          share: config.share,
          username: config.username,
          password: config.password,
          domain: config.domain,
          port: config.port,
        });

      case "cloud":
        // Managed cloud storage - stored on our servers
        return new LocalAdapter(process.env.CLOUD_STORAGE_PATH || `./storage/cloud/${config.organizationId}`);

      default:
        throw new Error(`Unsupported storage type: ${(config as { type: string }).type}`);
    }
  }

  /**
   * Create adapter from environment variables (for default storage)
   */
  static createFromEnv(): StorageAdapter {
    const storageType = (process.env.STORAGE_TYPE || "local") as StorageType;

    switch (storageType) {
      case "local":
        return new LocalAdapter(process.env.STORAGE_PATH || "./storage");

      case "webdav":
        if (!process.env.WEBDAV_URL || !process.env.WEBDAV_USERNAME || !process.env.WEBDAV_PASSWORD) {
          throw new Error("WebDAV configuration missing. Set WEBDAV_URL, WEBDAV_USERNAME, WEBDAV_PASSWORD");
        }
        return new WebDAVAdapter({
          url: process.env.WEBDAV_URL,
          username: process.env.WEBDAV_USERNAME,
          password: process.env.WEBDAV_PASSWORD,
          basePath: process.env.WEBDAV_BASE_PATH,
        });

      case "smb":
        if (!process.env.SMB_HOST || !process.env.SMB_SHARE) {
          throw new Error("SMB configuration missing. Set SMB_HOST, SMB_SHARE");
        }
        return new SMBAdapter({
          host: process.env.SMB_HOST,
          share: process.env.SMB_SHARE,
          username: process.env.SMB_USERNAME,
          password: process.env.SMB_PASSWORD,
          domain: process.env.SMB_DOMAIN,
          port: process.env.SMB_PORT ? parseInt(process.env.SMB_PORT, 10) : undefined,
        });

      default:
        throw new Error(`Unsupported STORAGE_TYPE: ${storageType}`);
    }
  }
}
