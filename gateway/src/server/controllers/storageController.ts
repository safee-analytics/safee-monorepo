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
} from 'tsoa'
import { StorageService } from '../services/storage.service.js'
import type { Request as ExpressRequest } from 'express'

export interface FileUploadRequest {
  folderId?: string
  tags?: string[]
  metadata?: Record<string, any>
}

export interface FileMetadata {
  id: string
  name: string
  path: string
  size: number
  mimeType: string
  createdAt: string
  modifiedAt: string
  createdBy: string
  modifiedBy?: string
  folderId?: string
  tags?: string[]
  metadata?: Record<string, any>
}

export interface FolderMetadata {
  id: string
  name: string
  path: string
  parentId?: string
  createdAt: string
  modifiedAt: string
  fileCount: number
  subFolderCount: number
}

export interface CreateFolderRequest {
  name: string
  parentId?: string
}

export interface FileSearchParams {
  query?: string
  folderId?: string
  mimeTypes?: string[]
  tags?: string[]
  dateFrom?: string
  dateTo?: string
  createdBy?: string
  limit?: number
  offset?: number
}

@Route('api/v1/storage')
@Tags('Storage')
export class StorageController extends Controller {
  private storageService: StorageService

  constructor() {
    super()
    this.storageService = new StorageService()
  }

  /**
   * Upload a file to storage
   */
  @Post('upload')
  @Security('jwt')
  @SuccessResponse('201', 'File uploaded successfully')
  public async uploadFile(
    @Request() request: ExpressRequest,
    @UploadedFile() file: Express.Multer.File,
    @FormField() folderId?: string,
    @FormField() tags?: string,
    @FormField() metadata?: string
  ): Promise<FileMetadata> {
    const userId = (request as any).user?.id

    if (!file) {
      throw new Error('No file provided')
    }

    return await this.storageService.uploadFile(file, {
      folderId,
      tags: tags ? JSON.parse(tags) : undefined,
      metadata: metadata ? JSON.parse(metadata) : undefined,
      userId,
    })
  }

  /**
   * Upload multiple files
   */
  @Post('upload/batch')
  @Security('jwt')
  @SuccessResponse('201', 'Files uploaded successfully')
  public async uploadFiles(
    @Request() request: ExpressRequest,
    @UploadedFile() files: Express.Multer.File[],
    @FormField() folderId?: string,
    @FormField() tags?: string,
    @FormField() metadata?: string
  ): Promise<FileMetadata[]> {
    const userId = (request as any).user?.id

    if (!files || files.length === 0) {
      throw new Error('No files provided')
    }

    return await this.storageService.uploadFiles(files, {
      folderId,
      tags: tags ? JSON.parse(tags) : undefined,
      metadata: metadata ? JSON.parse(metadata) : undefined,
      userId,
    })
  }

  /**
   * Get file metadata
   */
  @Get('files/{fileId}')
  @Security('jwt')
  public async getFile(@Path() fileId: string): Promise<FileMetadata> {
    return await this.storageService.getFileMetadata(fileId)
  }

  /**
   * Download file
   */
  @Get('files/{fileId}/download')
  @Security('jwt')
  public async downloadFile(
    @Path() fileId: string,
    @Request() request: ExpressRequest
  ): Promise<void> {
    const response = (request as any).res
    await this.storageService.downloadFile(fileId, response)
  }

  /**
   * Delete file
   */
  @Delete('files/{fileId}')
  @Security('jwt')
  @SuccessResponse('204', 'File deleted successfully')
  public async deleteFile(@Path() fileId: string): Promise<void> {
    await this.storageService.deleteFile(fileId)
  }

  /**
   * Search files
   */
  @Get('files/search')
  @Security('jwt')
  public async searchFiles(
    @Query() query?: string,
    @Query() folderId?: string,
    @Query() mimeTypes?: string[],
    @Query() tags?: string[],
    @Query() dateFrom?: string,
    @Query() dateTo?: string,
    @Query() createdBy?: string,
    @Query() limit?: number,
    @Query() offset?: number
  ): Promise<{ files: FileMetadata[]; total: number; hasMore: boolean }> {
    return await this.storageService.searchFiles({
      query,
      folderId,
      mimeTypes,
      tags,
      dateFrom,
      dateTo,
      createdBy,
      limit: limit || 20,
      offset: offset || 0,
    })
  }

  /**
   * Create folder
   */
  @Post('folders')
  @Security('jwt')
  @SuccessResponse('201', 'Folder created successfully')
  public async createFolder(
    @Body() body: CreateFolderRequest,
    @Request() request: ExpressRequest
  ): Promise<FolderMetadata> {
    const userId = (request as any).user?.id
    return await this.storageService.createFolder(body.name, body.parentId, userId)
  }

  /**
   * Get folder contents
   */
  @Get('folders/{folderId}')
  @Security('jwt')
  public async getFolderContents(
    @Path() folderId: string
  ): Promise<{ folder: FolderMetadata; files: FileMetadata[]; subFolders: FolderMetadata[] }> {
    return await this.storageService.getFolderContents(folderId)
  }

  /**
   * Delete folder
   */
  @Delete('folders/{folderId}')
  @Security('jwt')
  @SuccessResponse('204', 'Folder deleted successfully')
  public async deleteFolder(@Path() folderId: string): Promise<void> {
    await this.storageService.deleteFolder(folderId)
  }

  /**
   * Get storage quota information
   */
  @Get('quota')
  @Security('jwt')
  public async getQuota(
    @Request() request: ExpressRequest
  ): Promise<{ used: number; total: number; remaining: number; unit: string }> {
    const userId = (request as any).user?.id
    return await this.storageService.getQuota(userId)
  }
}
