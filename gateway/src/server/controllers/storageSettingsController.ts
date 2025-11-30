import { Body, Controller, Get, Post, Put, Request, Route, Security, Tags } from "tsoa";
import type { AuthenticatedRequest } from "../middleware/auth.js";

// Types
interface NASConfig {
  type: "smb" | "nfs" | "webdav" | "local";
  host: string;
  shareName: string;
  username: string;
  password: string;
  domain?: string;
  mountPoint?: string;
  port?: number;
}

interface StorageInfo {
  totalSpace: string;
  usedSpace: string;
  availableSpace: string;
  usagePercentage: number;
}

@Route("storage")
@Tags("Storage")
export class StorageSettingsController extends Controller {
  @Get("/config")
  @Security("jwt")
  public async getStorageConfig(@Request() req: AuthenticatedRequest): Promise<NASConfig> {
    // TODO: Implement actual config query
    return {
      type: "local",
      host: "localhost",
      shareName: "/data",
      username: "",
      password: "",
    };
  }

  @Put("/config")
  @Security("jwt")
  public async updateStorageConfig(
    @Request() req: AuthenticatedRequest,
    @Body() config: NASConfig,
  ): Promise<NASConfig> {
    // TODO: Implement actual config update
    return config;
  }

  @Post("/test-connection")
  @Security("jwt")
  public async testStorageConnection(
    @Request() req: AuthenticatedRequest,
    @Body() config: NASConfig,
  ): Promise<{ success: boolean; message: string }> {
    // TODO: Implement actual connection test
    return { success: true, message: "Connection successful" };
  }

  @Get("/info")
  @Security("jwt")
  public async getStorageInfo(@Request() req: AuthenticatedRequest): Promise<StorageInfo> {
    // TODO: Implement actual storage info query
    return {
      totalSpace: "100 GB",
      usedSpace: "45 GB",
      availableSpace: "55 GB",
      usagePercentage: 45,
    };
  }
}
