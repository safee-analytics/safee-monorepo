import {
  Controller,
  Post,
  Get,
  Delete,
  Route,
  Tags,
  Body,
  Path,
  Query,
  UploadedFile,
  FormField,
  Security,
  Request,
  SuccessResponse,
} from "tsoa";
import { StorageServiceV2 } from "../services/storage.service.v2.js";
import { StorageConnectorService } from "../services/storage/storage-connector.service.js";
import type { Response } from "express";
import type { AuthenticatedRequest } from "../middleware/auth.js";
import { getServerContext } from "../serverContext.js";

export interface FileUploadRequest {
  folderId?: string;
  tags?: string[];
  metadata?: Record<string, unknown>;
}

export interface FileMetadata {
  id: string;
  name: string;
  path: string;
  size: number;
  mimeType: string;
  createdAt: string;
  modifiedAt: string;
  createdBy: string;
  modifiedBy?: string;
  folderId?: string;
  tags?: string[];
  metadata?: Record<string, unknown>;
}

export interface FolderMetadata {
  id: string;
  name: string;
  path: string;
  parentId?: string;
  createdAt: string;
  modifiedAt: string;
  createdBy: string;
  modifiedBy?: string;
  fileCount: number;
  subFolderCount: number;
}

export interface CreateFolderRequest {
  name: string;
  parentId?: string;
}

export interface FileSearchParams {
  query?: string;
  folderId?: string;
  mimeTypes?: string[];
  tags?: string[];
  dateFrom?: string;
  dateTo?: string;
  createdBy?: string;
  limit?: number;
  offset?: number;
}

@Route("api/v1/storage")
@Tags("Storage")
export class StorageController extends Controller {
  private connectorService: StorageConnectorService;

  constructor() {
    super();
    const ctx = getServerContext();
    this.connectorService = new StorageConnectorService(ctx.drizzle);
  }

  /**
   * Get storage service for an organization
   */
  private async getStorageService(organizationId: string): Promise<StorageServiceV2> {
    const adapter = await this.connectorService.getAdapter(organizationId);
    return new StorageServiceV2(adapter);
  }

  /**
   * Upload a file to storage
   */
  @Post("upload")
  @Security("jwt")
  @SuccessResponse("201", "File uploaded successfully")
  public async uploadFile(
    @Request() request: AuthenticatedRequest,
    @UploadedFile() file: globalThis.Express.Multer.File,
    @FormField() folderId?: string,
    @FormField() tags?: string,
    @FormField() metadata?: string,
  ): Promise<FileMetadata> {
    if (!file) {
      throw new Error("No file provided");
    }

    if (!request.user?.id || !request.user?.organizationId) {
      throw new Error("User not authenticated");
    }

    const storageService = await this.getStorageService(request.user.organizationId);

    return await storageService.uploadFile(file, {
      folderId,
      tags: tags ? JSON.parse(tags) : undefined,
      metadata: metadata ? JSON.parse(metadata) : undefined,
      userId: request.user.id,
    });
  }

  /**
   * Upload multiple files
   */
  @Post("upload/batch")
  @Security("jwt")
  @SuccessResponse("201", "Files uploaded successfully")
  public async uploadFiles(
    @Request() request: AuthenticatedRequest,
    @UploadedFile() files: globalThis.Express.Multer.File[],
    @FormField() folderId?: string,
    @FormField() tags?: string,
    @FormField() metadata?: string,
  ): Promise<FileMetadata[]> {
    if (!files || files.length === 0) {
      throw new Error("No files provided");
    }

    if (!request.user?.id || !request.user?.organizationId) {
      throw new Error("User not authenticated");
    }

    const storageService = await this.getStorageService(request.user.organizationId);

    return await storageService.uploadFiles(files, {
      folderId,
      tags: tags ? JSON.parse(tags) : undefined,
      metadata: metadata ? JSON.parse(metadata) : undefined,
      userId: request.user.id,
    });
  }

