import {
  BlobServiceClient,
  ContainerClient,
  BlobSASPermissions,
  generateBlobSASQueryParameters,
  StorageSharedKeyCredential,
} from "@azure/storage-blob";
import type { Storage, StorageMetadata, StorageResult } from "./storage.js";
import { logger } from "../logger.js";

export class AzureBlobStorage implements Storage {
  private static blobServiceClient: BlobServiceClient | null = null;
  private containerClient: ContainerClient;
  private containerName: string;
  private accountName: string;
  private accountKey: string;

  constructor(containerName: string, connectionString?: string) {
    if (!connectionString) {
      throw new Error("Azure Blob Storage connection string is required");
    }

    // Parse connection string to extract account name and key for SAS generation
    const connectionParams = new URLSearchParams(connectionString.replace(/;/g, "&"));
    this.accountName = connectionParams.get("AccountName") ?? "";
    this.accountKey = connectionParams.get("AccountKey") ?? "";

    AzureBlobStorage.blobServiceClient ??= BlobServiceClient.fromConnectionString(connectionString);
    this.containerName = containerName;
    this.containerClient = AzureBlobStorage.blobServiceClient.getContainerClient(containerName);
  }

  async saveFile(path: string, data: Buffer, metadata?: StorageMetadata): Promise<StorageResult> {
    logger.debug(
      { path, container: this.containerName, size: data.length },
      "Saving file to Azure Blob Storage",
    );

    try {
      // Ensure container exists
      await this.containerClient.createIfNotExists({
        access: "blob", // Allow public read access to blobs
      });

      const blobClient = this.containerClient.getBlockBlobClient(path);

      const blobHTTPHeaders = {
        blobContentType: metadata?.contentType ?? this.getContentType(path),
      };

      if (metadata?.cacheControl)
        (blobHTTPHeaders as unknown as { blobCacheControl: string }).blobCacheControl = metadata.cacheControl;
      if (metadata?.contentDisposition)
        (blobHTTPHeaders as unknown as { blobContentDisposition: string }).blobContentDisposition =
          metadata.contentDisposition;
      if (metadata?.contentEncoding)
        (blobHTTPHeaders as unknown as { blobContentEncoding: string }).blobContentEncoding =
          metadata.contentEncoding;

      const uploadResult = await blobClient.uploadData(data, {
        blobHTTPHeaders,
        metadata: metadata?.metadata ?? undefined,
      });

      const result: StorageResult = {
        key: path,
        bucket: this.containerName,
        url: blobClient.url,
        size: data.length,
        etag: uploadResult.etag,
        lastModified: uploadResult.lastModified,
      };

      logger.debug(
        { path, container: this.containerName, url: result.url },
        "File saved to Azure Blob Storage",
      );
      return result;
    } catch (err) {
      logger.error(
        { error: err, path, container: this.containerName },
        "Error saving file to Azure Blob Storage",
      );
      const message = err instanceof Error ? err.message : String(err);
      throw new Error(`Failed to save file to Azure Blob Storage: ${message}`);
    }
  }

  async getFile(path: string): Promise<Buffer> {
    logger.debug({ path, container: this.containerName }, "Getting file from Azure Blob Storage");

    try {
      const blobClient = this.containerClient.getBlockBlobClient(path);
      const downloadResponse = await blobClient.download();

      if (!downloadResponse.readableStreamBody) {
        throw new Error("No readable stream available");
      }

      const buffer = await this.streamToBuffer(downloadResponse.readableStreamBody);

      logger.debug(
        { path, container: this.containerName, size: buffer.length },
        "File retrieved from Azure Blob Storage",
      );
      return buffer;
    } catch (err) {
      logger.error(
        { error: err, path, container: this.containerName },
        "Error getting file from Azure Blob Storage",
      );

      if (err && typeof err === "object" && "statusCode" in err && err.statusCode === 404) {
        throw new Error(`File not found: ${path}`);
      }

      const message = err instanceof Error ? err.message : String(err);
      throw new Error(`Failed to get file from Azure Blob Storage: ${message}`);
    }
  }

