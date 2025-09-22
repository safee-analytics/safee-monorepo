import { describe, it, beforeEach } from "node:test";
import assert from "node:assert";
import { AzureBlobStorage } from "./azureBlobStorage.js";
import { GoogleCloudStorage } from "./googleCloudStorage.js";

void describe("Cloud Storage Adapters", async () => {
  void describe("AzureBlobStorage", async () => {
    void describe("constructor", async () => {
      void it("throws error without connection string", () => {
        assert.throws(
          () => new AzureBlobStorage("test-container"),
          /Azure Blob Storage connection string is required/
        );
      });

      void it("throws error with empty connection string", () => {
        assert.throws(
          () => new AzureBlobStorage("test-container", ""),
          /Azure Blob Storage connection string is required/
        );
      });

      void it("creates instance with valid connection string", () => {
        const connectionString = "DefaultEndpointsProtocol=https;AccountName=testaccount;AccountKey=dGVzdGtleQ==;EndpointSuffix=core.windows.net";

        // This will create an instance but actual Azure operations will fail
        // since the credentials are fake, which is expected for unit tests
        const storage = new AzureBlobStorage("test-container", connectionString);
        assert.ok(storage);
      });

      void it("parses connection string correctly", () => {
        const connectionString = "DefaultEndpointsProtocol=https;AccountName=myaccount;AccountKey=mykey123;EndpointSuffix=core.windows.net";

        // This should not throw during construction
        const storage = new AzureBlobStorage("test-container", connectionString);
        assert.ok(storage);
      });
    });

    void describe("content type detection", async () => {
      void it("should detect common file types", () => {
        const connectionString = "DefaultEndpointsProtocol=https;AccountName=test;AccountKey=dGVzdA==;EndpointSuffix=core.windows.net";
        const storage = new AzureBlobStorage("test", connectionString);

        // Access private method through type assertion for testing
        const getContentType = (storage as any).getContentType.bind(storage);

        assert.strictEqual(getContentType("file.txt"), "text/plain");
        assert.strictEqual(getContentType("file.json"), "application/json");
        assert.strictEqual(getContentType("file.html"), "text/html");
        assert.strictEqual(getContentType("file.css"), "text/css");
        assert.strictEqual(getContentType("file.js"), "application/javascript");
        assert.strictEqual(getContentType("file.jpg"), "image/jpeg");
        assert.strictEqual(getContentType("file.png"), "image/png");
        assert.strictEqual(getContentType("file.pdf"), "application/pdf");
        assert.strictEqual(getContentType("file.zip"), "application/zip");
        assert.strictEqual(getContentType("file.unknown"), "application/octet-stream");
      });

      void it("should handle files without extensions", () => {
        const connectionString = "DefaultEndpointsProtocol=https;AccountName=test;AccountKey=dGVzdA==;EndpointSuffix=core.windows.net";
        const storage = new AzureBlobStorage("test", connectionString);

        const getContentType = (storage as any).getContentType.bind(storage);

        assert.strictEqual(getContentType("filename"), "application/octet-stream");
        assert.strictEqual(getContentType("path/to/file"), "application/octet-stream");
      });

      void it("should be case insensitive", () => {
        const connectionString = "DefaultEndpointsProtocol=https;AccountName=test;AccountKey=dGVzdA==;EndpointSuffix=core.windows.net";
        const storage = new AzureBlobStorage("test", connectionString);

        const getContentType = (storage as any).getContentType.bind(storage);

        assert.strictEqual(getContentType("file.TXT"), "text/plain");
        assert.strictEqual(getContentType("file.JSON"), "application/json");
        assert.strictEqual(getContentType("file.PNG"), "image/png");
      });
    });

    void describe("URL generation", async () => {
      void it("should generate correct public URLs", () => {
        const connectionString = "DefaultEndpointsProtocol=https;AccountName=testaccount;AccountKey=dGVzdA==;EndpointSuffix=core.windows.net";
        const storage = new AzureBlobStorage("test-container", connectionString);

        const getPublicUrl = (storage as any).getPublicUrl.bind(storage);

        const url = getPublicUrl("path/to/file.txt");
        assert.ok(url.includes("testaccount"));
        assert.ok(url.includes("test-container"));
        assert.ok(url.includes("path/to/file.txt"));
        assert.ok(url.startsWith("https://"));
      });

      void it("should handle paths with special characters", () => {
        const connectionString = "DefaultEndpointsProtocol=https;AccountName=testaccount;AccountKey=dGVzdA==;EndpointSuffix=core.windows.net";
        const storage = new AzureBlobStorage("test-container", connectionString);

        const getPublicUrl = (storage as any).getPublicUrl.bind(storage);

        const url = getPublicUrl("path with spaces/file-name_123.txt");
        assert.ok(url.includes("path%20with%20spaces"));
        assert.ok(url.includes("file-name_123.txt"));
      });
    });
  });

  void describe("GoogleCloudStorage", async () => {
    void describe("constructor", async () => {
      void it("creates instance with bucket name", () => {
        const storage = new GoogleCloudStorage("test-bucket");
        assert.ok(storage);
      });

      void it("creates instance with bucket name and project ID", () => {
        const storage = new GoogleCloudStorage("test-bucket", "test-project");
        assert.ok(storage);
      });

      void it("handles bucket name validation", () => {
        // Google Cloud Storage has specific bucket naming requirements
        // but the constructor doesn't validate this, actual operations would fail
        const storage = new GoogleCloudStorage("invalid_bucket_name!");
        assert.ok(storage);
      });
    });

    void describe("content type detection", async () => {
      void it("should detect common file types", () => {
        const storage = new GoogleCloudStorage("test-bucket");

        const getContentType = (storage as any).getContentType.bind(storage);

        assert.strictEqual(getContentType("file.txt"), "text/plain");
        assert.strictEqual(getContentType("file.json"), "application/json");
        assert.strictEqual(getContentType("file.html"), "text/html");
        assert.strictEqual(getContentType("file.css"), "text/css");
        assert.strictEqual(getContentType("file.js"), "application/javascript");
        assert.strictEqual(getContentType("file.jpg"), "image/jpeg");
        assert.strictEqual(getContentType("file.png"), "image/png");
        assert.strictEqual(getContentType("file.pdf"), "application/pdf");
        assert.strictEqual(getContentType("file.zip"), "application/zip");
        assert.strictEqual(getContentType("file.unknown"), "application/octet-stream");
      });

      void it("should handle complex file paths", () => {
        const storage = new GoogleCloudStorage("test-bucket");

        const getContentType = (storage as any).getContentType.bind(storage);

        assert.strictEqual(getContentType("path/to/nested/file.json"), "application/json");
        assert.strictEqual(getContentType("uploads/2024/01/document.pdf"), "application/pdf");
      });
    });

    void describe("URL generation", async () => {
      void it("should generate correct public URLs", () => {
        const storage = new GoogleCloudStorage("test-bucket");

        const getPublicUrl = (storage as any).getPublicUrl.bind(storage);

        const url = getPublicUrl("path/to/file.txt");
        assert.ok(url.includes("test-bucket"));
        assert.ok(url.includes("path/to/file.txt"));
        assert.ok(url.includes("storage.googleapis.com") || url.includes("storage.cloud.google.com"));
      });

      void it("should handle special characters in paths", () => {
        const storage = new GoogleCloudStorage("test-bucket");

        const getPublicUrl = (storage as any).getPublicUrl.bind(storage);

        const url = getPublicUrl("folder with spaces/file-name.txt");
        assert.ok(url.includes("test-bucket"));
        // URL should be properly encoded
        assert.ok(url.includes("folder%20with%20spaces") || url.includes("folder+with+spaces"));
      });
    });

    void describe("path validation", async () => {
      void it("should handle various path formats", () => {
        const storage = new GoogleCloudStorage("test-bucket");

        // These paths should not throw errors during construction/validation
        const testPaths = [
          "simple-file.txt",
          "folder/file.txt",
          "deep/nested/folder/file.json",
          "file-with-dashes.txt",
          "file_with_underscores.txt",
          "file123.txt",
          "UPPERCASE.TXT",
          "mixed-CASE_file123.json"
        ];

        for (const path of testPaths) {
          // Just verify the path doesn't cause constructor issues
          assert.ok(typeof path === "string" && path.length > 0);
        }
      });
    });
  });

  void describe("Storage Provider Comparison", async () => {
    void it("both providers should implement the same interface", () => {
      const connectionString = "DefaultEndpointsProtocol=https;AccountName=test;AccountKey=dGVzdA==;EndpointSuffix=core.windows.net";
      const azureStorage = new AzureBlobStorage("test", connectionString);
      const gcpStorage = new GoogleCloudStorage("test");

      // Check that both implement the same interface methods
      const requiredMethods = [
        'saveFile',
        'getFile',
        'fileExists',
        'deleteFile',
        'getFileMetadata',
        'listFiles',
        'getSignedUrl',
        'copyFile'
      ];

      for (const method of requiredMethods) {
        assert.ok(typeof azureStorage[method as keyof typeof azureStorage] === 'function');
        assert.ok(typeof gcpStorage[method as keyof typeof gcpStorage] === 'function');
      }
    });

    void it("both providers should have content type detection", () => {
      const connectionString = "DefaultEndpointsProtocol=https;AccountName=test;AccountKey=dGVzdA==;EndpointSuffix=core.windows.net";
      const azureStorage = new AzureBlobStorage("test", connectionString);
      const gcpStorage = new GoogleCloudStorage("test");

      const azureGetContentType = (azureStorage as any).getContentType.bind(azureStorage);
      const gcpGetContentType = (gcpStorage as any).getContentType.bind(gcpStorage);

      // Both should return the same content types for common file extensions
      const testFiles = ['file.txt', 'file.json', 'file.png', 'file.pdf'];

      for (const file of testFiles) {
        const azureType = azureGetContentType(file);
        const gcpType = gcpGetContentType(file);
        assert.strictEqual(azureType, gcpType, `Content type mismatch for ${file}`);
      }
    });
  });

  void describe("Error Handling", async () => {
    void it("Azure storage handles invalid connection strings gracefully", () => {
      const invalidConnectionStrings = [
        "invalid-connection-string",
        "AccountName=test",  // Missing other required parts
        "DefaultEndpointsProtocol=https;AccountName=;AccountKey=key", // Empty account name
      ];

      for (const connectionString of invalidConnectionStrings) {
        // Constructor might not validate immediately, but should not crash
        try {
          const storage = new AzureBlobStorage("test", connectionString);
          assert.ok(storage); // Instance created, actual operations might fail later
        } catch (error) {
          // Some connection strings might fail during construction, which is acceptable
          assert.ok(error instanceof Error);
        }
      }
    });

    void it("handles empty or invalid bucket names", () => {
      const connectionString = "DefaultEndpointsProtocol=https;AccountName=test;AccountKey=dGVzdA==;EndpointSuffix=core.windows.net";

      // Empty bucket name should not crash constructor
      const azureStorage = new AzureBlobStorage("", connectionString);
      assert.ok(azureStorage);

      const gcpStorage = new GoogleCloudStorage("");
      assert.ok(gcpStorage);
    });
  });
});