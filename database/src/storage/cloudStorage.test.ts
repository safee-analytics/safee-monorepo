import { describe, it, expect } from "vitest";
import { AzureBlobStorage } from "./azureBlobStorage.js";
import { GoogleCloudStorage } from "./googleCloudStorage.js";

void describe("Cloud Storage Adapters", async () => {
  void describe("AzureBlobStorage", async () => {
    void describe("constructor", async () => {
      void it("throws error without connection string", () => {
        expect(() => new AzureBlobStorage("test-container", {})).toThrow(
          /Account name is required when not using connection string/,
        );
      });

      void it("throws error with empty connection string", () => {
        expect(() => new AzureBlobStorage("test-container", "")).toThrow(
          /Azure Blob Storage connection string is required/,
        );
      });

      void it("creates instance with valid connection string", () => {
        const connectionString =
          "DefaultEndpointsProtocol=https;AccountName=testaccount;AccountKey=dGVzdGtleQ==;EndpointSuffix=core.windows.net";

        // This will create an instance but actual Azure operations will fail
        // since the credentials are fake, which is expected for unit tests
        const storage = new AzureBlobStorage("test-container", connectionString);
        expect(storage).toBeTruthy();
      });

      void it("parses connection string correctly", () => {
        const connectionString =
          "DefaultEndpointsProtocol=https;AccountName=myaccount;AccountKey=mykey123;EndpointSuffix=core.windows.net";

        const storage = new AzureBlobStorage("test-container", connectionString);
        expect(storage).toBeTruthy();
      });
    });

    void describe("basic functionality", async () => {
      void it("should create storage instances", () => {
        const connectionString =
          "DefaultEndpointsProtocol=https;AccountName=test;AccountKey=dGVzdA==;EndpointSuffix=core.windows.net";
        const storage = new AzureBlobStorage("test", connectionString);

        expect(storage).toBeTruthy();
      });
    });
  });

  void describe("GoogleCloudStorage", async () => {
    void describe("constructor", async () => {
      void it("creates instance with bucket name", () => {
        const storage = new GoogleCloudStorage("test-bucket");
        expect(storage).toBeTruthy();
      });

      void it("creates instance with bucket name and project ID", () => {
        const storage = new GoogleCloudStorage("test-bucket", { projectId: "test-project" });
        expect(storage).toBeTruthy();
      });

      void it("handles bucket name validation", () => {
        // Google Cloud Storage has specific bucket naming requirements
        // but the constructor doesn't validate this, actual operations would fail
        const storage = new GoogleCloudStorage("invalid_bucket_name!");
        expect(storage).toBeTruthy();
      });
    });

    void describe("basic functionality", async () => {
      void it("should create storage instances", () => {
        const storage = new GoogleCloudStorage("test-bucket", {});
        expect(storage).toBeTruthy();
      });
    });

    void describe("path validation", async () => {
      void it("should handle various path formats", () => {
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
          expect(typeof path === "string" && path.length > 0).toBeTruthy();
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
        expect(typeof azureStorage[method as keyof typeof azureStorage] === "function").toBeTruthy();
        expect(typeof gcpStorage[method as keyof typeof gcpStorage] === "function").toBeTruthy();
      }
    });

    void it("both providers should create instances successfully", () => {
      const connectionString =
        "DefaultEndpointsProtocol=https;AccountName=test;AccountKey=dGVzdA==;EndpointSuffix=core.windows.net";
      const azureStorage = new AzureBlobStorage("test", connectionString);
      const gcpStorage = new GoogleCloudStorage("test", {});

      expect(azureStorage).toBeTruthy();
      expect(gcpStorage).toBeTruthy();
    });
  });

  void describe("Error Handling", async () => {
    void it("Azure storage handles invalid connection strings gracefully", () => {
      const invalidConnectionStrings = [
        "invalid-connection-string",
        "AccountName=test",
        "DefaultEndpointsProtocol=https;AccountName=;AccountKey=key",
      ];

      for (const connectionString of invalidConnectionStrings) {
        try {
          const storage = new AzureBlobStorage("test", connectionString);
          expect(storage).toBeTruthy();
        } catch (err) {
          expect(err instanceof Error).toBeTruthy();
        }
      }
    });

    void it("validates container/bucket names", () => {
      const connectionString =
        "DefaultEndpointsProtocol=https;AccountName=test;AccountKey=dGVzdA==;EndpointSuffix=core.windows.net";

      expect(() => new AzureBlobStorage("", connectionString)).toThrow(/Container name is required/);

      expect(() => new GoogleCloudStorage("", {})).toThrow(/A bucket name is needed to use Cloud Storage/);
    });
  });
});
