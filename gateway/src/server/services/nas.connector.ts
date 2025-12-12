import { exec } from "node:child_process";
import { promisify } from "node:util";
import path from "node:path";
import fs from "node:fs/promises";

const execAsync = promisify(exec);

export interface NASConfig {
  type: "smb" | "nfs" | "webdav";
  host: string;
  shareName: string;
  username?: string;
  password?: string;
  domain?: string;
  mountPoint?: string;
  port?: number;
}

export interface NASConnectionStatus {
  connected: boolean;
  mountPoint?: string;
  error?: string;
  freeSpace?: number;
  totalSpace?: number;
  usedSpace?: number;
}

/**
 * NAS Connector Service
 * Handles connections to various NAS protocols (SMB, NFS, WebDAV)
 */
export class NASConnector {
  private config: NASConfig;
  private mountPoint: string;
  private isConnected = false;

  constructor(config: NASConfig) {
    this.config = config;
    this.mountPoint = config.mountPoint ?? path.join("/mnt", "nas", config.shareName);
  }

  /**
   * Connect to NAS
   */
  public async connect(): Promise<NASConnectionStatus> {
    try {
      switch (this.config.type) {
        case "smb":
          return await this.connectSMB();
        case "nfs":
          return await this.connectNFS();
        case "webdav":
          return await this.connectWebDAV();
        default:
          throw new Error(`Unsupported NAS type: ${this.config.type}`);
      }
    } catch (err) {
      return {
        connected: false,
        error: err instanceof Error ? err.message : "Unknown error",
      };
    }
  }

  /**
   * Connect to SMB/CIFS share
   */
  private async connectSMB(): Promise<NASConnectionStatus> {
    try {
      // Ensure mount point exists
      await fs.mkdir(this.mountPoint, { recursive: true });

      // Build mount command
      const credentials =
        this.config.username && this.config.password
          ? `-o username=${this.config.username},password=${this.config.password}`
          : "-o guest";

      const domain = this.config.domain ? `,domain=${this.config.domain}` : "";
      const port = this.config.port ?? 445;

      const shareUrl = `//${this.config.host}:${port}/${this.config.shareName}`;
      const mountCmd = `mount -t cifs "${shareUrl}" "${this.mountPoint}" ${credentials}${domain}`;

      // Execute mount command (requires sudo/root privileges)
      await execAsync(mountCmd);

      this.isConnected = true;

      // Get space info
      const spaceInfo = await this.getSpaceInfo();

      return {
        connected: true,
        mountPoint: this.mountPoint,
        ...spaceInfo,
      };
    } catch (err) {
      throw new Error(
        `Failed to connect to SMB share: ${err instanceof Error ? err.message : "Unknown error"}`,
      );
    }
  }

  /**
   * Connect to NFS share
   */
  private async connectNFS(): Promise<NASConnectionStatus> {
    try {
      // Ensure mount point exists
      await fs.mkdir(this.mountPoint, { recursive: true });

      // Build mount command
      const port = this.config.port ?? 2049;
      const shareUrl = `${this.config.host}:${port}:${this.config.shareName}`;
      const mountCmd = `mount -t nfs "${shareUrl}" "${this.mountPoint}"`;

      // Execute mount command
      await execAsync(mountCmd);

      this.isConnected = true;

      // Get space info
      const spaceInfo = await this.getSpaceInfo();

      return {
        connected: true,
        mountPoint: this.mountPoint,
        ...spaceInfo,
      };
    } catch (err) {
      throw new Error(
        `Failed to connect to NFS share: ${err instanceof Error ? err.message : "Unknown error"}`,
      );
    }
  }