  /**
   * Get file metadata
   */
  @Get("files/{fileId}")
  @Security("jwt")
  public async getFile(
    @Path() fileId: string,
    @Request() request: AuthenticatedRequest,
  ): Promise<FileMetadata> {
    if (!request.user?.organizationId) {
      throw new Error("User not authenticated");
    }

    const storageService = await this.getStorageService(request.user.organizationId);
    return await storageService.getFileMetadata(fileId);
  }

  /**
   * Download file
   */
  @Get("files/{fileId}/download")
  @Security("jwt")
  public async downloadFile(@Path() fileId: string, @Request() request: AuthenticatedRequest): Promise<void> {
    if (!request.user?.organizationId) {
      throw new Error("User not authenticated");
    }

    const storageService = await this.getStorageService(request.user.organizationId);
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const response = (request as any).res as Response;
    await storageService.downloadFile(fileId, response);
  }

  /**
   * Delete file
   */
  @Delete("files/{fileId}")
  @Security("jwt")
  @SuccessResponse("204", "File deleted successfully")
  public async deleteFile(
    @Path() fileId: string,
    @Request() request: AuthenticatedRequest,
  ): Promise<void> {
    if (!request.user?.organizationId) {
      throw new Error("User not authenticated");
    }

    const storageService = await this.getStorageService(request.user.organizationId);
    await storageService.deleteFile(fileId);
  }

  /**
   * Search files
   */
  @Get("files/search")
  @Security("jwt")
  public async searchFiles(
    @Request() request: AuthenticatedRequest,
    @Query() query?: string,
    @Query() folderId?: string,
    @Query() mimeTypes?: string[],
    @Query() tags?: string[],
    @Query() dateFrom?: string,
    @Query() dateTo?: string,
    @Query() createdBy?: string,
    @Query() limit?: number,
    @Query() offset?: number,
  ): Promise<{ files: FileMetadata[]; total: number; hasMore: boolean }> {
    if (!request.user?.organizationId) {
      throw new Error("User not authenticated");
    }

    const storageService = await this.getStorageService(request.user.organizationId);

    return await storageService.searchFiles({
      query,
      folderId,
      mimeTypes,
      tags,
      dateFrom,
      dateTo,
      createdBy,
      limit: limit || 20,
      offset: offset || 0,
    });
  }

  /**
   * Create folder
   */
  @Post("folders")
  @Security("jwt")
  @SuccessResponse("201", "Folder created successfully")
  public async createFolder(
    @Body() body: CreateFolderRequest,
    @Request() request: AuthenticatedRequest,
  ): Promise<FolderMetadata> {
    if (!request.user?.id || !request.user?.organizationId) {
      throw new Error("User not authenticated");
    }

    const storageService = await this.getStorageService(request.user.organizationId);

    return await storageService.createFolder(body.name, body.parentId, request.user.id);
  }

  /**
   * Get folder contents
   */
  @Get("folders/{folderId}")
  @Security("jwt")
  public async getFolderContents(
    @Path() folderId: string,
    @Request() request: AuthenticatedRequest,
  ): Promise<{ folder: FolderMetadata; files: FileMetadata[]; subFolders: FolderMetadata[] }> {
    if (!request.user?.organizationId) {
      throw new Error("User not authenticated");
    }

    const storageService = await this.getStorageService(request.user.organizationId);
    return await storageService.getFolderContents(folderId);
  }

  /**
   * Delete folder
   */
  @Delete("folders/{folderId}")
  @Security("jwt")
  @SuccessResponse("204", "Folder deleted successfully")
  public async deleteFolder(
    @Path() folderId: string,
    @Request() request: AuthenticatedRequest,
  ): Promise<void> {
    if (!request.user?.organizationId) {
      throw new Error("User not authenticated");
    }

    const storageService = await this.getStorageService(request.user.organizationId);
    await storageService.deleteFolder(folderId);
  }

  /**
   * Get storage quota information
   */
  @Get("quota")
  @Security("jwt")
  public async getQuota(
    @Request() request: AuthenticatedRequest,
  ): Promise<{ used: number; total: number; remaining: number; unit: string }> {
    if (!request.user?.id || !request.user?.organizationId) {
      throw new Error("User not authenticated");
    }

    const storageService = await this.getStorageService(request.user.organizationId);

    return await storageService.getQuota(request.user.id);
  }
}
