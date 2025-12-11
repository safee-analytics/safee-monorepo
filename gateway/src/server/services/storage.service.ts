import fs from "node:fs/promises";
import path from "node:path";
import { v4 as uuidv4 } from "uuid";
import type { Response } from "express";
import type { FileMetadata, FolderMetadata, FileSearchParams } from "../controllers/storageController.js";
import type { ServerContext } from "../serverContext.js";

export interface UploadOptions {
  folderId?: string;
  tags?: string[];
  metadata?: Record<string, unknown>;
  userId: string;
}

export class StorageService {
  private basePath: string;
  private metadataPath: string;

  constructor(private readonly ctx: ServerContext) {
    // Get storage path from environment or use default
    this.basePath = process.env.NAS_STORAGE_PATH || path.join(process.cwd(), "storage");
    this.metadataPath = path.join(this.basePath, ".metadata");
    this.initializeStorage();
  }

  private get logger() {
    return this.ctx.logger;
  }

  private async initializeStorage(): Promise<void> {
    try {
      await fs.mkdir(this.basePath, { recursive: true });
      await fs.mkdir(this.metadataPath, { recursive: true });
    } catch (err) {
      this.logger.error({ error: err }, "Failed to initialize storage");
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
    const folderPath = options.folderId ? path.join(this.basePath, options.folderId) : this.basePath;

    // Ensure folder exists
    await fs.mkdir(folderPath, { recursive: true });

    // Save file to storage
    const filePath = path.join(folderPath, fileId);
    await fs.writeFile(filePath, file.buffer);

    // Create metadata
    const metadata: FileMetadata = {
      id: fileId,
      name: file.originalname,
      path: filePath,
      size: file.size,
      mimeType: file.mimetype,
      createdAt: new Date().toISOString(),
      modifiedAt: new Date().toISOString(),
      createdBy: options.userId,
      folderId: options.folderId,
      tags: options.tags,
      metadata: options.metadata,
    };

    // Save metadata
    await this.saveMetadata(fileId, metadata);

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
    const metadataFile = path.join(this.metadataPath, `${fileId}.json`);

    try {
      const data = await fs.readFile(metadataFile, "utf-8");
      return JSON.parse(data);
    } catch (err) {
      this.logger.debug({ error: err, fileId }, "File not found");
      throw new Error(`File not found: ${fileId}`);
    }
  }

  /**
   * Download file
   */
  public async downloadFile(fileId: string, response: Response): Promise<void> {
    const metadata = await this.getFileMetadata(fileId);
    const fileBuffer = await fs.readFile(metadata.path);

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

    // Delete file
    await fs.unlink(metadata.path);

    // Delete metadata
    const metadataFile = path.join(this.metadataPath, `${fileId}.json`);
    await fs.unlink(metadataFile);
  }

  /**
   * Search files
   */
  public async searchFiles(
    params: FileSearchParams,
  ): Promise<{ files: FileMetadata[]; total: number; hasMore: boolean }> {
    const allMetadataFiles = await fs.readdir(this.metadataPath);

    const filesMetadata: FileMetadata[] = [];

    for (const metaFile of allMetadataFiles) {
      if (!metaFile.endsWith(".json") || metaFile.startsWith("folder_")) continue;

      try {
        const data = await fs.readFile(path.join(this.metadataPath, metaFile), "utf-8");
        const metadata: FileMetadata = JSON.parse(data);

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
        this.logger.error({ error: err, metaFile }, "Error reading metadata file");
      }
    }

    // Sort by modified date (newest first)
    filesMetadata.sort((a, b) => new Date(b.modifiedAt).getTime() - new Date(a.modifiedAt).getTime());

    // Pagination
    const limit = params.limit || 20;
    const offset = params.offset || 0;
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
    const folderPath = parentId
      ? path.join(this.basePath, parentId, folderId)
      : path.join(this.basePath, folderId);

    await fs.mkdir(folderPath, { recursive: true });

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
    const metadataFile = path.join(this.metadataPath, `folder_${folderId}.json`);
    await fs.writeFile(metadataFile, JSON.stringify(metadata, null, 2));

    return metadata;
  }

  /**
   * Get folder contents
   */
  public async getFolderContents(
    folderId: string,
  ): Promise<{ folder: FolderMetadata; files: FileMetadata[]; subFolders: FolderMetadata[] }> {
    // Get folder metadata
    const metadataFile = path.join(this.metadataPath, `folder_${folderId}.json`);
    const folderData = await fs.readFile(metadataFile, "utf-8");
    const folder: FolderMetadata = JSON.parse(folderData);

    // Get files in folder
    const searchResult = await this.searchFiles({ folderId });

    // Get subfolders
    const allMetadataFiles = await fs.readdir(this.metadataPath);
    const subFolders: FolderMetadata[] = [];

    for (const metaFile of allMetadataFiles) {
      if (!metaFile.startsWith("folder_") || !metaFile.endsWith(".json")) continue;

      try {
        const data = await fs.readFile(path.join(this.metadataPath, metaFile), "utf-8");
        const folderMetadata: FolderMetadata = JSON.parse(data);

        if (folderMetadata.parentId === folderId) {
          subFolders.push(folderMetadata);
        }
      } catch (err) {
        this.logger.error({ error: err, metaFile }, "Error reading folder metadata");
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

    // Delete folder directory
    await fs.rm(folder.path, { recursive: true, force: true });

    // Delete folder metadata
    const metadataFile = path.join(this.metadataPath, `folder_${folderId}.json`);
    await fs.unlink(metadataFile);
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

    // Get total quota from config (default 100GB)
    const total = parseInt(process.env.STORAGE_QUOTA_BYTES || "107374182400", 10);

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
    const metadataFile = path.join(this.metadataPath, `${fileId}.json`);
    await fs.writeFile(metadataFile, JSON.stringify(metadata, null, 2));
  }
}
