import { describe, it, before, after, beforeEach } from "node:test";
import assert from "node:assert";
import { mkdir, rmdir } from "node:fs/promises";
import { join } from "node:path";
import { tmpdir } from "node:os";
import { createStorage, getStorage } from "./index.js";
import type { Storage, StorageMetadata } from "./storage.js";

void describe("Storage Integration Tests", async () => {
  let testDir: string;

  before(async () => {
    testDir = join(tmpdir(), `storage-integration-${Date.now()}`);
    await mkdir(testDir, { recursive: true });
  });

  after(async () => {
    try {
      await rmdir(testDir, { recursive: true });
    } catch (err) {
      // Ignore cleanup errors
    }
  });

  void describe("Cross-Provider Consistency", async () => {
    let fileSystemStorage: Storage;

    beforeEach(() => {
      fileSystemStorage = createStorage({
        provider: "filesystem",
        bucket: "test-bucket",
        localPath: testDir
      });
    });

    void it("consistent file operations across providers", async () => {
      const testData = Buffer.from("Consistent test data");
      const path = "consistency-test.txt";
      const metadata: StorageMetadata = {
        contentType: "text/plain",
        metadata: { testId: "123" }
      };

      // Test with FileSystem storage (the only one we can fully test)
      const saveResult = await fileSystemStorage.saveFile(path, testData, metadata);
      assert.strictEqual(saveResult.key, path);
      assert.strictEqual(saveResult.size, testData.length);

      const exists = await fileSystemStorage.fileExists(path);
      assert.strictEqual(exists, true);

      const retrievedData = await fileSystemStorage.getFile(path);
      assert.deepStrictEqual(retrievedData, testData);

      const fileMetadata = await fileSystemStorage.getFileMetadata(path);
      assert.strictEqual(fileMetadata.key, path);
      assert.strictEqual(fileMetadata.size, testData.length);

      await fileSystemStorage.deleteFile(path);
      const existsAfterDelete = await fileSystemStorage.fileExists(path);
      assert.strictEqual(existsAfterDelete, false);
    });

    void it("handles large files consistently", async () => {
      const largeData = Buffer.alloc(1024 * 1024, 'A'); // 1MB of 'A's
      const path = "large-file.bin";

      const saveResult = await fileSystemStorage.saveFile(path, largeData);
      assert.strictEqual(saveResult.size, largeData.length);

      const retrievedData = await fileSystemStorage.getFile(path);
      assert.strictEqual(retrievedData.length, largeData.length);
      assert.deepStrictEqual(retrievedData, largeData);

      await fileSystemStorage.deleteFile(path);
    });

    void it("handles concurrent operations consistently", async () => {
      const operations = [];
      const testData = Buffer.from("Concurrent data");

      // Create multiple concurrent operations
      for (let i = 0; i < 20; i++) {
        const path = `concurrent-${i}.txt`;
        operations.push(
          fileSystemStorage.saveFile(path, testData)
            .then(() => fileSystemStorage.getFile(path))
            .then((data) => {
              assert.deepStrictEqual(data, testData);
              return fileSystemStorage.deleteFile(path);
            })
        );
      }

      await Promise.all(operations);
    });

    void it("maintains file integrity across operations", async () => {
      const originalData = Buffer.from("Original file content for integrity test");
      const path = "integrity-test.txt";

      // Save, read, and verify multiple times
      for (let i = 0; i < 5; i++) {
        await fileSystemStorage.saveFile(path, originalData);

        const retrievedData = await fileSystemStorage.getFile(path);
        assert.deepStrictEqual(retrievedData, originalData);

        const metadata = await fileSystemStorage.getFileMetadata(path);
        assert.strictEqual(metadata.size, originalData.length);

        // Verify the file still exists
        const exists = await fileSystemStorage.fileExists(path);
        assert.strictEqual(exists, true);
      }

      await fileSystemStorage.deleteFile(path);
    });
  });

  void describe("Factory Function Integration", async () => {
    void it("createStorage returns working storage instances", async () => {
      const configs = [
        {
          provider: "filesystem" as const,
          bucket: "factory-test",
          localPath: testDir
        }
      ];

      for (const config of configs) {
        const storage = createStorage(config);
        const testData = Buffer.from(`Test data for ${config.provider}`);
        const path = `factory-test-${config.provider}.txt`;

        const result = await storage.saveFile(path, testData);
        assert.strictEqual(result.key, path);

        const retrievedData = await storage.getFile(path);
        assert.deepStrictEqual(retrievedData, testData);

        await storage.deleteFile(path);
      }
    });

    void it("getStorage returns appropriate storage for environment", async () => {
      // Test with local environment
      const originalEnv = process.env.ENV;
      process.env.ENV = "local";

      const localStorage = getStorage("env-test");
      const testData = Buffer.from("Environment test data");
      const path = "env-test.txt";

      // Should work with FileSystemStorage in local environment
      const result = await localStorage.saveFile(path, testData);
      assert.strictEqual(result.key, path);

      const retrievedData = await localStorage.getFile(path);
      assert.deepStrictEqual(retrievedData, testData);

      await localStorage.deleteFile(path);

      // Restore environment
      if (originalEnv !== undefined) {
        process.env.ENV = originalEnv;
      } else {
        delete process.env.ENV;
      }
    });
  });

  void describe("Real-World Use Cases", async () => {
    let storage: Storage;

    beforeEach(() => {
      storage = createStorage({
        provider: "filesystem",
        bucket: "use-case-test",
        localPath: testDir
      });
    });

    void it("handles document storage workflow", async () => {
      // Simulate a document upload workflow
      const documentContent = Buffer.from("This is a test document with some content.");
      const documentPath = "documents/2024/01/user-123/document.pdf";
      const metadata: StorageMetadata = {
        contentType: "application/pdf",
        metadata: {
          userId: "123",
          uploadDate: "2024-01-15",
          documentType: "invoice"
        }
      };

      // Upload document
      const uploadResult = await storage.saveFile(documentPath, documentContent, metadata);
      assert.ok(uploadResult.url);
      assert.strictEqual(uploadResult.size, documentContent.length);

      // Verify document exists
      const exists = await storage.fileExists(documentPath);
      assert.strictEqual(exists, true);

      // Get document metadata
      const docMetadata = await storage.getFileMetadata(documentPath);
      assert.strictEqual(docMetadata.key, documentPath);
      assert.ok(docMetadata.lastModified);

      // Generate signed URL for temporary access
      const signedUrl = await storage.getSignedUrl(documentPath, 1800); // 30 minutes
      assert.ok(signedUrl.includes(documentPath));

      // Create backup copy
      const backupPath = "backups/documents/2024/01/user-123/document-backup.pdf";
      await storage.copyFile(documentPath, backupPath);

      // Verify both files exist
      assert.strictEqual(await storage.fileExists(documentPath), true);
      assert.strictEqual(await storage.fileExists(backupPath), true);

      // List documents for user
      const userDocuments = await storage.listFiles("documents/2024/01/user-123/");
      assert.ok(userDocuments.length >= 1);
      assert.ok(userDocuments.some(doc => doc.key === documentPath));

      // Cleanup
      await storage.deleteFile(documentPath);
      await storage.deleteFile(backupPath);
    });

    void it("handles image processing workflow", async () => {
      // Simulate image upload and processing
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
          originalFilename: "vacation-photo.jpg"
        }
      };

      // Upload original image
      await storage.saveFile(originalPath, originalImage, imageMetadata);

      // Upload thumbnail
      const thumbnailMetadata: StorageMetadata = {
        contentType: "image/jpeg",
        metadata: {
          width: "150",
          height: "150",
          isThumnail: "true",
          parentImage: originalPath
        }
      };
      await storage.saveFile(thumbnailPath, thumbnailImage, thumbnailMetadata);

      // List all images for 2024
      const allImages = await storage.listFiles("images/", 100);
      assert.ok(allImages.length >= 2);

      // Verify both images exist
      const originalExists = await storage.fileExists(originalPath);
      const thumbnailExists = await storage.fileExists(thumbnailPath);
      assert.strictEqual(originalExists, true);
      assert.strictEqual(thumbnailExists, true);

      // Get metadata for both
      const originalMeta = await storage.getFileMetadata(originalPath);
      const thumbnailMeta = await storage.getFileMetadata(thumbnailPath);

      assert.strictEqual(originalMeta.size, originalImage.length);
      assert.strictEqual(thumbnailMeta.size, thumbnailImage.length);

      // Cleanup
      await storage.deleteFile(originalPath);
      await storage.deleteFile(thumbnailPath);
    });

    void it("handles batch file operations", async () => {
      const batchFiles = [];
      const batchData = Buffer.from("Batch file content");

      // Create batch of files
      for (let i = 0; i < 10; i++) {
        const path = `batch/file-${i.toString().padStart(2, '0')}.txt`;
        batchFiles.push(path);
      }

      // Upload all files concurrently
      const uploadPromises = batchFiles.map(path =>
        storage.saveFile(path, batchData, {
          contentType: "text/plain",
          metadata: { batchId: "batch-001", fileIndex: path.split('-')[1].split('.')[0] }
        })
      );

      const uploadResults = await Promise.all(uploadPromises);
      assert.strictEqual(uploadResults.length, 10);

      // List all batch files
      const listedFiles = await storage.listFiles("batch/");
      assert.strictEqual(listedFiles.length, 10);

      // Verify all files exist
      const existsPromises = batchFiles.map(path => storage.fileExists(path));
      const existsResults = await Promise.all(existsPromises);
      assert.ok(existsResults.every(exists => exists === true));

      // Delete all batch files
      const deletePromises = batchFiles.map(path => storage.deleteFile(path));
      await Promise.all(deletePromises);

      // Verify all files are deleted
      const deletedExistsPromises = batchFiles.map(path => storage.fileExists(path));
      const deletedExistsResults = await Promise.all(deletedExistsPromises);
      assert.ok(deletedExistsResults.every(exists => exists === false));
    });
  });

  void describe("Error Recovery", async () => {
    let storage: Storage;

    beforeEach(() => {
      storage = createStorage({
        provider: "filesystem",
        bucket: "error-test",
        localPath: testDir
      });
    });

    void it("recovers from interrupted operations", async () => {
      const testData = Buffer.from("Recovery test data");
      const path = "recovery/test-file.txt";

      // Normal operation
      await storage.saveFile(path, testData);
      assert.strictEqual(await storage.fileExists(path), true);

      // Simulate partial failure by attempting operations on non-existent files
      await assert.rejects(
        async () => await storage.getFile("non-existent.txt"),
        /File not found/
      );

      // Verify original file is still intact
      const retrievedData = await storage.getFile(path);
      assert.deepStrictEqual(retrievedData, testData);

      // Cleanup
      await storage.deleteFile(path);
    });

    void it("handles cleanup after failed operations", async () => {
      const testData = Buffer.from("Cleanup test data");
      const validPath = "cleanup/valid-file.txt";
      const invalidPath = ""; // Invalid path

      // Save valid file
      await storage.saveFile(validPath, testData);

      // Attempt invalid operation (should handle gracefully)
      try {
        await storage.saveFile(invalidPath, testData);
      } catch (error) {
        // Expected to fail
        assert.ok(error instanceof Error);
      }

      // Verify valid file is unaffected
      const exists = await storage.fileExists(validPath);
      assert.strictEqual(exists, true);

      const data = await storage.getFile(validPath);
      assert.deepStrictEqual(data, testData);

      // Cleanup
      await storage.deleteFile(validPath);
    });
  });
});