  /**
   * Connect to WebDAV share
   */
  private async connectWebDAV(): Promise<NASConnectionStatus> {
    try {
      // Ensure mount point exists
      await fs.mkdir(this.mountPoint, { recursive: true });

      // Build mount command for WebDAV (requires davfs2)
      const protocol = this.config.port === 443 ? "https" : "http";
      const port = this.config.port ?? (protocol === "https" ? 443 : 80);
      const shareUrl = `${protocol}://${this.config.host}:${port}/${this.config.shareName}`;

      const credentials =
        this.config.username && this.config.password
          ? `-o username=${this.config.username},password=${this.config.password}`
          : "";

      const mountCmd = `mount -t davfs "${shareUrl}" "${this.mountPoint}" ${credentials}`;

      // Execute mount command
      await execAsync(mountCmd);

      this.isConnected = true;

      // Get space info
      const spaceInfo = await this.getSpaceInfo();

      return {
        connected: true,
        mountPoint: this.mountPoint,
        ...spaceInfo,
      };
    } catch (err) {
      throw new Error(
        `Failed to connect to WebDAV share: ${err instanceof Error ? err.message : "Unknown error"}`,
      );
    }
  }

  /**
   * Disconnect from NAS
   */
  public async disconnect(): Promise<void> {
    if (!this.isConnected) {
      return;
    }

    try {
      await execAsync(`umount "${this.mountPoint}"`);
      this.isConnected = false;
    } catch (err) {
      throw new Error(`Failed to disconnect: ${err instanceof Error ? err.message : "Unknown error"}`);
    }
  }

  /**
   * Get connection status
   */
  public async getStatus(): Promise<NASConnectionStatus> {
    try {
      // Check if mount point is actually mounted
      const { stdout } = await execAsync(`mount | grep "${this.mountPoint}"`);

      if (stdout.trim()) {
        const spaceInfo = await this.getSpaceInfo();
        return {
          connected: true,
          mountPoint: this.mountPoint,
          ...spaceInfo,
        };
      }
      return {
        connected: false,
      };
    } catch (err) {
      return {
        connected: false,
        error: err instanceof Error ? err.message : "Unknown error",
      };
    }
  }

  /**
   * Get space information
   */
  private async getSpaceInfo(): Promise<{ freeSpace: number; totalSpace: number; usedSpace: number }> {
    try {
      const { stdout } = await execAsync(`df -B1 "${this.mountPoint}" | tail -1`);
      const parts = stdout.trim().split(/\s+/);

      if (parts.length >= 4) {
        const totalSpace = parseInt(parts[1], 10);
        const usedSpace = parseInt(parts[2], 10);
        const freeSpace = parseInt(parts[3], 10);

        return { totalSpace, usedSpace, freeSpace };
      }

      return { totalSpace: 0, usedSpace: 0, freeSpace: 0 };
    } catch {
      return { totalSpace: 0, usedSpace: 0, freeSpace: 0 };
    }
  }

  /**
   * Get mount point path
   */
  public getMountPoint(): string {
    return this.mountPoint;
  }

  /**
   * Check if connected
   */
  public isConnectedToNAS(): boolean {
    return this.isConnected;
  }
}

/**
 * NAS Manager - manages multiple NAS connections
 */
export class NASManager {
  private connectors = new Map<string, NASConnector>();

  /**
   * Add NAS configuration
   */
  public async addNAS(name: string, config: NASConfig): Promise<NASConnectionStatus> {
    const connector = new NASConnector(config);
    const status = await connector.connect();

    if (status.connected) {
      this.connectors.set(name, connector);
    }

    return status;
  }

  /**
   * Remove NAS connection
   */
  public async removeNAS(name: string): Promise<void> {
    const connector = this.connectors.get(name);
    if (connector) {
      await connector.disconnect();
      this.connectors.delete(name);
    }
  }

  /**
   * Get NAS connector
   */
  public getNAS(name: string): NASConnector | undefined {
    return this.connectors.get(name);
  }

  /**
   * Get all NAS connections status
   */
  public async getAllStatus(): Promise<Record<string, NASConnectionStatus>> {
    const statuses: Record<string, NASConnectionStatus> = {};

    for (const [name, connector] of this.connectors.entries()) {
      statuses[name] = await connector.getStatus();
    }

    return statuses;
  }

  /**
   * Disconnect all NAS connections
   */
  public async disconnectAll(): Promise<void> {
    for (const connector of this.connectors.values()) {
      await connector.disconnect();
    }
    this.connectors.clear();
  }
}
