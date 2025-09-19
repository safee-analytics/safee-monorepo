import { mkdir, writeFile, readFile, unlink, stat, readdir, copyFile, access } from "node:fs/promises";
import { join, dirname, relative } from "node:path";
import { createHash } from "node:crypto";
import type { Storage, StorageMetadata, StorageResult } from "./storage.js";
import { logger } from "../logger.js";

export class FileSystemStorage implements Storage {
  private rootPath: string;
  private publicUrl: string;
  private folderName: string;

  constructor(publicUrl: string, folderName: string, rootPath?: string) {
    this.publicUrl = publicUrl;
    this.folderName = folderName;
    this.rootPath = rootPath ?? process.cwd();
  }

  async saveFile(path: string, data: Buffer, _metadata?: StorageMetadata): Promise<StorageResult> {
    const fullPath = join(this.rootPath, this.folderName, path);
    logger.debug({ path, fullPath, size: data.length }, "Saving file to file system");

    try {
      // Ensure directory exists
      await mkdir(dirname(fullPath), { recursive: true });

      // Write file
      await writeFile(fullPath, data);

      // Get file stats
      const stats = await stat(fullPath);

      // Generate ETag (hash of file content)
      const hash = createHash("md5");
      hash.update(data);
      const etag = hash.digest("hex");

      const result: StorageResult = {
        key: path,
        bucket: this.folderName,
        url: this.getPublicUrl(path),
        size: stats.size,
        etag,
        lastModified: stats.mtime,
      };

      logger.debug({ path, fullPath, url: result.url }, "File saved to file system");
      return result;
    } catch (err) {
      logger.error({ error: err, path, fullPath }, "Error saving file to file system");
      const message = err instanceof Error ? err.message : String(err);
      throw new Error(`Failed to save file to file system: ${message}`);
    }
  }

  async getFile(path: string): Promise<Buffer> {
    const fullPath = join(this.rootPath, this.folderName, path);
    logger.debug({ path, fullPath }, "Getting file from file system");

    try {
      const buffer = await readFile(fullPath);

      logger.debug({ path, fullPath, size: buffer.length }, "File retrieved from file system");
      return buffer;
    } catch (err) {
      logger.error({ error: err, path, fullPath }, "Error getting file from file system");

      if (err && typeof err === "object" && "code" in err && err.code === "ENOENT") {
        throw new Error(`File not found: ${path}`);
      }

      const message = err instanceof Error ? err.message : String(err);
      throw new Error(`Failed to get file from file system: ${message}`);
    }
  }

  async fileExists(path: string): Promise<boolean> {
    const fullPath = join(this.rootPath, this.folderName, path);
    logger.debug({ path, fullPath }, "Checking if file exists in file system");

    try {
      await access(fullPath);
      logger.debug({ path, fullPath, exists: true }, "File existence check completed");
      return true;
    } catch (err) {
      if (err && typeof err === "object" && "code" in err && err.code === "ENOENT") {
        logger.debug({ path, fullPath, exists: false }, "File existence check completed");
        return false;
      }

      logger.error({ error: err, path, fullPath }, "Error checking file existence in file system");
      return false;
    }
  }

  async deleteFile(path: string): Promise<void> {
    const fullPath = join(this.rootPath, this.folderName, path);
    logger.debug({ path, fullPath }, "Deleting file from file system");

    try {
      await unlink(fullPath);
      logger.debug({ path, fullPath }, "File deleted from file system");
    } catch (err) {
      logger.error({ error: err, path, fullPath }, "Error deleting file from file system");

      if (err && typeof err === "object" && "code" in err && err.code === "ENOENT") {
        logger.warn({ path, fullPath }, "File not found for deletion");
        return; // File doesn't exist, consider it deleted
      }

      const message = err instanceof Error ? err.message : String(err);
      throw new Error(`Failed to delete file from file system: ${message}`);
    }
  }

  async getFileMetadata(path: string): Promise<StorageResult> {
    const fullPath = join(this.rootPath, this.folderName, path);
    logger.debug({ path, fullPath }, "Getting file metadata from file system");

    try {
      const stats = await stat(fullPath);

      // Generate ETag by reading and hashing the file
      const buffer = await readFile(fullPath);
      const hash = createHash("md5");
      hash.update(buffer);
      const etag = hash.digest("hex");

      const result: StorageResult = {
        key: path,
        bucket: this.folderName,
        url: this.getPublicUrl(path),
        size: stats.size,
        etag,
        lastModified: stats.mtime,
      };

      logger.debug({ path, fullPath, metadata: result }, "File metadata retrieved from file system");
      return result;
    } catch (err) {
      logger.error({ error: err, path, fullPath }, "Error getting file metadata from file system");

      if (err && typeof err === "object" && "code" in err && err.code === "ENOENT") {
        throw new Error(`File not found: ${path}`);
      }

      const message = err instanceof Error ? err.message : String(err);
      throw new Error(`Failed to get file metadata from file system: ${message}`);
    }
  }