  async fileExists(path: string): Promise<boolean> {
    logger.debug({ path, container: this.containerName }, "Checking if file exists in Azure Blob Storage");

    try {
      const blobClient = this.containerClient.getBlockBlobClient(path);
      const exists = await blobClient.exists();

      logger.debug({ path, container: this.containerName, exists }, "File existence check completed");
      return exists;
    } catch (err) {
      logger.error(
        { error: err, path, container: this.containerName },
        "Error checking file existence in Azure Blob Storage",
      );
      return false;
    }
  }

  async deleteFile(path: string): Promise<void> {
    logger.debug({ path, container: this.containerName }, "Deleting file from Azure Blob Storage");

    try {
      const blobClient = this.containerClient.getBlockBlobClient(path);
      await blobClient.deleteIfExists();

      logger.debug({ path, container: this.containerName }, "File deleted from Azure Blob Storage");
    } catch (err) {
      logger.error(
        { error: err, path, container: this.containerName },
        "Error deleting file from Azure Blob Storage",
      );
      const message = err instanceof Error ? err.message : String(err);
      throw new Error(`Failed to delete file from Azure Blob Storage: ${message}`);
    }
  }

  async getFileMetadata(path: string): Promise<StorageResult> {
    logger.debug({ path, container: this.containerName }, "Getting file metadata from Azure Blob Storage");

    try {
      const blobClient = this.containerClient.getBlockBlobClient(path);
      const properties = await blobClient.getProperties();

      const result: StorageResult = {
        key: path,
        bucket: this.containerName,
        url: blobClient.url,
        size: properties.contentLength,
        etag: properties.etag,
        lastModified: properties.lastModified,
      };

      logger.debug(
        { path, container: this.containerName, metadata: result },
        "File metadata retrieved from Azure Blob Storage",
      );
      return result;
    } catch (err) {
      logger.error(
        { error: err, path, container: this.containerName },
        "Error getting file metadata from Azure Blob Storage",
      );

      if (err && typeof err === "object" && "statusCode" in err && err.statusCode === 404) {
        throw new Error(`File not found: ${path}`);
      }

      const message = err instanceof Error ? err.message : String(err);
      throw new Error(`Failed to get file metadata from Azure Blob Storage: ${message}`);
    }
  }

  async listFiles(prefix?: string, limit = 1000): Promise<StorageResult[]> {
    logger.debug({ prefix, limit, container: this.containerName }, "Listing files from Azure Blob Storage");

    try {
      const results: StorageResult[] = [];
      const listOptions = { prefix };

      for await (const blob of this.containerClient.listBlobsFlat(listOptions as never)) {
        if (results.length >= limit) {
          break;
        }

        results.push({
          key: blob.name,
          bucket: this.containerName,
          url: this.containerClient.getBlockBlobClient(blob.name).url,
          size: blob.properties.contentLength,
          etag: blob.properties.etag,
          lastModified: blob.properties.lastModified,
        });
      }

      logger.debug(
        { prefix, container: this.containerName, count: results.length },
        "Files listed from Azure Blob Storage",
      );
      return results;
    } catch (err) {
      logger.error(
        { error: err, prefix, container: this.containerName },
        "Error listing files from Azure Blob Storage",
      );
      const message = err instanceof Error ? err.message : String(err);
      throw new Error(`Failed to list files from Azure Blob Storage: ${message}`);
    }
  }

