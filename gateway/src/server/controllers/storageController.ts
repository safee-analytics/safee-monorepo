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
import { Readable } from "stream";
import { StorageServiceV2 } from "../services/storage.service.v2.js";
import { StorageConnectorService } from "../services/storage/storage-connector.service.js";
import { ClientEncryptionService } from "../services/clientEncryption.service.js";
import { getChunkedUploadServiceInstance } from "../services/chunked-upload-instance.js";
import type { Response } from "express";
import type { AuthenticatedRequest } from "../middleware/auth.js";
import { getServerContext } from "../serverContext.js";
import { getStorageConfig } from "../../config/index.js";

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

@Route("storage")
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
  @Security("jwt")
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
    if (!request.betterAuthSession?.user.id || !request.betterAuthSession.session.activeOrganizationId) {
      throw new Error("User not authenticated");
    }

    const storageService = await this.getStorageService(
      request.betterAuthSession.session.activeOrganizationId,
    );

    return await storageService.uploadFile(file, {
      folderId,
      tags: tags ? JSON.parse(tags) : undefined,
      metadata: metadata ? JSON.parse(metadata) : undefined,
      userId: request.betterAuthSession.user.id,
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
    if (!request.betterAuthSession?.user.id || !request.betterAuthSession.session.activeOrganizationId) {
      throw new Error("User not authenticated");
    }

    const storageService = await this.getStorageService(
      request.betterAuthSession.session.activeOrganizationId,
    );

    return await storageService.uploadFiles(files, {
      folderId,
      tags: tags ? JSON.parse(tags) : undefined,
      metadata: metadata ? JSON.parse(metadata) : undefined,
      userId: request.betterAuthSession.user.id,
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
    if (!request.betterAuthSession?.session.activeOrganizationId) {
      throw new Error("User not authenticated");
    }

    const storageService = await this.getStorageService(
      request.betterAuthSession.session.activeOrganizationId,
    );
    return await storageService.getFileMetadata(fileId);
  }

  /**
   * Download file
   */
  @Get("files/{fileId}/download")
  @Security("jwt")
  public async downloadFile(@Path() fileId: string, @Request() request: AuthenticatedRequest): Promise<void> {
    if (!request.betterAuthSession?.session.activeOrganizationId) {
      throw new Error("User not authenticated");
    }

    const storageService = await this.getStorageService(
      request.betterAuthSession.session.activeOrganizationId,
    );
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
  public async deleteFile(@Path() fileId: string, @Request() request: AuthenticatedRequest): Promise<void> {
    if (!request.betterAuthSession?.session.activeOrganizationId) {
      throw new Error("User not authenticated");
    }

    const storageService = await this.getStorageService(
      request.betterAuthSession.session.activeOrganizationId,
    );
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
    if (!request.betterAuthSession?.session.activeOrganizationId) {
      throw new Error("User not authenticated");
    }

    const storageService = await this.getStorageService(
      request.betterAuthSession.session.activeOrganizationId,
    );

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
    if (!request.betterAuthSession?.user.id || !request.betterAuthSession.session.activeOrganizationId) {
      throw new Error("User not authenticated");
    }

    const storageService = await this.getStorageService(
      request.betterAuthSession.session.activeOrganizationId,
    );

    return await storageService.createFolder(body.name, body.parentId, request.betterAuthSession.user.id);
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
    if (!request.betterAuthSession?.session.activeOrganizationId) {
      throw new Error("User not authenticated");
    }

    const storageService = await this.getStorageService(
      request.betterAuthSession.session.activeOrganizationId,
    );
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
    if (!request.betterAuthSession?.session.activeOrganizationId) {
      throw new Error("User not authenticated");
    }

    const storageService = await this.getStorageService(
      request.betterAuthSession.session.activeOrganizationId,
    );
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
    if (!request.betterAuthSession?.user.id || !request.betterAuthSession.session.activeOrganizationId) {
      throw new Error("User not authenticated");
    }

    const storageService = await this.getStorageService(
      request.betterAuthSession.session.activeOrganizationId,
    );

    return await storageService.getQuota(request.betterAuthSession.user.id);
  }

  /**
   * Get file encryption metadata
   */
  @Get("files/{fileId}/encryption-metadata")
  @Security("jwt")
  public async getFileEncryptionMetadata(@Path() fileId: string): Promise<{
    iv: string;
    authTag: string;
    algorithm: string;
    chunkSize: number;
    keyVersion: number;
  } | null> {
    const context = getServerContext();
    const service = new ClientEncryptionService(context.drizzle);

    const metadata = await service.getFileEncryptionMetadata(fileId);

    if (!metadata) {
      return null;
    }

    return {
      iv: metadata.iv,
      authTag: metadata.authTag,
      algorithm: metadata.algorithm,
      chunkSize: metadata.chunkSize,
      keyVersion: metadata.keyVersion,
    };
  }

  // ============================================================================
  // Chunked Upload Endpoints
  // ============================================================================

  /**
   * Initialize a chunked upload session
   */
  @Post("upload/chunked/init")
  @Security("jwt")
  @SuccessResponse("201", "Chunked upload session initialized")
  public async initChunkedUpload(
    @Request() request: AuthenticatedRequest,
    @Body()
    body: {
      fileName: string;
      fileSize: number;
      mimeType: string;
      totalChunks: number;
      chunkSize: number;
      metadata?: Record<string, unknown>;
    },
  ): Promise<{ uploadId: string; expiresAt: Date }> {
    if (!request.betterAuthSession?.user.id || !request.betterAuthSession.session.activeOrganizationId) {
      throw new Error("User not authenticated");
    }

    const { fileName, fileSize, mimeType, totalChunks, chunkSize, metadata } = body;

    // Validate file size
    const storageConfig = getStorageConfig();
    if (fileSize > storageConfig.maxFileSize) {
      throw new Error(`File size exceeds maximum allowed size of ${storageConfig.maxFileSize} bytes`);
    }

    // Validate chunk size
    if (chunkSize > storageConfig.maxChunkSize) {
      throw new Error(`Chunk size exceeds maximum allowed size of ${storageConfig.maxChunkSize} bytes`);
    }

    const chunkedUploadService = getChunkedUploadServiceInstance();
    const result = await chunkedUploadService.initUpload({
      fileName,
      fileSize,
      mimeType,
      totalChunks,
      chunkSize,
      userId: request.betterAuthSession.user.id,
      organizationId: request.betterAuthSession.session.activeOrganizationId,
      metadata,
    });

    this.setStatus(201);
    return result;
  }

  /**
   * Upload a single chunk
   */
  @Post("upload/chunked/{uploadId}/chunk/{chunkNumber}")
  @Security("jwt")
  @SuccessResponse("200", "Chunk uploaded successfully")
  public async uploadChunk(
    @Path() uploadId: string,
    @Path() chunkNumber: number,
    @UploadedFile() chunk: globalThis.Express.Multer.File,
  ): Promise<{
    success: boolean;
    receivedChunks: number[];
    remainingChunks: number[];
  }> {
    const chunkedUploadService = getChunkedUploadServiceInstance();
    return await chunkedUploadService.uploadChunk(uploadId, chunkNumber, chunk.buffer);
  }

  /**
   * Complete chunked upload and save file
   */
  @Post("upload/chunked/{uploadId}/complete")
  @Security("jwt")
  @SuccessResponse("201", "File uploaded successfully")
  public async completeChunkedUpload(
    @Path() uploadId: string,
    @Request() request: AuthenticatedRequest,
    @Body()
    body?: {
      folderId?: string;
      tags?: string[];
      metadata?: Record<string, unknown>;
    },
  ): Promise<FileMetadata> {
    if (!request.betterAuthSession?.user.id || !request.betterAuthSession.session.activeOrganizationId) {
      throw new Error("User not authenticated");
    }

    const chunkedUploadService = getChunkedUploadServiceInstance();

    // Get upload status to retrieve file info
    const status = chunkedUploadService.getUploadStatus(uploadId);
    if (status.status === "expired" || status.status === "failed") {
      throw new Error(`Upload session ${status.status}`);
    }

    // Assemble chunks
    const assembledFile = await chunkedUploadService.completeUpload(uploadId);

    // Get storage service and save the assembled file
    const storageService = await this.getStorageService(
      request.betterAuthSession.session.activeOrganizationId,
    );

    // Create a mock Multer file object
    const mockFile: globalThis.Express.Multer.File = {
      fieldname: "file",
      originalname: status.fileName,
      encoding: "7bit",
      mimetype:
        status.status === "uploading" || status.status === "completed" ? "application/octet-stream" : "",
      size: status.fileSize,
      buffer: assembledFile,
      stream: null as unknown as Readable,
      destination: "",
      filename: status.fileName,
      path: "",
    };

    const fileMetadata = await storageService.uploadFile(mockFile, {
      folderId: body?.folderId,
      tags: body?.tags,
      metadata: body?.metadata,
      userId: request.betterAuthSession.user.id,
    });

    this.setStatus(201);
    return fileMetadata;
  }

  /**
   * Cancel chunked upload
   */
  @Delete("upload/chunked/{uploadId}/cancel")
  @Security("jwt")
  @SuccessResponse("204", "Upload cancelled")
  public async cancelChunkedUpload(@Path() uploadId: string): Promise<void> {
    const chunkedUploadService = getChunkedUploadServiceInstance();
    await chunkedUploadService.cancelUpload(uploadId);
    this.setStatus(204);
  }

  /**
   * Get chunked upload status
   */
  @Get("upload/chunked/{uploadId}/status")
  @Security("jwt")
  public async getChunkedUploadStatus(@Path() uploadId: string): Promise<{
    uploadId: string;
    fileName: string;
    fileSize: number;
    uploadedBytes: number;
    uploadedChunks: number[];
    totalChunks: number;
    percentage: number;
    status: "pending" | "uploading" | "completed" | "failed" | "expired";
  }> {
    const chunkedUploadService = getChunkedUploadServiceInstance();
    return chunkedUploadService.getUploadStatus(uploadId);
  }
}
