import { Bucket, Storage, File } from "@google-cloud/storage";
import type { Storage as StorageInterface, StorageMetadata, StorageResult } from "./storage.js";
import { logger } from "../logger.js";

export interface GoogleCloudStorageConfig {
  projectId?: string;
  keyFilename?: string;
}

export class GoogleCloudStorage implements StorageInterface {
  private static storage: Storage | null = null;
  private bucket: Bucket;
  private bucketName: string;

  constructor(bucketName: string, config: GoogleCloudStorageConfig = {}) {
    GoogleCloudStorage.storage ??= new Storage({
      projectId: config.projectId,
      keyFilename: config.keyFilename,
    });

    this.bucketName = bucketName;
    this.bucket = GoogleCloudStorage.storage.bucket(bucketName);
  }

  async saveFile(path: string, data: Buffer, metadata?: StorageMetadata): Promise<StorageResult> {
    logger.debug({ path, bucket: this.bucketName, size: data.length }, "Saving file to Google Cloud Storage");

    try {
      const file = this.bucket.file(path);

      const options = {
        metadata: {
          contentType: metadata?.contentType ?? this.getContentType(path),
          cacheControl: metadata?.cacheControl,
          contentDisposition: metadata?.contentDisposition,
          contentEncoding: metadata?.contentEncoding,
          metadata: metadata?.metadata ?? {},
        },
        resumable: data.length > 5 * 1024 * 1024, // Use resumable upload for files > 5MB
        validation: "crc32c", // Enable data validation
      };

      await file.save(data, options);

      const [fileMetadata] = await file.getMetadata();

      const result: StorageResult = {
        key: path,
        bucket: this.bucketName,
        url: file.publicUrl(),
        size: typeof fileMetadata.size === "number" ? fileMetadata.size : parseInt(fileMetadata.size ?? "0"),
        etag: fileMetadata.etag,
        lastModified: fileMetadata.updated ? new Date(fileMetadata.updated) : undefined,
      };

      logger.debug({ path, bucket: this.bucketName, url: result.url }, "File saved to Google Cloud Storage");
      return result;
    } catch (err) {
      logger.error(
        { error: err, path, bucket: this.bucketName },
        "Error saving file to Google Cloud Storage",
      );
      const message = err instanceof Error ? err.message : String(err);
      throw new Error(`Failed to save file to Google Cloud Storage: ${message}`);
    }
  }

  async getFile(path: string): Promise<Buffer> {
    logger.debug({ path, bucket: this.bucketName }, "Getting file from Google Cloud Storage");

    try {
      const file = this.bucket.file(path);
      const [buffer] = await file.download();

      logger.debug(
        { path, bucket: this.bucketName, size: buffer.length },
        "File retrieved from Google Cloud Storage",
      );
      return buffer;
    } catch (err) {
      logger.error(
        { error: err, path, bucket: this.bucketName },
        "Error getting file from Google Cloud Storage",
      );

      if (err && typeof err === "object" && "code" in err && err.code === 404) {
        throw new Error(`File not found: ${path}`);
      }

      const message = err instanceof Error ? err.message : String(err);
      throw new Error(`Failed to get file from Google Cloud Storage: ${message}`);
    }
  }

  async fileExists(path: string): Promise<boolean> {
    logger.debug({ path, bucket: this.bucketName }, "Checking if file exists in Google Cloud Storage");

    try {
      const file = this.bucket.file(path);
      const [exists] = await file.exists();

      logger.debug({ path, bucket: this.bucketName, exists }, "File existence check completed");
      return exists;
    } catch (err) {
      logger.error(
        { error: err, path, bucket: this.bucketName },
        "Error checking file existence in Google Cloud Storage",
      );
      return false;
    }
  }

  async deleteFile(path: string): Promise<void> {
    logger.debug({ path, bucket: this.bucketName }, "Deleting file from Google Cloud Storage");

    try {
      const file = this.bucket.file(path);
      await file.delete();

      logger.debug({ path, bucket: this.bucketName }, "File deleted from Google Cloud Storage");
    } catch (err) {
      logger.error(
        { error: err, path, bucket: this.bucketName },
        "Error deleting file from Google Cloud Storage",
      );

      if (err && typeof err === "object" && "code" in err && err.code === 404) {
        logger.warn({ path, bucket: this.bucketName }, "File not found for deletion");
        return; // File doesn't exist, consider it deleted
      }

      const message = err instanceof Error ? err.message : String(err);
      throw new Error(`Failed to delete file from Google Cloud Storage: ${message}`);
    }
  }

