import { describe, it, beforeAll, afterAll, beforeEach, expect } from "vitest";
import { mkdir, rmdir } from "node:fs/promises";
import { join } from "node:path";
import { tmpdir } from "node:os";
import { FileSystemStorage } from "./fileSystemStorage.js";
import { createStorage, getStorage } from "./index.js";
import type { StorageMetadata } from "./storage.js";

void describe("Storage System", async () => {
  let testDir: string;
  let storage: FileSystemStorage;

  beforeAll(async () => {
    testDir = join(tmpdir(), `storage-test-${Date.now()}`);
    await mkdir(testDir, { recursive: true });
  });

  afterAll(async () => {
    try {
      await rmdir(testDir, { recursive: true });
    } catch {
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

        expect(result.key).toBeTruthy();
        expect(result.key).toBe(path);
        expect(result.bucket).toBe("test-bucket");
        expect(result.url).toBeTruthy();
        expect(result.size).toBe(testData.length);
        expect(result.etag).toBeTruthy();
        expect(result.lastModified).toBeTruthy();
      });

      void it("saves file with metadata", async () => {
        const testData = Buffer.from("Test content");
        const path = "test-with-metadata.txt";
        const metadata: StorageMetadata = {
          contentType: "text/plain",
          metadata: { userId: "123", category: "test" },
        };

        const result = await storage.saveFile(path, testData, metadata);

        expect(result.key).toBe(path);
        expect(result.size).toBe(testData.length);
      });

      void it("creates nested directories", async () => {
        const testData = Buffer.from("Nested content");
        const path = "folder/subfolder/nested-file.txt";

        const result = await storage.saveFile(path, testData);

        expect(result.key).toBe(path);
        expect(result.url.includes("folder/subfolder/nested-file.txt")).toBeTruthy();
      });

      void it("overwrites existing files", async () => {
        const path = "overwrite-test.txt";
        const originalData = Buffer.from("Original content");
        const newData = Buffer.from("New content");

        await storage.saveFile(path, originalData);
        const result = await storage.saveFile(path, newData);

        expect(result.size).toBe(newData.length);

        const retrievedData = await storage.getFile(path);
        expect(retrievedData.toString()).toBe("New content");
      });
    });

    void describe("getFile", async () => {
      void it("retrieves existing file", async () => {
        const testData = Buffer.from("Test file content");
        const path = "retrieve-test.txt";

        await storage.saveFile(path, testData);
        const result = await storage.getFile(path);

        expect(result).toEqual(testData);
        expect(result.toString()).toBe("Test file content");
      });

      void it("throws error for non-existent file", async () => {
        const path = "non-existent.txt";

        await expect(storage.getFile(path)).rejects.toThrow(/File not found: non-existent.txt/);
      });

      void it("retrieves binary file correctly", async () => {
        const binaryData = Buffer.from([0, 1, 2, 3, 255, 254, 253]);
        const path = "binary-test.bin";

        await storage.saveFile(path, binaryData);
        const result = await storage.getFile(path);

        expect(result).toEqual(binaryData);
      });
    });

    void describe("fileExists", async () => {
      void it("returns true for existing file", async () => {
        const testData = Buffer.from("Exists test");
        const path = "exists-test.txt";

        await storage.saveFile(path, testData);
        const exists = await storage.fileExists(path);

        expect(exists).toBe(true);
      });

      void it("returns false for non-existent file", async () => {
        const path = "does-not-exist.txt";

        const exists = await storage.fileExists(path);

        expect(exists).toBe(false);
      });

      void it("returns false for directory", async () => {
        const dirPath = "test-directory";

        const exists = await storage.fileExists(dirPath);

        expect(exists).toBe(false);
      });
    });

    void describe("deleteFile", async () => {
      void it("deletes existing file", async () => {
        const testData = Buffer.from("Delete test");
        const path = "delete-test.txt";

        await storage.saveFile(path, testData);
        expect(await storage.fileExists(path)).toBe(true);

        await storage.deleteFile(path);
        expect(await storage.fileExists(path)).toBe(false);
      });

      void it("does not throw error when deleting non-existent file", async () => {
        const path = "non-existent-delete.txt";

        await storage.deleteFile(path);
      });

      void it("deletes file in nested directory", async () => {
        const testData = Buffer.from("Nested delete test");
        const path = "nested/deep/delete-nested.txt";

        await storage.saveFile(path, testData);
        expect(await storage.fileExists(path)).toBe(true);

        await storage.deleteFile(path);
        expect(await storage.fileExists(path)).toBe(false);
      });
    });

    void describe("getFileMetadata", async () => {
      void it("returns metadata for existing file", async () => {
        const testData = Buffer.from("Metadata test content");
        const path = "metadata-test.txt";

        const saveResult = await storage.saveFile(path, testData);
        const metadata = await storage.getFileMetadata(path);

        expect(metadata.key).toBe(path);
        expect(metadata.bucket).toBe("test-bucket");
        expect(metadata.size).toBe(testData.length);
        expect(metadata.url).toBeTruthy();
        expect(metadata.etag).toBeTruthy();
        expect(metadata.lastModified).toBeTruthy();
        expect(metadata.etag).toBe(saveResult.etag);
      });

      void it("throws error for non-existent file", async () => {
        const path = "non-existent-metadata.txt";

        await expect(storage.getFileMetadata(path)).rejects.toThrow(
          /File not found: non-existent-metadata.txt/,
        );
      });
    });

    void describe("listFiles", async () => {
      beforeEach(async () => {
        const testFiles = [
          { path: "file1.txt", content: "Content 1" },
          { path: "file2.txt", content: "Content 2" },
          { path: "folder/file3.txt", content: "Content 3" },
          { path: "folder/subfolder/file4.txt", content: "Content 4" },
          { path: "other/file5.txt", content: "Content 5" },
        ];

        for (const file of testFiles) {
          await storage.saveFile(file.path, Buffer.from(file.content));
        }
      });

      void it("lists all files without prefix", async () => {
        const files = await storage.listFiles();

        expect(files.length >= 5).toBeTruthy();
        const paths = files.map((f) => f.key);
        expect(paths.includes("file1.txt")).toBeTruthy();
        expect(paths.includes("folder/file3.txt")).toBeTruthy();
        expect(paths.includes("folder/subfolder/file4.txt")).toBeTruthy();
      });

      void it("lists files with prefix", async () => {
        const files = await storage.listFiles("folder/");

        expect(files.length >= 2).toBeTruthy();
        const paths = files.map((f) => f.key);
        expect(paths.every((path) => path.startsWith("folder/"))).toBeTruthy();
        expect(paths.includes("folder/file3.txt")).toBeTruthy();
        expect(paths.includes("folder/subfolder/file4.txt")).toBeTruthy();
      });

      void it("respects limit parameter", async () => {
        const files = await storage.listFiles(undefined, 2);

        expect(files.length).toBe(2);
      });

      void it("returns file metadata in results", async () => {
        const files = await storage.listFiles("file1");

        expect(files.length).toBe(1);
        const file = files[0];
        expect(file.key).toBe("file1.txt");
        expect(file.bucket).toBe("test-bucket");
        expect(file.url).toBeTruthy();
        expect(file.size).toBeTruthy();
        expect(file.etag).toBeTruthy();
        expect(file.lastModified).toBeTruthy();
      });

      void it("returns empty array for non-existent prefix", async () => {
        const files = await storage.listFiles("nonexistent/");

        expect(files.length).toBe(0);
      });
    });

    void describe("getSignedUrl", async () => {
      void it("generates signed URL with default expiry", async () => {
        const path = "signed-url-test.txt";
        const testData = Buffer.from("Signed URL test");

        await storage.saveFile(path, testData);
        const signedUrl = await storage.getSignedUrl(path);

        expect(signedUrl.includes(path)).toBeTruthy();
        expect(signedUrl.includes("expires=")).toBeTruthy();
        expect(signedUrl.includes("signature=")).toBeTruthy();
      });

      void it("generates signed URL with custom expiry", async () => {
        const path = "custom-expiry.txt";
        const testData = Buffer.from("Custom expiry test");
        const expiresIn = 1800;

        await storage.saveFile(path, testData);
        const signedUrl = await storage.getSignedUrl(path, expiresIn);

        expect(signedUrl.includes(path)).toBeTruthy();
        expect(signedUrl.includes("expires=")).toBeTruthy();

        const match = /expires=(\d+)/.exec(signedUrl);
        expect(match).toBeTruthy();
        const expires = parseInt(match![1]);
        const expectedExpires = Date.now() + expiresIn * 1000;
        expect(Math.abs(expires - expectedExpires) < 5000).toBeTruthy(); // Within 5 seconds
      });

      void it("generates different signatures for different files", async () => {
        const path1 = "signed1.txt";
        const path2 = "signed2.txt";

        await storage.saveFile(path1, Buffer.from("Content 1"));
        await storage.saveFile(path2, Buffer.from("Content 2"));

        const url1 = await storage.getSignedUrl(path1);
        const url2 = await storage.getSignedUrl(path2);

        const sig1 = /signature=([^&]+)/.exec(url1)?.[1];
        const sig2 = /signature=([^&]+)/.exec(url2)?.[1];

        expect(sig1).toBeTruthy();
        expect(sig2).toBeTruthy();
        expect(sig1).not.toBe(sig2);
      });
    });

    void describe("copyFile", async () => {
      void it("copies file successfully", async () => {
        const sourceData = Buffer.from("Source file content");
        const sourcePath = "source.txt";
        const destPath = "destination.txt";

        await storage.saveFile(sourcePath, sourceData);
        const result = await storage.copyFile(sourcePath, destPath);

        expect(result.key).toBe(destPath);
        expect(result.size).toBe(sourceData.length);

        const copiedData = await storage.getFile(destPath);
        expect(copiedData).toEqual(sourceData);

        const originalData = await storage.getFile(sourcePath);
        expect(originalData).toEqual(sourceData);
      });

      void it("copies file to nested directory", async () => {
        const sourceData = Buffer.from("Copy to nested");
        const sourcePath = "copy-source.txt";
        const destPath = "nested/deep/copy-dest.txt";

        await storage.saveFile(sourcePath, sourceData);
        const result = await storage.copyFile(sourcePath, destPath);

        expect(result.key).toBe(destPath);
        expect(await storage.fileExists(destPath)).toBeTruthy();

        const copiedData = await storage.getFile(destPath);
        expect(copiedData).toEqual(sourceData);
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
        expect(finalData).toEqual(sourceData);
      });

      void it("throws error when source file does not exist", async () => {
        const sourcePath = "non-existent-source.txt";
        const destPath = "copy-dest.txt";

        await expect(storage.copyFile(sourcePath, destPath)).rejects.toThrow(
          /Source file not found: non-existent-source.txt/,
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
          localPath: "/tmp",
        });

        expect(storage instanceof FileSystemStorage).toBeTruthy();
      });

      void it("creates AzureBlobStorage with connection string", () => {
        const mockConnectionString =
          "DefaultEndpointsProtocol=https;AccountName=test;AccountKey=test123;EndpointSuffix=core.windows.net";

        // Azure SDK doesn't validate connection string at construction time
        const storage = createStorage({
          provider: "azure",
          bucket: "test-bucket",
          connectionString: mockConnectionString,
        });

        expect(storage).toBeTruthy();
      });

      void it("throws error for Azure without connection string", () => {
        expect(() =>
          createStorage({
            provider: "azure",
            bucket: "test-bucket",
          }),
        ).toThrow(/Azure Blob Storage requires a connection string/);
      });

      void it("creates GoogleCloudStorage", () => {
        const storage = createStorage({
          provider: "google",
          bucket: "test-bucket",
        });

        // GoogleCloudStorage will be created but may fail during actual operations
        // without proper credentials, which is expected
        expect(storage).toBeTruthy();
      });

      void it("throws error for unsupported provider", () => {
        expect(() =>
          createStorage({
            provider: "unsupported" as "filesystem" | "azure" | "google",
            bucket: "test-bucket",
          }),
        ).toThrow(/Unsupported storage provider: unsupported/);
      });
    });

    void describe("getStorage", async () => {
      void it("returns FileSystemStorage for local environment", () => {
        const originalEnv = process.env.ENV;
        process.env.ENV = "local";

        const storage = getStorage("test-bucket");

        expect(storage instanceof FileSystemStorage).toBeTruthy();

        if (originalEnv !== undefined) {
          process.env.ENV = originalEnv;
        } else {
          delete process.env.ENV;
        }
      });

      void it("returns storage based on environment at module load time", () => {
        // IS_LOCAL is determined at module load time, not dynamically
        // In test environment, IS_LOCAL is true, so FileSystemStorage is returned
        const storage = getStorage("test-bucket");

        expect(storage).toBeTruthy();
        expect(storage instanceof FileSystemStorage).toBeTruthy();
      });
    });
  });

  void describe("Edge Cases", async () => {
    void it("handles empty file", async () => {
      const emptyData = Buffer.alloc(0);
      const path = "empty-file.txt";

      const result = await storage.saveFile(path, emptyData);
      expect(result.size).toBe(0);

      const retrievedData = await storage.getFile(path);
      expect(retrievedData.length).toBe(0);
    });

    void it("handles large file names", async () => {
      const testData = Buffer.from("Large filename test");
      const longName = `${"a".repeat(200)}.txt`;

      const result = await storage.saveFile(longName, testData);
      expect(result.key).toBe(longName);

      const exists = await storage.fileExists(longName);
      expect(exists).toBe(true);
    });

    void it("handles special characters in filename", async () => {
      const testData = Buffer.from("Special chars test");
      const specialPath = "file with spaces & symbols-123_test.txt";

      const result = await storage.saveFile(specialPath, testData);
      expect(result.key).toBe(specialPath);

      const retrievedData = await storage.getFile(specialPath);
      expect(retrievedData).toEqual(testData);
    });

    void it("handles concurrent file operations", async () => {
      const testData = Buffer.from("Concurrent test");
      const operations = [];

      for (let i = 0; i < 10; i++) {
        operations.push(storage.saveFile(`concurrent-${i}.txt`, testData));
      }

      const results = await Promise.all(operations);

      expect(results.length).toBe(10);
      for (let i = 0; i < 10; i++) {
        expect(results[i].key).toBe(`concurrent-${i}.txt`);
        expect(results[i].size).toBe(testData.length);
      }
    });
  });
});
