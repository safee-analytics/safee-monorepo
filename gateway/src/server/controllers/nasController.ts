import { Controller, Post, Get, Delete, Route, Tags, Body, Path, Security, SuccessResponse } from "tsoa";
import { NASManager, type NASConfig, type NASConnectionStatus } from "../services/nas.connector.js";

interface ConnectNASRequest {
  name: string;
  type: "smb" | "nfs" | "webdav";
  host: string;
  shareName: string;
  username?: string;
  password?: string;
  domain?: string;
  mountPoint?: string;
  port?: number;
}

type NASStatusResponse = Record<string, NASConnectionStatus>;

@Route("nas")
@Tags("NAS Management")
export class NASController extends Controller {
  private nasManager: NASManager;

  constructor() {
    super();
    this.nasManager = new NASManager();
  }

  /**
   * Connect to a NAS drive
   * Supports SMB/CIFS, NFS, and WebDAV protocols
   */
  @Post("connect")
  @Security("jwt")
  @SuccessResponse("201", "NAS connected successfully")
  public async connectNAS(@Body() request: ConnectNASRequest): Promise<NASConnectionStatus> {
    const config: NASConfig = {
      type: request.type,
      host: request.host,
      shareName: request.shareName,
      username: request.username,
      password: request.password,
      domain: request.domain,
      mountPoint: request.mountPoint,
      port: request.port,
    };

    return await this.nasManager.addNAS(request.name, config);
  }

  /**
   * Disconnect from a NAS drive
   */
  @Delete("{name}")
  @Security("jwt")
  @SuccessResponse("204", "NAS disconnected successfully")
  public async disconnectNAS(@Path() name: string): Promise<void> {
    await this.nasManager.removeNAS(name);
  }

  /**
   * Get status of all connected NAS drives
   */
  @Get("status")
  @Security("jwt")
  public async getAllNASStatus(): Promise<NASStatusResponse> {
    return await this.nasManager.getAllStatus();
  }

  /**
   * Disconnect from all NAS drives
   */
  @Delete("all")
  @Security("jwt")
  @SuccessResponse("204", "All NAS drives disconnected")
  public async disconnectAll(): Promise<{ message: string }> {
    await this.nasManager.disconnectAll();
    return { message: "All NAS drives disconnected successfully" };
  }
}