  async getFileMetadata(path: string): Promise<StorageResult> {
    logger.debug({ path, bucket: this.bucketName }, "Getting file metadata from Google Cloud Storage");

    try {
      const file = this.bucket.file(path);
      const [metadata] = await file.getMetadata();

      const result: StorageResult = {
        key: path,
        bucket: this.bucketName,
        url: file.publicUrl(),
        size: typeof metadata.size === "number" ? metadata.size : parseInt(metadata.size ?? "0"),
        etag: metadata.etag,
        lastModified: metadata.updated ? new Date(metadata.updated) : undefined,
      };

      logger.debug({ path, bucket: this.bucketName, metadata: result }, "File metadata retrieved");
      return result;
    } catch (err) {
      logger.error(
        { error: err, path, bucket: this.bucketName },
        "Error getting file metadata from Google Cloud Storage",
      );

      if (err && typeof err === "object" && "code" in err && err.code === 404) {
        throw new Error(`File not found: ${path}`);
      }

      const message = err instanceof Error ? err.message : String(err);
      throw new Error(`Failed to get file metadata from Google Cloud Storage: ${message}`);
    }
  }

  async listFiles(prefix?: string, limit = 1000): Promise<StorageResult[]> {
    logger.debug({ prefix, limit, bucket: this.bucketName }, "Listing files from Google Cloud Storage");

    try {
      const options = {
        prefix,
        maxResults: limit,
        autoPaginate: false,
      };

      const [files] = await this.bucket.getFiles(options);

      const results: StorageResult[] = files.map((file: File) => ({
        key: file.name,
        bucket: this.bucketName,
        url: file.publicUrl(),
        size: (() => {
          if (!file.metadata.size) return undefined;
          return typeof file.metadata.size === "number" ? file.metadata.size : parseInt(file.metadata.size);
        })(),
        etag: file.metadata.etag,
        lastModified: file.metadata.updated ? new Date(file.metadata.updated) : undefined,
      }));

      logger.debug(
        { prefix, bucket: this.bucketName, count: results.length },
        "Files listed from Google Cloud Storage",
      );
      return results;
    } catch (err) {
      logger.error(
        { error: err, prefix, bucket: this.bucketName },
        "Error listing files from Google Cloud Storage",
      );
      const message = err instanceof Error ? err.message : String(err);
      throw new Error(`Failed to list files from Google Cloud Storage: ${message}`);
    }
  }

  async getSignedUrl(path: string, expiresIn = 3600): Promise<string> {
    logger.debug(
      { path, bucket: this.bucketName, expiresIn },
      "Generating signed URL for Google Cloud Storage",
    );

    try {
      const file = this.bucket.file(path);

      const [signedUrl] = await file.getSignedUrl({
        action: "read",
        expires: Date.now() + expiresIn * 1000,
        version: "v4",
      });

      logger.debug(
        { path, bucket: this.bucketName, expiresIn },
        "Signed URL generated for Google Cloud Storage",
      );
      return signedUrl;
    } catch (err) {
      logger.error(
        { error: err, path, bucket: this.bucketName },
        "Error generating signed URL for Google Cloud Storage",
      );
      const message = err instanceof Error ? err.message : String(err);
      throw new Error(`Failed to generate signed URL for Google Cloud Storage: ${message}`);
    }
  }

  async copyFile(sourcePath: string, destinationPath: string): Promise<StorageResult> {
    logger.debug(
      { sourcePath, destinationPath, bucket: this.bucketName },
      "Copying file in Google Cloud Storage",
    );

    try {
      const sourceFile = this.bucket.file(sourcePath);
      const destinationFile = this.bucket.file(destinationPath);

      await sourceFile.copy(destinationFile);

      const result = await this.getFileMetadata(destinationPath);

      logger.debug(
        { sourcePath, destinationPath, bucket: this.bucketName },
        "File copied in Google Cloud Storage",
      );
      return result;
    } catch (err) {
      logger.error(
        { error: err, sourcePath, destinationPath, bucket: this.bucketName },
        "Error copying file in Google Cloud Storage",
      );

      if (err && typeof err === "object" && "code" in err && err.code === 404) {
        throw new Error(`Source file not found: ${sourcePath}`);
      }

      const message = err instanceof Error ? err.message : String(err);
      throw new Error(`Failed to copy file in Google Cloud Storage: ${message}`);
    }
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
      tsv: "text/tab-separated-values",

      // Data formats
      json: "application/json",
      xml: "application/xml",
      yaml: "application/x-yaml",
      yml: "application/x-yaml",

      // Archives
      zip: "application/zip",
      rar: "application/x-rar-compressed",
      "7z": "application/x-7z-compressed",
      tar: "application/x-tar",
      gz: "application/gzip",
      bz2: "application/x-bzip2",

      // Audio
      mp3: "audio/mpeg",
      wav: "audio/wav",
      ogg: "audio/ogg",
      flac: "audio/flac",
      m4a: "audio/mp4",

      // Video
      mp4: "video/mp4",
      avi: "video/x-msvideo",
      mov: "video/quicktime",
      wmv: "video/x-ms-wmv",
      flv: "video/x-flv",
      webm: "video/webm",
      mkv: "video/x-matroska",

      // Web files
      html: "text/html",
      htm: "text/html",
      css: "text/css",
      js: "application/javascript",
      mjs: "application/javascript",
      ts: "application/typescript",
    };

    return contentTypes[extension ?? ""] ?? "application/octet-stream";
  }
}
