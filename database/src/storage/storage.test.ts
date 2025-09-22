import { describe, it, before, after, beforeEach, afterEach } from "node:test";
import assert from "node:assert";
import { mkdir, rmdir, writeFile } from "node:fs/promises";
import { join } from "node:path";
import { tmpdir } from "node:os";
import { pino } from "pino";
import { FileSystemStorage } from "./fileSystemStorage.js";
import { createStorage, getStorage } from "./index.js";
import type { StorageMetadata } from "./storage.js";

void describe("Storage System", async () => {
  let testDir: string;
  let storage: FileSystemStorage;
  const logger = pino({ level: "silent" });

  before(async () => {
    testDir = join(tmpdir(), `storage-test-${Date.now()}`);
    await mkdir(testDir, { recursive: true });
  });

  after(async () => {
    try {
      await rmdir(testDir, { recursive: true });
    } catch (err) {
      // Ignore cleanup errors
    }
  });

  beforeEach(() => {
    storage = new FileSystemStorage("/public", "test-bucket", testDir);
  });

  void describe("FileSystemStorage", async () => {
    void describe("saveFile", async () => {
      void it("saves file successfully", async () => {
        const testData = Buffer.from("Hello, World!");
        const path = "test-file.txt";

        const result = await storage.saveFile(path, testData);

        assert.ok(result.key);
        assert.strictEqual(result.key, path);
        assert.strictEqual(result.bucket, "test-bucket");
        assert.ok(result.url);
        assert.strictEqual(result.size, testData.length);
        assert.ok(result.etag);
        assert.ok(result.lastModified);
      });

      void it("saves file with metadata", async () => {
        const testData = Buffer.from("Test content");
        const path = "test-with-metadata.txt";
        const metadata: StorageMetadata = {
          contentType: "text/plain",
          metadata: { userId: "123", category: "test" }
        };

        const result = await storage.saveFile(path, testData, metadata);

        assert.strictEqual(result.key, path);
        assert.strictEqual(result.size, testData.length);
      });

      void it("creates nested directories", async () => {
        const testData = Buffer.from("Nested content");
        const path = "folder/subfolder/nested-file.txt";

        const result = await storage.saveFile(path, testData);

        assert.strictEqual(result.key, path);
        assert.ok(result.url.includes("folder/subfolder/nested-file.txt"));
      });

      void it("overwrites existing files", async () => {
        const path = "overwrite-test.txt";
        const originalData = Buffer.from("Original content");
        const newData = Buffer.from("New content");

        await storage.saveFile(path, originalData);
        const result = await storage.saveFile(path, newData);

        assert.strictEqual(result.size, newData.length);

        const retrievedData = await storage.getFile(path);
        assert.strictEqual(retrievedData.toString(), "New content");
      });
    });

    void describe("getFile", async () => {
      void it("retrieves existing file", async () => {
        const testData = Buffer.from("Test file content");
        const path = "retrieve-test.txt";

        await storage.saveFile(path, testData);
        const result = await storage.getFile(path);

        assert.deepStrictEqual(result, testData);
        assert.strictEqual(result.toString(), "Test file content");
      });

      void it("throws error for non-existent file", async () => {
        const path = "non-existent.txt";

        await assert.rejects(
          async () => await storage.getFile(path),
          /File not found: non-existent.txt/
        );
      });

      void it("retrieves binary file correctly", async () => {
        const binaryData = Buffer.from([0, 1, 2, 3, 255, 254, 253]);
        const path = "binary-test.bin";

        await storage.saveFile(path, binaryData);
        const result = await storage.getFile(path);

        assert.deepStrictEqual(result, binaryData);
      });
    });

    void describe("fileExists", async () => {
      void it("returns true for existing file", async () => {
        const testData = Buffer.from("Exists test");
        const path = "exists-test.txt";

        await storage.saveFile(path, testData);
        const exists = await storage.fileExists(path);

        assert.strictEqual(exists, true);
      });

      void it("returns false for non-existent file", async () => {
        const path = "does-not-exist.txt";

        const exists = await storage.fileExists(path);

        assert.strictEqual(exists, false);
      });

      void it("returns false for directory", async () => {
        const dirPath = "test-directory";

        const exists = await storage.fileExists(dirPath);

        assert.strictEqual(exists, false);
      });
    });

    void describe("deleteFile", async () => {
      void it("deletes existing file", async () => {
        const testData = Buffer.from("Delete test");
        const path = "delete-test.txt";

        await storage.saveFile(path, testData);
        assert.strictEqual(await storage.fileExists(path), true);

        await storage.deleteFile(path);
        assert.strictEqual(await storage.fileExists(path), false);
      });

      void it("does not throw error when deleting non-existent file", async () => {
        const path = "non-existent-delete.txt";

        // Should not throw
        await storage.deleteFile(path);
      });

      void it("deletes file in nested directory", async () => {
        const testData = Buffer.from("Nested delete test");
        const path = "nested/deep/delete-nested.txt";

        await storage.saveFile(path, testData);
        assert.strictEqual(await storage.fileExists(path), true);

        await storage.deleteFile(path);
        assert.strictEqual(await storage.fileExists(path), false);
      });
    });

    void describe("getFileMetadata", async () => {
      void it("returns metadata for existing file", async () => {
        const testData = Buffer.from("Metadata test content");
        const path = "metadata-test.txt";

        const saveResult = await storage.saveFile(path, testData);
        const metadata = await storage.getFileMetadata(path);

        assert.strictEqual(metadata.key, path);
        assert.strictEqual(metadata.bucket, "test-bucket");
        assert.strictEqual(metadata.size, testData.length);
        assert.ok(metadata.url);
        assert.ok(metadata.etag);
        assert.ok(metadata.lastModified);
        assert.strictEqual(metadata.etag, saveResult.etag);
      });

      void it("throws error for non-existent file", async () => {
        const path = "non-existent-metadata.txt";

        await assert.rejects(
          async () => await storage.getFileMetadata(path),
          /File not found: non-existent-metadata.txt/
        );
      });
    });

    void describe("listFiles", async () => {
      beforeEach(async () => {
        // Create test files
        const testFiles = [
          { path: "file1.txt", content: "Content 1" },
          { path: "file2.txt", content: "Content 2" },
          { path: "folder/file3.txt", content: "Content 3" },
          { path: "folder/subfolder/file4.txt", content: "Content 4" },
          { path: "other/file5.txt", content: "Content 5" }
        ];

        for (const file of testFiles) {
          await storage.saveFile(file.path, Buffer.from(file.content));
        }
      });

      void it("lists all files without prefix", async () => {
        const files = await storage.listFiles();

        assert.ok(files.length >= 5);
        const paths = files.map(f => f.key);
        assert.ok(paths.includes("file1.txt"));
        assert.ok(paths.includes("folder/file3.txt"));
        assert.ok(paths.includes("folder/subfolder/file4.txt"));
      });

      void it("lists files with prefix", async () => {
        const files = await storage.listFiles("folder/");

        assert.ok(files.length >= 2);
        const paths = files.map(f => f.key);
        assert.ok(paths.every(path => path.startsWith("folder/")));
        assert.ok(paths.includes("folder/file3.txt"));
        assert.ok(paths.includes("folder/subfolder/file4.txt"));
      });

      void it("respects limit parameter", async () => {
        const files = await storage.listFiles(undefined, 2);

        assert.strictEqual(files.length, 2);
      });

      void it("returns file metadata in results", async () => {
        const files = await storage.listFiles("file1");

        assert.strictEqual(files.length, 1);
        const file = files[0];
        assert.strictEqual(file.key, "file1.txt");
        assert.strictEqual(file.bucket, "test-bucket");
        assert.ok(file.url);
        assert.ok(file.size);
        assert.ok(file.etag);
        assert.ok(file.lastModified);
      });

      void it("returns empty array for non-existent prefix", async () => {
        const files = await storage.listFiles("nonexistent/");

        assert.strictEqual(files.length, 0);
      });
    });

    void describe("getSignedUrl", async () => {
      void it("generates signed URL with default expiry", async () => {
        const path = "signed-url-test.txt";
        const testData = Buffer.from("Signed URL test");

        await storage.saveFile(path, testData);
        const signedUrl = await storage.getSignedUrl(path);

        assert.ok(signedUrl.includes(path));
        assert.ok(signedUrl.includes("expires="));
        assert.ok(signedUrl.includes("signature="));
      });

      void it("generates signed URL with custom expiry", async () => {
        const path = "custom-expiry.txt";
        const testData = Buffer.from("Custom expiry test");
        const expiresIn = 1800; // 30 minutes

        await storage.saveFile(path, testData);
        const signedUrl = await storage.getSignedUrl(path, expiresIn);

        assert.ok(signedUrl.includes(path));
        assert.ok(signedUrl.includes("expires="));

        // Extract expires timestamp and verify it's approximately correct
        const match = signedUrl.match(/expires=(\d+)/);
        assert.ok(match);
        const expires = parseInt(match[1]);
        const expectedExpires = Date.now() + expiresIn * 1000;
        assert.ok(Math.abs(expires - expectedExpires) < 5000); // Within 5 seconds
      });

      void it("generates different signatures for different files", async () => {
        const path1 = "signed1.txt";
        const path2 = "signed2.txt";

        await storage.saveFile(path1, Buffer.from("Content 1"));
        await storage.saveFile(path2, Buffer.from("Content 2"));

        const url1 = await storage.getSignedUrl(path1);
        const url2 = await storage.getSignedUrl(path2);

        const sig1 = url1.match(/signature=([^&]+)/)?.[1];
        const sig2 = url2.match(/signature=([^&]+)/)?.[1];

        assert.ok(sig1);
        assert.ok(sig2);
        assert.notStrictEqual(sig1, sig2);
      });
    });

    void describe("copyFile", async () => {
      void it("copies file successfully", async () => {
        const sourceData = Buffer.from("Source file content");
        const sourcePath = "source.txt";
        const destPath = "destination.txt";

        await storage.saveFile(sourcePath, sourceData);
        const result = await storage.copyFile(sourcePath, destPath);

        assert.strictEqual(result.key, destPath);
        assert.strictEqual(result.size, sourceData.length);

        const copiedData = await storage.getFile(destPath);
        assert.deepStrictEqual(copiedData, sourceData);

        // Verify original still exists
        const originalData = await storage.getFile(sourcePath);
        assert.deepStrictEqual(originalData, sourceData);
      });

      void it("copies file to nested directory", async () => {
        const sourceData = Buffer.from("Copy to nested");
        const sourcePath = "copy-source.txt";
        const destPath = "nested/deep/copy-dest.txt";

        await storage.saveFile(sourcePath, sourceData);
        const result = await storage.copyFile(sourcePath, destPath);

        assert.strictEqual(result.key, destPath);
        assert.ok(await storage.fileExists(destPath));

        const copiedData = await storage.getFile(destPath);
        assert.deepStrictEqual(copiedData, sourceData);
      });

      void it("overwrites existing destination file", async () => {
        const sourceData = Buffer.from("New content");
        const oldData = Buffer.from("Old content");
        const sourcePath = "copy-source-overwrite.txt";
        const destPath = "copy-dest-overwrite.txt";

        await storage.saveFile(sourcePath, sourceData);
        await storage.saveFile(destPath, oldData);

        await storage.copyFile(sourcePath, destPath);

        const finalData = await storage.getFile(destPath);
        assert.deepStrictEqual(finalData, sourceData);
      });

      void it("throws error when source file does not exist", async () => {
        const sourcePath = "non-existent-source.txt";
        const destPath = "copy-dest.txt";

        await assert.rejects(
          async () => await storage.copyFile(sourcePath, destPath),
          /Source file not found: non-existent-source.txt/
        );
      });
    });
  });

  void describe("Storage Factory", async () => {
    void describe("createStorage", async () => {
      void it("creates FileSystemStorage", () => {
        const storage = createStorage({
          provider: "filesystem",
          bucket: "test-bucket",
          localPath: "/tmp"
        });

        assert.ok(storage instanceof FileSystemStorage);
      });

      void it("creates AzureBlobStorage with connection string", () => {
        const mockConnectionString = "DefaultEndpointsProtocol=https;AccountName=test;AccountKey=test123;EndpointSuffix=core.windows.net";

        assert.throws(
          () => createStorage({
            provider: "azure",
            bucket: "test-bucket",
            connectionString: mockConnectionString
          }),
          // Will throw during Azure client initialization since it's a fake connection string
        );
      });

      void it("throws error for Azure without connection string", () => {
        assert.throws(
          () => createStorage({
            provider: "azure",
            bucket: "test-bucket"
          }),
          /Azure Blob Storage requires a connection string/
        );
      });

      void it("creates GoogleCloudStorage", () => {
        const storage = createStorage({
          provider: "google",
          bucket: "test-bucket"
        });

        // GoogleCloudStorage will be created but may fail during actual operations
        // without proper credentials, which is expected
        assert.ok(storage);
      });

      void it("throws error for unsupported provider", () => {
        assert.throws(
          () => createStorage({
            provider: "unsupported" as any,
            bucket: "test-bucket"
          }),
          /Unsupported storage provider: unsupported/
        );
      });
    });

    void describe("getStorage", async () => {
      void it("returns FileSystemStorage for local environment", () => {
        // Mock IS_LOCAL to be true
        const originalEnv = process.env.ENV;
        process.env.ENV = "local";

        const storage = getStorage("test-bucket");

        assert.ok(storage instanceof FileSystemStorage);

        // Restore original environment
        if (originalEnv !== undefined) {
          process.env.ENV = originalEnv;
        } else {
          delete process.env.ENV;
        }
      });

      void it("returns GoogleCloudStorage for non-local environment", () => {
        // Mock IS_LOCAL to be false
        const originalEnv = process.env.ENV;
        process.env.ENV = "production";

        const storage = getStorage("test-bucket");

        // Will create GoogleCloudStorage instance
        assert.ok(storage);
        assert.ok(!(storage instanceof FileSystemStorage));

        // Restore original environment
        if (originalEnv !== undefined) {
          process.env.ENV = originalEnv;
        } else {
          delete process.env.ENV;
        }
      });
    });
  });

  void describe("Edge Cases", async () => {
    void it("handles empty file", async () => {
      const emptyData = Buffer.alloc(0);
      const path = "empty-file.txt";

      const result = await storage.saveFile(path, emptyData);
      assert.strictEqual(result.size, 0);

      const retrievedData = await storage.getFile(path);
      assert.strictEqual(retrievedData.length, 0);
    });

    void it("handles large file names", async () => {
      const testData = Buffer.from("Large filename test");
      const longName = "a".repeat(200) + ".txt";

      const result = await storage.saveFile(longName, testData);
      assert.strictEqual(result.key, longName);

      const exists = await storage.fileExists(longName);
      assert.strictEqual(exists, true);
    });

    void it("handles special characters in filename", async () => {
      const testData = Buffer.from("Special chars test");
      const specialPath = "file with spaces & symbols-123_test.txt";

      const result = await storage.saveFile(specialPath, testData);
      assert.strictEqual(result.key, specialPath);

      const retrievedData = await storage.getFile(specialPath);
      assert.deepStrictEqual(retrievedData, testData);
    });

    void it("handles concurrent file operations", async () => {
      const testData = Buffer.from("Concurrent test");
      const operations = [];

      for (let i = 0; i < 10; i++) {
        operations.push(storage.saveFile(`concurrent-${i}.txt`, testData));
      }

      const results = await Promise.all(operations);

      assert.strictEqual(results.length, 10);
      for (let i = 0; i < 10; i++) {
        assert.strictEqual(results[i].key, `concurrent-${i}.txt`);
        assert.strictEqual(results[i].size, testData.length);
      }
    });
  });
});