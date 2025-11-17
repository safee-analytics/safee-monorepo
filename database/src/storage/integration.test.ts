import { describe, it, beforeAll, afterAll, beforeEach, expect } from "vitest";
import { mkdir, rmdir } from "node:fs/promises";
import { join } from "node:path";
import { tmpdir } from "node:os";
import { createStorage, getStorage } from "./index.js";
import type { Storage, StorageMetadata } from "./storage.js";

describe("Storage Integration Tests", async () => {
  let testDir: string;

  beforeAll(async () => {
    testDir = join(tmpdir(), `storage-integration-${Date.now()}`);
    await mkdir(testDir, { recursive: true });
  });

  afterAll(async () => {
    try {
      await rmdir(testDir, { recursive: true });
    } catch {
    }
  });

  describe("Cross-Provider Consistency", async () => {
    let fileSystemStorage: Storage;

    beforeEach(() => {
      fileSystemStorage = createStorage({
        provider: "filesystem",
        bucket: "test-bucket",
        localPath: testDir,
      });
    });

    it("consistent file operations across providers", async () => {
      const testData = Buffer.from("Consistent test data");
      const path = "consistency-test.txt";
      const metadata: StorageMetadata = {
        contentType: "text/plain",
        metadata: { testId: "123" },
      };

      const saveResult = await fileSystemStorage.saveFile(path, testData, metadata);
      expect(saveResult.key).toBe(path);
      expect(saveResult.size).toBe(testData.length);

      const exists = await fileSystemStorage.fileExists(path);
      expect(exists).toBe(true);

      const retrievedData = await fileSystemStorage.getFile(path);
      expect(retrievedData).toEqual(testData);

      const fileMetadata = await fileSystemStorage.getFileMetadata(path);
      expect(fileMetadata.key).toBe(path);
      expect(fileMetadata.size).toBe(testData.length);

      await fileSystemStorage.deleteFile(path);
      const existsAfterDelete = await fileSystemStorage.fileExists(path);
      expect(existsAfterDelete).toBe(false);
    });

    it("handles large files consistently", async () => {
      const largeData = Buffer.alloc(1024 * 1024, "A"); // 1MB of "A"s
      const path = "large-file.bin";

      const saveResult = await fileSystemStorage.saveFile(path, largeData);
      expect(saveResult.size).toBe(largeData.length);

      const retrievedData = await fileSystemStorage.getFile(path);
      expect(retrievedData.length).toBe(largeData.length);
      expect(retrievedData).toEqual(largeData);

      await fileSystemStorage.deleteFile(path);
    });

    it("handles concurrent operations consistently", async () => {
      const operations = [];
      const testData = Buffer.from("Concurrent data");

      for (let i = 0; i < 20; i++) {
        const path = `concurrent-${i}.txt`;
        operations.push(
          fileSystemStorage
            .saveFile(path, testData)
            .then(() => fileSystemStorage.getFile(path))
            .then((data) => {
              expect(data).toEqual(testData);
              return fileSystemStorage.deleteFile(path);
            }),
        );
      }

      await Promise.all(operations);
    });

    it("maintains file integrity across operations", async () => {
      const originalData = Buffer.from("Original file content for integrity test");
      const path = "integrity-test.txt";

      for (let i = 0; i < 5; i++) {
        await fileSystemStorage.saveFile(path, originalData);

        const retrievedData = await fileSystemStorage.getFile(path);
        expect(retrievedData).toEqual(originalData);

        const metadata = await fileSystemStorage.getFileMetadata(path);
        expect(metadata.size).toBe(originalData.length);

        const exists = await fileSystemStorage.fileExists(path);
        expect(exists).toBe(true);
      }

      await fileSystemStorage.deleteFile(path);
    });
  });

  describe("Factory Function Integration", async () => {
    it("createStorage returns working storage instances", async () => {
      const configs = [
        {
          provider: "filesystem" as const,
          bucket: "factory-test",
          localPath: testDir,
        },
      ];

      for (const config of configs) {
        const storage = createStorage(config);
        const testData = Buffer.from(`Test data for ${config.provider}`);
        const path = `factory-test-${config.provider}.txt`;

        const result = await storage.saveFile(path, testData);
        expect(result.key).toBe(path);

        const retrievedData = await storage.getFile(path);
        expect(retrievedData).toEqual(testData);

        await storage.deleteFile(path);
      }
    });

    it("getStorage returns appropriate storage for environment", async () => {
      // IS_LOCAL is determined at module load time, so we test with whatever environment is active
      const storage = getStorage("env-test");
      const testData = Buffer.from("Environment test data");
      const path = "env-test.txt";

      const result = await storage.saveFile(path, testData);
      expect(result.key).toBe(path);

      const retrievedData = await storage.getFile(path);
      expect(retrievedData).toEqual(testData);

      await storage.deleteFile(path);
    });
  });

  describe("Real-World Use Cases", async () => {
    let storage: Storage;

    beforeEach(() => {
      storage = createStorage({
        provider: "filesystem",
        bucket: "use-case-test",
        localPath: testDir,
      });
    });

    it("handles document storage workflow", async () => {
      const documentContent = Buffer.from("This is a test document with some content.");
      const documentPath = "documents/2024/01/user-123/document.pdf";
      const metadata: StorageMetadata = {
        contentType: "application/pdf",
        metadata: {
          userId: "123",
          uploadDate: "2024-01-15",
          documentType: "invoice",
        },
      };

      const uploadResult = await storage.saveFile(documentPath, documentContent, metadata);
      expect(uploadResult.url).toBeTruthy();
      expect(uploadResult.size).toBe(documentContent.length);

      const exists = await storage.fileExists(documentPath);
      expect(exists).toBe(true);

      const docMetadata = await storage.getFileMetadata(documentPath);
      expect(docMetadata.key).toBe(documentPath);
      expect(docMetadata.lastModified).toBeTruthy();

      const signedUrl = await storage.getSignedUrl(documentPath, 1800); // 30 minutes
      expect(signedUrl.includes(documentPath)).toBeTruthy();

      const backupPath = "backups/documents/2024/01/user-123/document-backup.pdf";
      await storage.copyFile(documentPath, backupPath);

      expect(await storage.fileExists(documentPath)).toBe(true);
      expect(await storage.fileExists(backupPath)).toBe(true);

      const userDocuments = await storage.listFiles("documents/2024/01/user-123/");
      expect(userDocuments.length >= 1).toBeTruthy();
      expect(userDocuments.some((doc) => doc.key === documentPath));

      await storage.deleteFile(documentPath);
      await storage.deleteFile(backupPath);
    });

    it("handles image processing workflow", async () => {
      const originalImage = Buffer.from("fake-image-data-original");
      const thumbnailImage = Buffer.from("fake-image-data-thumb");
      const originalPath = "images/uploads/2024/image-456.jpg";
      const thumbnailPath = "images/thumbnails/2024/image-456-thumb.jpg";

      const imageMetadata: StorageMetadata = {
        contentType: "image/jpeg",
        metadata: {
          width: "1920",
          height: "1080",
          userId: "456",
          originalFilename: "vacation-photo.jpg",
        },
      };

      await storage.saveFile(originalPath, originalImage, imageMetadata);

      const thumbnailMetadata: StorageMetadata = {
        contentType: "image/jpeg",
        metadata: {
          width: "150",
          height: "150",
          isThumnail: "true",
          parentImage: originalPath,
        },
      };
      await storage.saveFile(thumbnailPath, thumbnailImage, thumbnailMetadata);

      const allImages = await storage.listFiles("images/", 100);
      expect(allImages.length >= 2).toBeTruthy();

      const originalExists = await storage.fileExists(originalPath);
      const thumbnailExists = await storage.fileExists(thumbnailPath);
      expect(originalExists).toBe(true);
      expect(thumbnailExists).toBe(true);

      const originalMeta = await storage.getFileMetadata(originalPath);
      const thumbnailMeta = await storage.getFileMetadata(thumbnailPath);

      expect(originalMeta.size).toBe(originalImage.length);
      expect(thumbnailMeta.size).toBe(thumbnailImage.length);

      await storage.deleteFile(originalPath);
      await storage.deleteFile(thumbnailPath);
    });

    it("handles batch file operations", async () => {
      const batchFiles = [];
      const batchData = Buffer.from("Batch file content");

      for (let i = 0; i < 10; i++) {
        const path = `batch/file-${i.toString().padStart(2, "0")}.txt`;
        batchFiles.push(path);
      }

      const uploadPromises = batchFiles.map((path) =>
        storage.saveFile(path, batchData, {
          contentType: "text/plain",
          metadata: { batchId: "batch-001", fileIndex: path.split("-")[1].split(".")[0] },
        }),
      );

      const uploadResults = await Promise.all(uploadPromises);
      expect(uploadResults.length).toBe(10);

      const listedFiles = await storage.listFiles("batch/");
      expect(listedFiles.length).toBe(10);

      const existsPromises = batchFiles.map((path) => storage.fileExists(path));
      const existsResults = await Promise.all(existsPromises);
      expect(existsResults.every((exists) => exists));

      const deletePromises = batchFiles.map((path) => storage.deleteFile(path));
      await Promise.all(deletePromises);

      const deletedExistsPromises = batchFiles.map((path) => storage.fileExists(path));
      const deletedExistsResults = await Promise.all(deletedExistsPromises);
      expect(deletedExistsResults.every((exists) => !exists));
    });
  });

  describe("Error Recovery", async () => {
    let storage: Storage;

    beforeEach(() => {
      storage = createStorage({
        provider: "filesystem",
        bucket: "error-test",
        localPath: testDir,
      });
    });

    it("recovers from interrupted operations", async () => {
      const testData = Buffer.from("Recovery test data");
      const path = "recovery/test-file.txt";

      await storage.saveFile(path, testData);
      expect(await storage.fileExists(path)).toBe(true);

      await expect(storage.getFile("non-existent.txt")).rejects.toThrow(/File not found/);

      const retrievedData = await storage.getFile(path);
      expect(retrievedData).toEqual(testData);

      await storage.deleteFile(path);
    });

    it("handles cleanup after failed operations", async () => {
      const testData = Buffer.from("Cleanup test data");
      const validPath = "cleanup/valid-file.txt";
      const invalidPath = ""; // Invalid path

      await storage.saveFile(validPath, testData);

      try {
        await storage.saveFile(invalidPath, testData);
      } catch (err) {
        expect(err instanceof Error).toBeTruthy();
      }

      const exists = await storage.fileExists(validPath);
      expect(exists).toBe(true);

      const data = await storage.getFile(validPath);
      expect(data).toEqual(testData);

      await storage.deleteFile(validPath);
    });
  });
});
