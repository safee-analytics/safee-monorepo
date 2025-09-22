import {
  BlobServiceClient,
  ContainerClient,
  BlobSASPermissions,
  generateBlobSASQueryParameters,
  StorageSharedKeyCredential,
  ContainerCreateOptions,
  RestError,
  StorageRetryOptions,
  StorageRetryPolicyType,
} from "@azure/storage-blob";
import type { Storage, StorageMetadata, StorageResult } from "./storage.js";
import { logger } from "../logger.js";

export interface AzureBlobStorageOptions {
  connectionString?: string;
  accountName?: string;
  accountKey?: string;
  sasToken?: string;
  retryOptions?: StorageRetryOptions;
  containerCreateOptions?: ContainerCreateOptions;
}

export class AzureBlobStorage implements Storage {
  private blobServiceClient: BlobServiceClient;
  private containerClient: ContainerClient;
  private containerName: string;
  private credential: StorageSharedKeyCredential | null = null;

  constructor(containerName: string, options: AzureBlobStorageOptions | string) {
    if (!containerName) {
      throw new Error("Container name is required");
    }

    this.containerName = containerName;

    if (typeof options === "string") {
      if (!options) {
        throw new Error("Azure Blob Storage connection string is required");
      }
      this.blobServiceClient = this.createClientFromConnectionString(options);
    } else {
      this.blobServiceClient = this.createClientFromOptions(options);
    }

    this.containerClient = this.blobServiceClient.getContainerClient(containerName);
  }

  private createClientFromConnectionString(connectionString: string): BlobServiceClient {
    try {
      const params = this.parseConnectionString(connectionString);
      if (params.accountName && params.accountKey) {
        this.credential = new StorageSharedKeyCredential(params.accountName, params.accountKey);
      }

      return BlobServiceClient.fromConnectionString(connectionString, {
        retryOptions: {
          retryPolicyType: StorageRetryPolicyType.EXPONENTIAL,
          maxTries: 3,
          tryTimeoutInMs: 30000,
          retryDelayInMs: 1000,
          maxRetryDelayInMs: 10000,
        },
      });
    } catch (err) {
      logger.error(
        { error: err, connectionString: "***" },
        "Failed to create Azure Blob Service Client from connection string",
      );
      throw new Error("Invalid Azure Blob Storage connection string");
    }
  }

  private createClientFromOptions(options: AzureBlobStorageOptions): BlobServiceClient {
    const { accountName, accountKey, sasToken, retryOptions } = options;

    if (!accountName) {
      throw new Error("Account name is required when not using connection string");
    }

    const defaultRetryOptions: StorageRetryOptions = {
      retryPolicyType: StorageRetryPolicyType.EXPONENTIAL,
      maxTries: 3,
      tryTimeoutInMs: 30000,
      retryDelayInMs: 1000,
      maxRetryDelayInMs: 10000,
      ...retryOptions,
    };

    try {
      if (accountKey) {
        this.credential = new StorageSharedKeyCredential(accountName, accountKey);
        const accountUrl = `https://${accountName}.blob.core.windows.net`;
        return new BlobServiceClient(accountUrl, this.credential, { retryOptions: defaultRetryOptions });
      } else if (sasToken) {
        const accountUrl = `https://${accountName}.blob.core.windows.net`;
        return new BlobServiceClient(`${accountUrl}?${sasToken}`, undefined, {
          retryOptions: defaultRetryOptions,
        });
      }
      const accountUrl = `https://${accountName}.blob.core.windows.net`;
      return new BlobServiceClient(accountUrl, undefined, { retryOptions: defaultRetryOptions });
    } catch (err) {
      logger.error({ error: err, accountName }, "Failed to create Azure Blob Service Client from options");
      throw new Error("Failed to initialize Azure Blob Storage client");
    }
  }

  private parseConnectionString(connectionString: string): Record<string, string> {
    const params: Record<string, string> = {};
    for (const param of connectionString.split(";")) {
      const [key, value] = param.split("=");
      if (key && value) {
        params[key] = value;
      }
    }
    return params;
  }

