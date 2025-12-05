import { describe, it, expect, beforeAll, afterAll, beforeEach } from "vitest";
import { type DrizzleClient } from "@safee/database";
import { connectTest } from "@safee/database/test-helpers";
import {
  cleanupEncryptionTables,
  createTestOrg,
  createTestUser,
  createTestEncryptionKey,
  grantTestAuditorAccess,
} from "../test-helpers/encryptionTestHelpers.js";
import { ClientEncryptionService } from "./clientEncryption.service.js";

void describe("ClientEncryptionService", async () => {
  let drizzle: DrizzleClient;
  let close: () => Promise<void>;
  let service: ClientEncryptionService;

  beforeAll(async () => {
    ({ drizzle, close } = await connectTest({ appName: "client-encryption-service-test" }));
  });

  beforeEach(async () => {
    await cleanupEncryptionTables(drizzle);
    service = new ClientEncryptionService(drizzle);
  });

  afterAll(async () => {
    await close();
  });

  void describe("getOrgEncryptionKey", () => {
    void it("should return null when no encryption key exists", async () => {
      const org = await createTestOrg(drizzle);

      const result = await service.getOrgEncryptionKey(org.id);

      expect(result).toBeNull();
    });

    void it("should return active encryption key for organization", async () => {
      const org = await createTestOrg(drizzle);

      const keyData = {
        wrappedOrgKey: "base64encodedwrappedkey",
        salt: "base64encodedsalt",
        iv: "base64encodediv",
        derivationParams: {
          iterations: 600000,
          hash: "SHA-256",
          keyLength: 32,
        },
      };

      const createdKey = await createTestEncryptionKey(service, org.id, keyData);

      const result = await service.getOrgEncryptionKey(org.id);

      expect(result).not.toBeNull();
      expect(result?.id).toBe(createdKey.id);
      expect(result?.organizationId).toBe(org.id);
      expect(result?.wrappedOrgKey).toBe(keyData.wrappedOrgKey);
      expect(result?.salt).toBe(keyData.salt);
      expect(result?.iv).toBe(keyData.iv);
      expect(result?.keyVersion).toBe(1);
      expect(result?.algorithm).toBe("AES-256-GCM");
      expect(result?.isActive).toBe(true);
      expect(result?.derivationParams).toEqual(keyData.derivationParams);
    });

    void it("should only return active encryption key", async () => {
      const org = await createTestOrg(drizzle);

      // Create inactive key manually
      const { schema } = await import("@safee/database");
      await drizzle.insert(schema.encryptionKeys).values({
        organizationId: org.id,
        wrappedOrgKey: "inactivewrappedkey",
        salt: "inactivesalt",
        iv: "inactiveiv",
        keyVersion: 1,
        algorithm: "AES-256-GCM",
        derivationParams: { iterations: 600000, hash: "SHA-256", keyLength: 32 },
        isActive: false,
      });

      const result = await service.getOrgEncryptionKey(org.id);

      expect(result).toBeNull();
    });
  });

  void describe("createOrgEncryptionKey", () => {
    void it("should create encryption key with default derivation params", async () => {
      const org = await createTestOrg(drizzle);

      const result = await service.createOrgEncryptionKey({
        organizationId: org.id,
        wrappedOrgKey: "base64encodedwrappedkey",
        salt: "base64encodedsalt",
        iv: "base64encodediv",
      });

      expect(result.id).toBeDefined();
      expect(result.organizationId).toBe(org.id);
      expect(result.wrappedOrgKey).toBe("base64encodedwrappedkey");
      expect(result.salt).toBe("base64encodedsalt");
      expect(result.iv).toBe("base64encodediv");
      expect(result.keyVersion).toBe(1);
      expect(result.algorithm).toBe("AES-256-GCM");
      expect(result.isActive).toBe(true);
      expect(result.derivationParams).toEqual({
        iterations: 600000,
        hash: "SHA-256",
        keyLength: 32,
      });
    });

    void it("should create encryption key with custom derivation params", async () => {
      const org = await createTestOrg(drizzle);

      const customParams = {
        iterations: 1000000,
        hash: "SHA-512",
        keyLength: 64,
      };

      const result = await createTestEncryptionKey(service, org.id, { derivationParams: customParams });

      expect(result.derivationParams).toEqual(customParams);
    });
  });

  void describe("grantAuditorAccess", () => {
    void it("should grant auditor access successfully", async () => {
      const org = await createTestOrg(drizzle);
      const auditor = await createTestUser(drizzle, "auditor", "Auditor");
      const granter = await createTestUser(drizzle, "granter", "Granter");
      const encryptionKey = await createTestEncryptionKey(service, org.id);

      const expiresAt = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000);

      const result = await service.grantAuditorAccess({
        organizationId: org.id,
        auditorUserId: auditor.id,
        grantedByUserId: granter.id,
        encryptionKeyId: encryptionKey.id,
        wrappedOrgKey: "rsawrappedorgkey",
        expiresAt,
      });

      expect(result.id).toBeDefined();
      expect(result.auditorUserId).toBe(auditor.id);
      expect(result.wrappedOrgKey).toBe("rsawrappedorgkey");
      expect(result.expiresAt).toEqual(expiresAt);
      expect(result.isRevoked).toBe(false);
    });

    void it("should grant auditor access without expiry date", async () => {
      const org = await createTestOrg(drizzle);
      const auditor = await createTestUser(drizzle, "auditor", "Auditor");
      const granter = await createTestUser(drizzle, "granter", "Granter");
      const encryptionKey = await createTestEncryptionKey(service, org.id);

      const result = await grantTestAuditorAccess(service, {
        organizationId: org.id,
        auditorUserId: auditor.id,
        grantedByUserId: granter.id,
        encryptionKeyId: encryptionKey.id,
      });

      expect(result.expiresAt).toBeNull();
    });
  });

  void describe("getAuditorAccess", () => {
    void it("should return null when no auditor access exists", async () => {
      const org = await createTestOrg(drizzle);
      const auditor = await createTestUser(drizzle, "auditor", "Auditor");

      const result = await service.getAuditorAccess(org.id, auditor.id);

      expect(result).toBeNull();
    });

    void it("should return auditor access when it exists and is valid", async () => {
      const org = await createTestOrg(drizzle);
      const auditor = await createTestUser(drizzle, "auditor", "Auditor");
      const granter = await createTestUser(drizzle, "granter", "Granter");
      const encryptionKey = await createTestEncryptionKey(service, org.id);

      const access = await grantTestAuditorAccess(service, {
        organizationId: org.id,
        auditorUserId: auditor.id,
        grantedByUserId: granter.id,
        encryptionKeyId: encryptionKey.id,
      });

      const result = await service.getAuditorAccess(org.id, auditor.id);

      expect(result).not.toBeNull();
      expect(result?.id).toBe(access.id);
      expect(result?.auditorUserId).toBe(auditor.id);
      expect(result?.wrappedOrgKey).toBe("rsawrappedorgkey");
      expect(result?.isRevoked).toBe(false);
    });

    void it("should return null when auditor access is revoked", async () => {
      const org = await createTestOrg(drizzle);
      const auditor = await createTestUser(drizzle, "auditor", "Auditor");
      const granter = await createTestUser(drizzle, "granter", "Granter");
      const encryptionKey = await createTestEncryptionKey(service, org.id);

      const access = await grantTestAuditorAccess(service, {
        organizationId: org.id,
        auditorUserId: auditor.id,
        grantedByUserId: granter.id,
        encryptionKeyId: encryptionKey.id,
      });

      await service.revokeAuditorAccess(access.id, granter.id);

      const result = await service.getAuditorAccess(org.id, auditor.id);

      expect(result).toBeNull();
    });

    void it("should return null when auditor access is expired", async () => {
      const org = await createTestOrg(drizzle);
      const auditor = await createTestUser(drizzle, "auditor", "Auditor");
      const granter = await createTestUser(drizzle, "granter", "Granter");
      const encryptionKey = await createTestEncryptionKey(service, org.id);

      const expiredDate = new Date(Date.now() - 24 * 60 * 60 * 1000);

      await grantTestAuditorAccess(service, {
        organizationId: org.id,
        auditorUserId: auditor.id,
        grantedByUserId: granter.id,
        encryptionKeyId: encryptionKey.id,
        expiresAt: expiredDate,
      });

      const result = await service.getAuditorAccess(org.id, auditor.id);

      expect(result).toBeNull();
    });
  });

  void describe("revokeAuditorAccess", () => {
    void it("should revoke auditor access successfully", async () => {
      const org = await createTestOrg(drizzle);
      const auditor = await createTestUser(drizzle, "auditor", "Auditor");
      const granter = await createTestUser(drizzle, "granter", "Granter");
      const revoker = await createTestUser(drizzle, "revoker", "Revoker");
      const encryptionKey = await createTestEncryptionKey(service, org.id);

      const access = await grantTestAuditorAccess(service, {
        organizationId: org.id,
        auditorUserId: auditor.id,
        grantedByUserId: granter.id,
        encryptionKeyId: encryptionKey.id,
      });

      await service.revokeAuditorAccess(access.id, revoker.id);

      const result = await service.getAuditorAccess(org.id, auditor.id);

      expect(result).toBeNull();
    });
  });

  void describe("listAuditorAccess", () => {
    void it("should return empty array when no auditor access exists", async () => {
      const org = await createTestOrg(drizzle);

      const result = await service.listAuditorAccess(org.id);

      expect(result).toEqual([]);
    });

    void it("should return all auditor access for organization", async () => {
      const org = await createTestOrg(drizzle);
      const auditor1 = await createTestUser(drizzle, "auditor1", "Auditor 1");
      const auditor2 = await createTestUser(drizzle, "auditor2", "Auditor 2");
      const granter = await createTestUser(drizzle, "granter", "Granter");
      const encryptionKey = await createTestEncryptionKey(service, org.id);

      await grantTestAuditorAccess(service, {
        organizationId: org.id,
        auditorUserId: auditor1.id,
        grantedByUserId: granter.id,
        encryptionKeyId: encryptionKey.id,
      });

      await grantTestAuditorAccess(service, {
        organizationId: org.id,
        auditorUserId: auditor2.id,
        grantedByUserId: granter.id,
        encryptionKeyId: encryptionKey.id,
      });

      const result = await service.listAuditorAccess(org.id);

      expect(result).toHaveLength(2);
      expect(result[0].auditorUserId).toBe(auditor1.id);
      expect(result[1].auditorUserId).toBe(auditor2.id);
    });

    void it("should return both revoked and active auditor access", async () => {
      const org = await createTestOrg(drizzle);
      const auditor1 = await createTestUser(drizzle, "auditor1", "Auditor 1");
      const auditor2 = await createTestUser(drizzle, "auditor2", "Auditor 2");
      const granter = await createTestUser(drizzle, "granter", "Granter");
      const encryptionKey = await createTestEncryptionKey(service, org.id);

      const access1 = await grantTestAuditorAccess(service, {
        organizationId: org.id,
        auditorUserId: auditor1.id,
        grantedByUserId: granter.id,
        encryptionKeyId: encryptionKey.id,
      });

      await grantTestAuditorAccess(service, {
        organizationId: org.id,
        auditorUserId: auditor2.id,
        grantedByUserId: granter.id,
        encryptionKeyId: encryptionKey.id,
      });

      await service.revokeAuditorAccess(access1.id, granter.id);

      const result = await service.listAuditorAccess(org.id);

      expect(result).toHaveLength(2);
      expect(result.some((a) => a.isRevoked)).toBe(true);
      expect(result.some((a) => !a.isRevoked)).toBe(true);
    });
  });

  void describe("storeFileEncryptionMetadata", () => {
    void it("should store file encryption metadata successfully", async () => {
      const org = await createTestOrg(drizzle);
      const user = await createTestUser(drizzle);
      const encryptionKey = await createTestEncryptionKey(service, org.id);

      const fileId = "550e8400-e29b-41d4-a716-446655440000";

      await service.storeFileEncryptionMetadata({
        fileId,
        encryptionKeyId: encryptionKey.id,
        keyVersion: 1,
        iv: "fileiv",
        authTag: "authtag",
        chunkSize: 131072,
        encryptedBy: user.id,
      });

      const result = await service.getFileEncryptionMetadata(fileId);

      expect(result).not.toBeNull();
      expect(result?.fileId).toBe(fileId);
      expect(result?.encryptionKeyId).toBe(encryptionKey.id);
      expect(result?.keyVersion).toBe(1);
      expect(result?.iv).toBe("fileiv");
      expect(result?.authTag).toBe("authtag");
      expect(result?.algorithm).toBe("AES-256-GCM");
      expect(result?.chunkSize).toBe(131072);
      expect(result?.isEncrypted).toBe(true);
      expect(result?.encryptedBy).toBe(user.id);
    });
  });

  void describe("getFileEncryptionMetadata", () => {
    void it("should return null when no file encryption metadata exists", async () => {
      const fileId = "550e8400-e29b-41d4-a716-446655440000";

      const result = await service.getFileEncryptionMetadata(fileId);

      expect(result).toBeNull();
    });

    void it("should return file encryption metadata when it exists", async () => {
      const org = await createTestOrg(drizzle);
      const user = await createTestUser(drizzle);
      const encryptionKey = await createTestEncryptionKey(service, org.id);

      const fileId = "550e8400-e29b-41d4-a716-446655440000";

      await service.storeFileEncryptionMetadata({
        fileId,
        encryptionKeyId: encryptionKey.id,
        keyVersion: 1,
        iv: "fileiv",
        authTag: "authtag",
        chunkSize: 131072,
        encryptedBy: user.id,
      });

      const result = await service.getFileEncryptionMetadata(fileId);

      expect(result).not.toBeNull();
      expect(result?.fileId).toBe(fileId);
      expect(result?.iv).toBe("fileiv");
      expect(result?.authTag).toBe("authtag");
    });
  });
});
