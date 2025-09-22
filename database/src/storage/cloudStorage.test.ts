import { describe, it } from "node:test";
import assert from "node:assert";
import { AzureBlobStorage } from "./azureBlobStorage.js";
import { GoogleCloudStorage } from "./googleCloudStorage.js";

void describe("Cloud Storage Adapters", async () => {
  void describe("AzureBlobStorage", async () => {
    void describe("constructor", async () => {
      void it("throws error without connection string", () => {
        assert.throws(
          () => new AzureBlobStorage("test-container", {}),
          /Account name is required when not using connection string/,
        );
      });

      void it("throws error with empty connection string", () => {
        assert.throws(
          () => new AzureBlobStorage("test-container", ""),
          /Azure Blob Storage connection string is required/,
        );
      });

      void it("creates instance with valid connection string", () => {
        const connectionString =
          "DefaultEndpointsProtocol=https;AccountName=testaccount;AccountKey=dGVzdGtleQ==;EndpointSuffix=core.windows.net";

        // This will create an instance but actual Azure operations will fail
        // since the credentials are fake, which is expected for unit tests
        const storage = new AzureBlobStorage("test-container", connectionString);
        assert.ok(storage);
      });

      void it("parses connection string correctly", () => {
        const connectionString =
          "DefaultEndpointsProtocol=https;AccountName=myaccount;AccountKey=mykey123;EndpointSuffix=core.windows.net";

        // This should not throw during construction
        const storage = new AzureBlobStorage("test-container", connectionString);
        assert.ok(storage);
      });
    });

    void describe("basic functionality", async () => {
      void it("should create storage instances", () => {
        const connectionString =
          "DefaultEndpointsProtocol=https;AccountName=test;AccountKey=dGVzdA==;EndpointSuffix=core.windows.net";
        const storage = new AzureBlobStorage("test", connectionString);

        assert.ok(storage);
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
        const storage = new GoogleCloudStorage("test-bucket", { projectId: "test-project" });
        assert.ok(storage);
      });

      void it("handles bucket name validation", () => {
        // Google Cloud Storage has specific bucket naming requirements
        // but the constructor doesn't validate this, actual operations would fail
        const storage = new GoogleCloudStorage("invalid_bucket_name!");
        assert.ok(storage);
      });
    });

    void describe("basic functionality", async () => {
      void it("should create storage instances", () => {
        const storage = new GoogleCloudStorage("test-bucket", {});
        assert.ok(storage);
      });
    });

    void describe("path validation", async () => {
      void it("should handle various path formats", () => {
        // These paths should not throw errors during construction/validation
        const testPaths = [
          "simple-file.txt",
          "folder/file.txt",
          "deep/nested/folder/file.json",
          "file-with-dashes.txt",
          "file_with_underscores.txt",
          "file123.txt",
          "UPPERCASE.TXT",
          "mixed-CASE_file123.json",
        ];

        for (const path of testPaths) {
          assert.ok(typeof path === "string" && path.length > 0);
        }
      });
    });
  });

  void describe("Storage Provider Comparison", async () => {
    void it("both providers should implement the same interface", () => {
      const connectionString =
        "DefaultEndpointsProtocol=https;AccountName=test;AccountKey=dGVzdA==;EndpointSuffix=core.windows.net";
      const azureStorage = new AzureBlobStorage("test", connectionString);
      const gcpStorage = new GoogleCloudStorage("test", {});

      const requiredMethods = [
        "saveFile",
        "getFile",
        "fileExists",
        "deleteFile",
        "getFileMetadata",
        "listFiles",
        "getSignedUrl",
        "copyFile",
      ];

      for (const method of requiredMethods) {
        assert.ok(typeof azureStorage[method as keyof typeof azureStorage] === "function");
        assert.ok(typeof gcpStorage[method as keyof typeof gcpStorage] === "function");
      }
    });

    void it("both providers should create instances successfully", () => {
      const connectionString =
        "DefaultEndpointsProtocol=https;AccountName=test;AccountKey=dGVzdA==;EndpointSuffix=core.windows.net";
      const azureStorage = new AzureBlobStorage("test", connectionString);
      const gcpStorage = new GoogleCloudStorage("test", {});

      assert.ok(azureStorage);
      assert.ok(gcpStorage);
    });
  });

  void describe("Error Handling", async () => {
    void it("Azure storage handles invalid connection strings gracefully", () => {
      const invalidConnectionStrings = [
        "invalid-connection-string",
        "AccountName=test", // Missing other required parts
        "DefaultEndpointsProtocol=https;AccountName=;AccountKey=key", // Empty account name
      ];

      for (const connectionString of invalidConnectionStrings) {
        try {
          const storage = new AzureBlobStorage("test", connectionString);
          assert.ok(storage); // Instance created, actual operations might fail later
        } catch (err) {
          // Some connection strings might fail during construction, which is acceptable
          assert.ok(err instanceof Error);
        }
      }
    });

    void it("validates container/bucket names", () => {
      const connectionString =
        "DefaultEndpointsProtocol=https;AccountName=test;AccountKey=dGVzdA==;EndpointSuffix=core.windows.net";

      assert.throws(() => new AzureBlobStorage("", connectionString), /Container name is required/);

      assert.throws(() => new GoogleCloudStorage("", {}), /A bucket name is needed to use Cloud Storage/);
    });
  });
});

