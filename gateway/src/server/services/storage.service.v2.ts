import { v4 as uuidv4 } from "uuid";
import type { Response } from "express";
import type { FileMetadata, FolderMetadata, FileSearchParams } from "../controllers/storageController.js";
import { logger } from "../utils/logger.js";
import { StorageFactory } from "./storage/storage-factory.js";
import type { StorageAdapter } from "./storage/storage-adapter.interface.js";

export interface UploadOptions {
  folderId?: string;
  tags?: string[];
  metadata?: Record<string, unknown>;
  userId: string;
}

/**
 * Storage Service V2
 * Supports multiple storage backends: Local, WebDAV, SMB
 */
export class StorageServiceV2 {
  private adapter: StorageAdapter;
  private metadataAdapter: StorageAdapter; // Store metadata separately

  constructor(adapter?: StorageAdapter) {
    // Use provided adapter or create from environment
    this.adapter = adapter ?? StorageFactory.createFromEnv();

    // Metadata always stored locally for fast access
    this.metadataAdapter = StorageFactory.createAdapter({
      type: "local",
      basePath: process.env.METADATA_PATH ?? "./storage/.metadata",
    });

    this.initializeStorage();
  }

  private async initializeStorage(): Promise<void> {
    try {
      await this.adapter.mkdir("/");
      await this.metadataAdapter.mkdir("/");
      logger.info("Storage initialized successfully");
    } catch (err) {
      logger.error({ error: err }, "Failed to initialize storage");
    }
  }

  /**
   * Upload a single file
   */
  public async uploadFile(
    file: globalThis.Express.Multer.File,
    options: UploadOptions,
  ): Promise<FileMetadata> {
    const fileId = uuidv4();
    const storagePath = options.folderId ? `${options.folderId}/${fileId}` : fileId;

    // Upload file to storage backend
    await this.adapter.upload(storagePath, file.buffer);

    // Create metadata
    const metadata: FileMetadata = {
      id: fileId,
      name: file.originalname,
      path: storagePath,
      size: file.size,
      mimeType: file.mimetype,
      createdAt: new Date().toISOString(),
      modifiedAt: new Date().toISOString(),
      createdBy: options.userId,
      folderId: options.folderId,
      tags: options.tags,
      metadata: options.metadata,
    };

    // Save metadata locally for fast querying
    await this.saveMetadata(fileId, metadata);

    logger.info({ fileId, fileName: file.originalname, size: file.size }, "File uploaded successfully");

    return metadata;
  }

  /**
   * Upload multiple files
   */
  public async uploadFiles(
    files: globalThis.Express.Multer.File[],
    options: UploadOptions,
  ): Promise<FileMetadata[]> {
    const uploadPromises = files.map((file) => this.uploadFile(file, options));
    return await Promise.all(uploadPromises);
  }

  /**
   * Get file metadata
   */
  public async getFileMetadata(fileId: string): Promise<FileMetadata> {
    try {
      const metadataBuffer = await this.metadataAdapter.download(`${fileId}.json`);
      return JSON.parse(metadataBuffer.toString("utf-8"));
    } catch (err) {
      logger.debug({ error: err, fileId }, "File not found");
      throw new Error(`File not found: ${fileId}`);
    }
  }

  /**
   * Download file
   */
  public async downloadFile(fileId: string, response: Response): Promise<void> {
    const metadata = await this.getFileMetadata(fileId);
    const fileBuffer = await this.adapter.download(metadata.path);

    response.setHeader("Content-Type", metadata.mimeType);
    response.setHeader("Content-Disposition", `attachment; filename="${metadata.name}"`);
    response.setHeader("Content-Length", metadata.size);
    response.send(fileBuffer);
  }

  /**
   * Delete file
   */
  public async deleteFile(fileId: string): Promise<void> {
    const metadata = await this.getFileMetadata(fileId);

    // Delete from storage
    await this.adapter.delete(metadata.path);

    // Delete metadata
    await this.metadataAdapter.delete(`${fileId}.json`);

    logger.info({ fileId }, "File deleted successfully");
  }

