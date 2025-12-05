import { describe, it, expect, beforeAll, afterAll, beforeEach } from "vitest";
import { type DrizzleClient, schema, eq } from "@safee/database";
import { connectTest } from "@safee/database/test-helpers";
import { ClientEncryptionService } from "../services/clientEncryption.service.js";
import {
  cleanupEncryptionTables,
  createTestOrg,
  createTestUser,
} from "../test-helpers/encryptionTestHelpers.js";

void describe("Encryption Flow Integration Tests", async () => {
  let drizzle: DrizzleClient;
  let close: () => Promise<void>;
  let service: ClientEncryptionService;

  beforeAll(async () => {
    ({ drizzle, close } = await connectTest({ appName: "encryption-flow-integration-test" }));
  });

  beforeEach(async () => {
    await cleanupEncryptionTables(drizzle);
    service = new ClientEncryptionService(drizzle);
  });

  afterAll(async () => {
    await close();
  });

  void describe("Complete Encryption Setup Flow", () => {
    void it("should complete full encryption setup for organization", async () => {
      const org = await createTestOrg(drizzle);
      const admin = await createTestUser(drizzle, "admin", "Admin User");

      // Step 1: Verify no encryption initially
      const initialStatus = await service.getOrgEncryptionKey(org.id);
      expect(initialStatus).toBeNull();

      // Step 2: Admin enables encryption
      const encryptionKey = await service.createOrgEncryptionKey({
        organizationId: org.id,
        wrappedOrgKey: "base64encodedwrappedkey",
        salt: "base64encodedsalt",
        iv: "base64encodediv",
      });

      expect(encryptionKey.id).toBeDefined();
      expect(encryptionKey.isActive).toBe(true);

      // Step 3: Update organization record
      await drizzle
        .update(schema.organizations)
        .set({
          encryptionEnabled: true,
          encryptionEnabledAt: new Date(),
          encryptionEnabledBy: admin.id,
        })
        .where(eq(schema.organizations.id, org.id));

      // Step 4: Verify encryption is enabled
      const updatedOrg = await drizzle.query.organizations.findFirst({
        where: eq(schema.organizations.id, org.id),
      });

      expect(updatedOrg?.encryptionEnabled).toBe(true);
      expect(updatedOrg?.encryptionEnabledBy).toBe(admin.id);

      // Step 5: Verify key is retrievable
      const retrievedKey = await service.getOrgEncryptionKey(org.id);
      expect(retrievedKey?.id).toBe(encryptionKey.id);
      expect(retrievedKey?.wrappedOrgKey).toBe("base64encodedwrappedkey");
    });
  });

  void describe("File Encryption Workflow", () => {
    void it("should complete full file encryption and retrieval flow", async () => {
      const org = await createTestOrg(drizzle);
      const user = await createTestUser(drizzle);

      // Step 1: Enable encryption for organization
      const encryptionKey = await service.createOrgEncryptionKey({
        organizationId: org.id,
        wrappedOrgKey: "base64encodedwrappedkey",
        salt: "base64encodedsalt",
        iv: "base64encodediv",
      });

      // Step 2: Upload and encrypt a file
      const fileId = "550e8400-e29b-41d4-a716-446655440000";

      await service.storeFileEncryptionMetadata({
        fileId,
        encryptionKeyId: encryptionKey.id,
        keyVersion: 1,
        iv: "filespecificiv",
        authTag: "fileauthenticationtag",
        chunkSize: 131072,
        encryptedBy: user.id,
      });

      // Step 3: Retrieve file encryption metadata
      const metadata = await service.getFileEncryptionMetadata(fileId);

      expect(metadata).not.toBeNull();
      expect(metadata?.fileId).toBe(fileId);
      expect(metadata?.encryptionKeyId).toBe(encryptionKey.id);
      expect(metadata?.iv).toBe("filespecificiv");
      expect(metadata?.authTag).toBe("fileauthenticationtag");
      expect(metadata?.algorithm).toBe("AES-256-GCM");
      expect(metadata?.isEncrypted).toBe(true);

      // Step 4: Verify organization key is still accessible for decryption
      const orgKey = await service.getOrgEncryptionKey(org.id);
      expect(orgKey?.id).toBe(encryptionKey.id);
    });

    void it("should support multiple files with same encryption key", async () => {
      const org = await createTestOrg(drizzle);
      const user = await createTestUser(drizzle);

      const encryptionKey = await service.createOrgEncryptionKey({
        organizationId: org.id,
        wrappedOrgKey: "base64encodedwrappedkey",
        salt: "base64encodedsalt",
        iv: "base64encodediv",
      });

      // Encrypt multiple files
      const fileIds = [
        "550e8400-e29b-41d4-a716-446655440001",
        "550e8400-e29b-41d4-a716-446655440002",
        "550e8400-e29b-41d4-a716-446655440003",
      ];

      for (const fileId of fileIds) {
        await service.storeFileEncryptionMetadata({
          fileId,
          encryptionKeyId: encryptionKey.id,
          keyVersion: 1,
          iv: `fileiv-${fileId}`,
          authTag: `authtag-${fileId}`,
          chunkSize: 131072,
          encryptedBy: user.id,
        });
      }

      // Verify all files are encrypted with same key
      for (const fileId of fileIds) {
        const metadata = await service.getFileEncryptionMetadata(fileId);
        expect(metadata?.encryptionKeyId).toBe(encryptionKey.id);
        expect(metadata?.keyVersion).toBe(1);
      }
    });
  });

  void describe("Auditor Access Workflow", () => {
    void it("should complete full auditor access grant and usage flow", async () => {
      const org = await createTestOrg(drizzle);
      const admin = await createTestUser(drizzle, "admin", "Admin User");
      const auditor = await createTestUser(drizzle, "auditor", "Auditor User");

      // Step 1: Enable encryption
      const encryptionKey = await service.createOrgEncryptionKey({
        organizationId: org.id,
        wrappedOrgKey: "base64encodedwrappedkey",
        salt: "base64encodedsalt",
        iv: "base64encodediv",
      });

      // Step 2: Grant auditor access
      const expiresAt = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000);

      const access = await service.grantAuditorAccess({
        organizationId: org.id,
        auditorUserId: auditor.id,
        grantedByUserId: admin.id,
        encryptionKeyId: encryptionKey.id,
        wrappedOrgKey: "rsawrappedorgkey",
        expiresAt,
      });

      expect(access.id).toBeDefined();
      expect(access.isRevoked).toBe(false);

      // Step 3: Auditor checks their access
      const auditorAccess = await service.getAuditorAccess(org.id, auditor.id);

      expect(auditorAccess).not.toBeNull();
      expect(auditorAccess?.auditorUserId).toBe(auditor.id);
      expect(auditorAccess?.wrappedOrgKey).toBe("rsawrappedorgkey");
      expect(auditorAccess?.isRevoked).toBe(false);

      // Step 4: Auditor can decrypt files (simulated by having access to wrapped key)
      const fileId = "550e8400-e29b-41d4-a716-446655440000";

      await service.storeFileEncryptionMetadata({
        fileId,
        encryptionKeyId: encryptionKey.id,
        keyVersion: 1,
        iv: "fileiv",
        authTag: "authtag",
        chunkSize: 131072,
        encryptedBy: admin.id,
      });

      const fileMetadata = await service.getFileEncryptionMetadata(fileId);
      expect(fileMetadata?.encryptionKeyId).toBe(encryptionKey.id);

      // Step 5: Admin revokes auditor access
      await service.revokeAuditorAccess(access.id, admin.id);

      // Step 6: Verify auditor no longer has access
      const revokedAccess = await service.getAuditorAccess(org.id, auditor.id);
      expect(revokedAccess).toBeNull();
    });

    void it("should handle multiple auditors with different access levels", async () => {
      const org = await createTestOrg(drizzle);
      const admin = await createTestUser(drizzle, "admin", "Admin User");
      const auditor1 = await createTestUser(drizzle, "auditor1", "Auditor 1");
      const auditor2 = await createTestUser(drizzle, "auditor2", "Auditor 2");

      const encryptionKey = await service.createOrgEncryptionKey({
        organizationId: org.id,
        wrappedOrgKey: "base64encodedwrappedkey",
        salt: "base64encodedsalt",
        iv: "base64encodediv",
      });

      // Grant access to auditor1 with expiry
      const expiresAt = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000);
      await service.grantAuditorAccess({
        organizationId: org.id,
        auditorUserId: auditor1.id,
        grantedByUserId: admin.id,
        encryptionKeyId: encryptionKey.id,
        wrappedOrgKey: "rsawrappedorgkey1",
        expiresAt,
      });

      // Grant access to auditor2 without expiry
      await service.grantAuditorAccess({
        organizationId: org.id,
        auditorUserId: auditor2.id,
        grantedByUserId: admin.id,
        encryptionKeyId: encryptionKey.id,
        wrappedOrgKey: "rsawrappedorgkey2",
      });

      // Verify both have access
      const auditor1Access = await service.getAuditorAccess(org.id, auditor1.id);
      const auditor2Access = await service.getAuditorAccess(org.id, auditor2.id);

      expect(auditor1Access).not.toBeNull();
      expect(auditor2Access).not.toBeNull();
      expect(auditor1Access?.expiresAt).not.toBeNull();
      expect(auditor2Access?.expiresAt).toBeNull();

      // List all access
      const allAccess = await service.listAuditorAccess(org.id);
      expect(allAccess).toHaveLength(2);
    });
  });

  void describe("Access Expiry and Revocation", () => {
    void it("should prevent access after expiry date", async () => {
      const org = await createTestOrg(drizzle);
      const admin = await createTestUser(drizzle, "admin", "Admin User");
      const auditor = await createTestUser(drizzle, "auditor", "Auditor User");

      const encryptionKey = await service.createOrgEncryptionKey({
        organizationId: org.id,
        wrappedOrgKey: "base64encodedwrappedkey",
        salt: "base64encodedsalt",
        iv: "base64encodediv",
      });

      // Grant access that already expired
      const expiredDate = new Date(Date.now() - 24 * 60 * 60 * 1000); // 1 day ago

      await service.grantAuditorAccess({
        organizationId: org.id,
        auditorUserId: auditor.id,
        grantedByUserId: admin.id,
        encryptionKeyId: encryptionKey.id,
        wrappedOrgKey: "rsawrappedorgkey",
        expiresAt: expiredDate,
      });

      // Verify auditor cannot access (expired)
      const auditorAccess = await service.getAuditorAccess(org.id, auditor.id);
      expect(auditorAccess).toBeNull();
    });

    void it("should track revocation details", async () => {
      const org = await createTestOrg(drizzle);
      const admin = await createTestUser(drizzle, "admin", "Admin User");
      const auditor = await createTestUser(drizzle, "auditor", "Auditor User");
      const revoker = await createTestUser(drizzle, "revoker", "Revoker User");

      const encryptionKey = await service.createOrgEncryptionKey({
        organizationId: org.id,
        wrappedOrgKey: "base64encodedwrappedkey",
        salt: "base64encodedsalt",
        iv: "base64encodediv",
      });

      const access = await service.grantAuditorAccess({
        organizationId: org.id,
        auditorUserId: auditor.id,
        grantedByUserId: admin.id,
        encryptionKeyId: encryptionKey.id,
        wrappedOrgKey: "rsawrappedorgkey",
      });

      // Revoke access
      await service.revokeAuditorAccess(access.id, revoker.id);

      // Verify in list (shows revoked status)
      const allAccess = await service.listAuditorAccess(org.id);
      const revokedAccess = allAccess.find((a) => a.id === access.id);

      expect(revokedAccess?.isRevoked).toBe(true);

      // But cannot be retrieved via getAuditorAccess
      const activeAccess = await service.getAuditorAccess(org.id, auditor.id);
      expect(activeAccess).toBeNull();
    });
  });

  void describe("Key Version Management", () => {
    void it("should track file encryption with key versions", async () => {
      const org = await createTestOrg(drizzle);
      const user = await createTestUser(drizzle);

      const encryptionKey = await service.createOrgEncryptionKey({
        organizationId: org.id,
        wrappedOrgKey: "base64encodedwrappedkey",
        salt: "base64encodedsalt",
        iv: "base64encodediv",
      });

      // Store file with key version 1
      const fileId1 = "550e8400-e29b-41d4-a716-446655440001";
      await service.storeFileEncryptionMetadata({
        fileId: fileId1,
        encryptionKeyId: encryptionKey.id,
        keyVersion: 1,
        iv: "fileiv1",
        authTag: "authtag1",
        chunkSize: 131072,
        encryptedBy: user.id,
      });

      // Simulate key rotation (would create new key with version 2)
      // For now, verify version is tracked correctly
      const metadata = await service.getFileEncryptionMetadata(fileId1);
      expect(metadata?.keyVersion).toBe(1);
      expect(metadata?.encryptionKeyId).toBe(encryptionKey.id);
    });
  });
});