  async getSignedUrl(path: string, expiresIn = 3600): Promise<string> {
    logger.debug(
      { path, container: this.containerName, expiresIn },
      "Generating signed URL for Azure Blob Storage",
    );

    try {
      const blobClient = this.containerClient.getBlockBlobClient(path);

      // Generate SAS token
      const sasToken = generateBlobSASQueryParameters(
        {
          containerName: this.containerName,
          blobName: path,
          permissions: BlobSASPermissions.parse("r"), // read permission
          startsOn: new Date(),
          expiresOn: new Date(Date.now() + expiresIn * 1000),
        },
        new StorageSharedKeyCredential(this.accountName, this.accountKey),
      );

      const signedUrl = `${blobClient.url}?${sasToken.toString()}`;

      logger.debug(
        { path, container: this.containerName, expiresIn },
        "Signed URL generated for Azure Blob Storage",
      );
      return signedUrl;
    } catch (err) {
      logger.error(
        { error: err, path, container: this.containerName },
        "Error generating signed URL for Azure Blob Storage",
      );
      const message = err instanceof Error ? err.message : String(err);
      throw new Error(`Failed to generate signed URL for Azure Blob Storage: ${message}`);
    }
  }

  async copyFile(sourcePath: string, destinationPath: string): Promise<StorageResult> {
    logger.debug(
      { sourcePath, destinationPath, container: this.containerName },
      "Copying file in Azure Blob Storage",
    );

    try {
      const sourceBlobClient = this.containerClient.getBlockBlobClient(sourcePath);
      const destBlobClient = this.containerClient.getBlockBlobClient(destinationPath);

      const copyResult = await destBlobClient.syncCopyFromURL(sourceBlobClient.url);

      if (copyResult.copyStatus !== "success") {
        throw new Error(`Copy operation failed with status: ${copyResult.copyStatus}`);
      }

      const result = await this.getFileMetadata(destinationPath);

      logger.debug(
        { sourcePath, destinationPath, container: this.containerName },
        "File copied in Azure Blob Storage",
      );
      return result;
    } catch (err) {
      logger.error(
        { error: err, sourcePath, destinationPath, container: this.containerName },
        "Error copying file in Azure Blob Storage",
      );

      if (err && typeof err === "object" && "statusCode" in err && err.statusCode === 404) {
        throw new Error(`Source file not found: ${sourcePath}`);
      }

      const message = err instanceof Error ? err.message : String(err);
      throw new Error(`Failed to copy file in Azure Blob Storage: ${message}`);
    }
  }

  /**
   * Convert stream to buffer
   */
  private async streamToBuffer(readableStream: NodeJS.ReadableStream): Promise<Buffer> {
    return new Promise((resolve, reject) => {
      const chunks: Uint8Array[] = [];
      readableStream.on("data", (data: Uint8Array) => {
        chunks.push(data);
      });
      readableStream.on("end", () => {
        resolve(Buffer.concat(chunks));
      });
      readableStream.on("error", reject);
    });
  }

  /**
   * Get content type based on file extension
   */
  private getContentType(path: string): string {
    const extension = path.split(".").pop()?.toLowerCase();

    const contentTypes: Record<string, string> = {
      // Images
      jpg: "image/jpeg",
      jpeg: "image/jpeg",
      png: "image/png",
      gif: "image/gif",
      webp: "image/webp",
      svg: "image/svg+xml",
      ico: "image/x-icon",
      bmp: "image/bmp",
      tiff: "image/tiff",
      tif: "image/tiff",

      // Documents
      pdf: "application/pdf",
      doc: "application/msword",
      docx: "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
      xls: "application/vnd.ms-excel",
      xlsx: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
      ppt: "application/vnd.ms-powerpoint",
      pptx: "application/vnd.openxmlformats-officedocument.presentationml.presentation",

      // Text files
      txt: "text/plain",
      rtf: "application/rtf",
      csv: "text/csv",
      json: "application/json",
      xml: "application/xml",

      // Archives
      zip: "application/zip",
      rar: "application/x-rar-compressed",
      "7z": "application/x-7z-compressed",
      tar: "application/x-tar",
      gz: "application/gzip",

      // Audio/Video
      mp3: "audio/mpeg",
      wav: "audio/wav",
      mp4: "video/mp4",
      avi: "video/x-msvideo",
    };

    return contentTypes[extension ?? ""] ?? "application/octet-stream";
  }
}