  /**
   * Search files
   */
  public async searchFiles(
    params: FileSearchParams,
  ): Promise<{ files: FileMetadata[]; total: number; hasMore: boolean }> {
    const allMetadataFiles = await this.metadataAdapter.list("/");
    const filesMetadata: FileMetadata[] = [];

    for (const metaFile of allMetadataFiles) {
      if (!metaFile.endsWith(".json") || metaFile.startsWith("folder_")) continue;

      try {
        const data = await this.metadataAdapter.download(metaFile);
        const metadata: FileMetadata = JSON.parse(data.toString("utf-8"));

        // Apply filters
        if (params.query && !metadata.name.toLowerCase().includes(params.query.toLowerCase())) {
          continue;
        }

        if (params.folderId && metadata.folderId !== params.folderId) {
          continue;
        }

        if (params.mimeTypes && !params.mimeTypes.includes(metadata.mimeType)) {
          continue;
        }

        if (params.tags && !params.tags.some((tag: string) => metadata.tags?.includes(tag))) {
          continue;
        }

        if (params.createdBy && metadata.createdBy !== params.createdBy) {
          continue;
        }

        if (params.dateFrom && new Date(metadata.createdAt) < new Date(params.dateFrom)) {
          continue;
        }

        if (params.dateTo && new Date(metadata.createdAt) > new Date(params.dateTo)) {
          continue;
        }

        filesMetadata.push(metadata);
      } catch (err) {
        logger.error({ error: err, metaFile }, "Error reading metadata file");
      }
    }

    // Sort by modified date (newest first)
    filesMetadata.sort((a, b) => new Date(b.modifiedAt).getTime() - new Date(a.modifiedAt).getTime());

    // Pagination
    const limit = params.limit ?? 20;
    const offset = params.offset ?? 0;
    const paginatedFiles = filesMetadata.slice(offset, offset + limit);

    return {
      files: paginatedFiles,
      total: filesMetadata.length,
      hasMore: offset + limit < filesMetadata.length,
    };
  }

  /**
   * Create folder
   */
  public async createFolder(
    name: string,
    parentId: string | undefined,
    userId: string,
  ): Promise<FolderMetadata> {
    const folderId = uuidv4();
    const folderPath = parentId ? `${parentId}/${folderId}` : folderId;

    await this.adapter.mkdir(folderPath);

    const metadata: FolderMetadata = {
      id: folderId,
      name,
      path: folderPath,
      parentId,
      createdAt: new Date().toISOString(),
      modifiedAt: new Date().toISOString(),
      createdBy: userId,
      fileCount: 0,
      subFolderCount: 0,
    };

    // Save folder metadata
    const metadataBuffer = Buffer.from(JSON.stringify(metadata, null, 2));
    await this.metadataAdapter.upload(`folder_${folderId}.json`, metadataBuffer);

    logger.info({ folderId, name }, "Folder created successfully");

    return metadata;
  }

  /**
   * Get folder contents
   */
  public async getFolderContents(
    folderId: string,
  ): Promise<{ folder: FolderMetadata; files: FileMetadata[]; subFolders: FolderMetadata[] }> {
    // Get folder metadata
    const folderData = await this.metadataAdapter.download(`folder_${folderId}.json`);
    const folder: FolderMetadata = JSON.parse(folderData.toString("utf-8"));

    // Get files in folder
    const searchResult = await this.searchFiles({ folderId });

    // Get subfolders
    const allMetadataFiles = await this.metadataAdapter.list("/");
    const subFolders: FolderMetadata[] = [];

    for (const metaFile of allMetadataFiles) {
      if (!metaFile.startsWith("folder_") || !metaFile.endsWith(".json")) continue;

      try {
        const data = await this.metadataAdapter.download(metaFile);
        const folderMetadata: FolderMetadata = JSON.parse(data.toString("utf-8"));

        if (folderMetadata.parentId === folderId) {
          subFolders.push(folderMetadata);
        }
      } catch (err) {
        logger.error({ error: err, metaFile }, "Error reading folder metadata");
      }
    }

    return {
      folder,
      files: searchResult.files,
      subFolders,
    };
  }

  /**
   * Delete folder
   */
  public async deleteFolder(folderId: string): Promise<void> {
    const { folder, files, subFolders } = await this.getFolderContents(folderId);

    // Delete all files in folder
    for (const file of files) {
      await this.deleteFile(file.id);
    }

    // Delete all subfolders
    for (const subFolder of subFolders) {
      await this.deleteFolder(subFolder.id);
    }

    // Delete folder in storage
    await this.adapter.delete(folder.path);

    // Delete folder metadata
    await this.metadataAdapter.delete(`folder_${folderId}.json`);

    logger.info({ folderId }, "Folder deleted successfully");
  }

  /**
   * Get storage quota
   */
  public async getQuota(
    userId: string,
  ): Promise<{ used: number; total: number; remaining: number; unit: string }> {
    // Calculate used space
    let used = 0;
    const searchResult = await this.searchFiles({ createdBy: userId, limit: 10000 });

    for (const file of searchResult.files) {
      used += file.size;
    }

    // Get storage stats from adapter
    const stats = await this.adapter.getStats();

    // If adapter doesn't provide stats, use default
    const total = stats.total || parseInt(process.env.STORAGE_QUOTA_BYTES ?? "107374182400", 10);

    return {
      used,
      total,
      remaining: total - used,
      unit: "bytes",
    };
  }

  /**
   * Save metadata to file
   */
  private async saveMetadata(fileId: string, metadata: FileMetadata): Promise<void> {
    const metadataBuffer = Buffer.from(JSON.stringify(metadata, null, 2));
    await this.metadataAdapter.upload(`${fileId}.json`, metadataBuffer);
  }
}