  async listFiles(prefix?: string, limit = 1000): Promise<StorageResult[]> {
    const basePath = join(this.rootPath, this.folderName);
    const searchPath = prefix ? join(basePath, prefix) : basePath;

    logger.debug({ prefix, limit, basePath, searchPath }, "Listing files from file system");

    try {
      const results: StorageResult[] = [];

      await this.walkDirectory(basePath, searchPath, prefix ?? "", results, limit);

      logger.debug({ prefix, count: results.length }, "Files listed from file system");
      return results.slice(0, limit);
    } catch (err) {
      logger.error({ error: err, prefix, basePath }, "Error listing files from file system");
      const message = err instanceof Error ? err.message : String(err);
      throw new Error(`Failed to list files from file system: ${message}`);
    }
  }

  async getSignedUrl(path: string, expiresIn = 3600): Promise<string> {
    logger.debug({ path, expiresIn }, "Generating signed URL for file system");

    // For file system, we'll generate a signed URL with expiry timestamp and signature
    const expires = Date.now() + expiresIn * 1000;
    const signature = this.generateSignature(path, expires);
    const signedUrl = `${this.getPublicUrl(path)}?expires=${expires}&signature=${signature}`;

    logger.debug({ path, expiresIn, signedUrl }, "Signed URL generated for file system");
    return signedUrl;
  }

  async copyFile(sourcePath: string, destinationPath: string): Promise<StorageResult> {
    const sourceFullPath = join(this.rootPath, this.folderName, sourcePath);
    const destFullPath = join(this.rootPath, this.folderName, destinationPath);

    logger.debug(
      { sourcePath, destinationPath, sourceFullPath, destFullPath },
      "Copying file in file system",
    );

    try {
      // Ensure destination directory exists
      await mkdir(dirname(destFullPath), { recursive: true });

      // Copy the file
      await copyFile(sourceFullPath, destFullPath);

      const result = await this.getFileMetadata(destinationPath);

      logger.debug({ sourcePath, destinationPath }, "File copied in file system");
      return result;
    } catch (err) {
      logger.error({ error: err, sourcePath, destinationPath }, "Error copying file in file system");

      if (err && typeof err === "object" && "code" in err && err.code === "ENOENT") {
        throw new Error(`Source file not found: ${sourcePath}`);
      }

      const message = err instanceof Error ? err.message : String(err);
      throw new Error(`Failed to copy file in file system: ${message}`);
    }
  }

  /**
   * Walk directory recursively to find all files
   */
  private async walkDirectory(
    basePath: string,
    currentPath: string,
    prefix: string,
    results: StorageResult[],
    limit: number,
  ): Promise<void> {
    if (results.length >= limit) {
      return;
    }

    try {
      const entries = await readdir(currentPath, { withFileTypes: true });

      for (const entry of entries) {
        if (results.length >= limit) {
          break;
        }

        const fullPath = join(currentPath, entry.name);

        if (entry.isDirectory()) {
          // Recursively walk subdirectories
          await this.walkDirectory(basePath, fullPath, prefix, results, limit);
        } else if (entry.isFile()) {
          // Get relative path from base path
          const relativePath = relative(basePath, fullPath);

          // Skip if it doesn't match the prefix
          if (prefix && !relativePath.startsWith(prefix)) {
            continue;
          }

          try {
            const stats = await stat(fullPath);

            // Generate ETag efficiently (using file stats instead of reading content)
            const etag = createHash("md5")
              .update(`${relativePath}-${stats.size}-${stats.mtime.getTime()}`)
              .digest("hex");

            results.push({
              key: relativePath.replace(/\\/g, "/"), // Normalize path separators
              bucket: this.folderName,
              url: this.getPublicUrl(relativePath.replace(/\\/g, "/")),
              size: stats.size,
              etag,
              lastModified: stats.mtime,
            });
          } catch (err) {
            logger.warn({ error: err, path: fullPath }, "Error getting file stats during listing");
          }
        }
      }
    } catch (err) {
      if (!(err && typeof err === "object" && "code" in err && err.code === "ENOENT")) {
        logger.warn({ error: err, path: currentPath }, "Error reading directory during file listing");
      }
    }
  }

  /**
   * Generate public URL for a file
   */
  private getPublicUrl(path: string): string {
    return `${this.publicUrl}/${this.folderName}/${path}`.replace(/\/+/g, "/");
  }

  /**
   * Generate signature for signed URL
   */
  private generateSignature(path: string, expires: number): string {
    // Simple signature using HMAC-like approach
    const secret = process.env.FILE_STORAGE_SECRET ?? "default-secret";
    const payload = `${path}:${expires}`;

    return createHash("sha256").update(`${secret}:${payload}`).digest("hex").substring(0, 16); // Truncate for brevity
  }
}