  async saveFile(path: string, data: Buffer, metadata?: StorageMetadata): Promise<StorageResult> {
    logger.debug(
      { path, container: this.containerName, size: data.length },
      "Saving file to Azure Blob Storage",
    );

    try {
      await this.containerClient.createIfNotExists({
        access: "blob",
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

      if (err instanceof RestError) {
        throw new Error(`Failed to save file to Azure Blob Storage: ${err.message} (${err.statusCode})`);
      }

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

      if (err instanceof RestError && err.statusCode === 404) {
        throw new Error(`File not found: ${path}`);
      }

      if (err instanceof RestError) {
        throw new Error(`Failed to get file from Azure Blob Storage: ${err.message} (${err.statusCode})`);
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
      if (err instanceof RestError && err.statusCode === 404) {
        return false;
      }

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

      if (err instanceof RestError) {
        throw new Error(`Failed to delete file from Azure Blob Storage: ${err.message} (${err.statusCode})`);
      }

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

      if (err instanceof RestError && err.statusCode === 404) {
        throw new Error(`File not found: ${path}`);
      }

      if (err instanceof RestError) {
        throw new Error(
          `Failed to get file metadata from Azure Blob Storage: ${err.message} (${err.statusCode})`,
        );
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

      if (err instanceof RestError) {
        throw new Error(`Failed to list files from Azure Blob Storage: ${err.message} (${err.statusCode})`);
      }

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

      // Only generate SAS token if we have credentials available
      if (!this.credential) {
        throw new Error("Cannot generate signed URL without account key credentials");
      }

      const sasToken = generateBlobSASQueryParameters(
        {
          containerName: this.containerName,
          blobName: path,
          permissions: BlobSASPermissions.parse("r"), // read permission
          startsOn: new Date(),
          expiresOn: new Date(Date.now() + expiresIn * 1000),
        },
        this.credential,
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

      if (err instanceof RestError) {
        throw new Error(
          `Failed to generate signed URL for Azure Blob Storage: ${err.message} (${err.statusCode})`,
        );
      }

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

      if (err instanceof RestError && err.statusCode === 404) {
        throw new Error(`Source file not found: ${sourcePath}`);
      }

      if (err instanceof RestError) {
        throw new Error(`Failed to copy file in Azure Blob Storage: ${err.message} (${err.statusCode})`);
      }

      const message = err instanceof Error ? err.message : String(err);
      throw new Error(`Failed to copy file in Azure Blob Storage: ${message}`);
    }
  }

  private async streamToBuffer(readableStream: NodeJS.ReadableStream): Promise<Buffer> {
    return new Promise((resolve, reject) => {
      const chunks: Uint8Array[] = [];
      let totalLength = 0;

      const timeout = setTimeout(() => {
        reject(new Error("Stream timeout: failed to read data within 60 seconds"));
      }, 60000);

      readableStream.on("data", (data: Uint8Array) => {
        chunks.push(data);
        totalLength += data.length;

        if (totalLength > 500 * 1024 * 1024) {
          // 500MB limit
          clearTimeout(timeout);
          reject(new Error("Stream size exceeded maximum limit of 500MB"));
        }
      });

      readableStream.on("end", () => {
        clearTimeout(timeout);
        resolve(Buffer.concat(chunks));
      });

      readableStream.on("error", (error) => {
        clearTimeout(timeout);
        reject(error instanceof Error ? error : new Error(String(error)));
      });

      readableStream.on("close", () => {
        clearTimeout(timeout);
      });
    });
  }

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
      avif: "image/avif",
      heic: "image/heic",
      heif: "image/heif",

      // Documents
      pdf: "application/pdf",
      doc: "application/msword",
      docx: "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
      xls: "application/vnd.ms-excel",
      xlsx: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
      ppt: "application/vnd.ms-powerpoint",
      pptx: "application/vnd.openxmlformats-officedocument.presentationml.presentation",
      odt: "application/vnd.oasis.opendocument.text",
      ods: "application/vnd.oasis.opendocument.spreadsheet",
      odp: "application/vnd.oasis.opendocument.presentation",

      // Text files
      txt: "text/plain",
      rtf: "application/rtf",
      csv: "text/csv",
      json: "application/json",
      xml: "application/xml",
      html: "text/html",
      htm: "text/html",
      css: "text/css",
      js: "application/javascript",
      jsx: "application/javascript",
      ts: "application/typescript",
      tsx: "application/typescript",
      md: "text/markdown",
      yaml: "application/x-yaml",
      yml: "application/x-yaml",

      // Archives
      zip: "application/zip",
      rar: "application/x-rar-compressed",
      "7z": "application/x-7z-compressed",
      tar: "application/x-tar",
      gz: "application/gzip",
      bz2: "application/x-bzip2",
      xz: "application/x-xz",

      // Audio/Video
      mp3: "audio/mpeg",
      wav: "audio/wav",
      flac: "audio/flac",
      aac: "audio/aac",
      ogg: "audio/ogg",
      m4a: "audio/mp4",
      mp4: "video/mp4",
      avi: "video/x-msvideo",
      mov: "video/quicktime",
      wmv: "video/x-ms-wmv",
      flv: "video/x-flv",
      webm: "video/webm",
      mkv: "video/x-matroska",

      // Fonts
      ttf: "font/ttf",
      otf: "font/otf",
      woff: "font/woff",
      woff2: "font/woff2",
      eot: "application/vnd.ms-fontobject",
    };

    return contentTypes[extension ?? ""] ?? "application/octet-stream";
  }
}
