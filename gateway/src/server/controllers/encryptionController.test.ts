import { describe, it, expect, beforeAll, afterAll, beforeEach, vi } from "vitest";
import {
  type DrizzleClient,
  type RedisClient,
  type Storage,
  type PubSub,
  type JobScheduler,
  schema,
  eq,
} from "@safee/database";
import { connectTest } from "@safee/database/test-helpers";
import { EncryptionController } from "./encryptionController.js";
import type { AuthenticatedRequest } from "../middleware/auth.js";
import type { ServerContext } from "../serverContext.js";
import type { Logger } from "pino";
import type { OdooClientManager } from "../services/odoo/manager.service.js";
import { initServerContext } from "../serverContext.js";
import { ClientEncryptionService } from "../services/clientEncryption.service.js";
import {
  cleanupEncryptionTables,
  createTestOrg,
  createTestUser,
  createTestEncryptionKey,
} from "../test-helpers/encryptionTestHelpers.js";

void describe("EncryptionController", () => {
  let drizzle: DrizzleClient;
  let close: () => Promise<void>;
  let controller: EncryptionController;
  let mockContext: ServerContext;

  beforeAll(async () => {
    ({ drizzle, close } = await connectTest({ appName: "encryption-controller-test" }));

    mockContext = {
      drizzle,
      logger: {
        info: vi.fn(),
        warn: vi.fn(),
        debug: vi.fn(),
        error: vi.fn(),
        child: vi.fn(() => mockContext.logger),
      } as unknown as Logger,
      redis: {} as RedisClient,
      storage: {} as Storage,
      pubsub: {} as PubSub,
      scheduler: {} as JobScheduler,
      odoo: {} as OdooClientManager,
    };

    initServerContext(mockContext);
    controller = new EncryptionController();
  });

  beforeEach(async () => {
    await cleanupEncryptionTables(drizzle);
  });

  afterAll(async () => {
    await close();
  });

  void describe("getEncryptionStatus", () => {
    it("should return disabled when no encryption key exists", async () => {
      const org = await createTestOrg(drizzle);

      const mockRequest = {
        betterAuthSession: {
          user: { id: "test-user-id" },
          session: { activeOrganizationId: org.id },
        },
      } as AuthenticatedRequest;

      const result = await controller.getEncryptionStatus(mockRequest);

      expect(result.enabled).toBe(false);
      expect(result.keyData).toBeUndefined();
    });

    it("should return enabled with key data when encryption is enabled", async () => {
      const org = await createTestOrg(drizzle);
      const service = new ClientEncryptionService(drizzle);

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

      const mockRequest = {
        betterAuthSession: {
          user: { id: "test-user-id" },
          session: { activeOrganizationId: org.id },
        },
      } as AuthenticatedRequest;

      const result = await controller.getEncryptionStatus(mockRequest);

      expect(result.enabled).toBe(true);
      expect(result.keyData).toBeDefined();
      expect(result.keyData?.id).toBe(createdKey.id);
      expect(result.keyData?.salt).toBe(keyData.salt);
      expect(result.keyData?.iv).toBe(keyData.iv);
      expect(result.keyData?.keyVersion).toBe(1);
      expect(result.keyData?.derivationParams).toEqual(keyData.derivationParams);
      expect(result.keyData?.wrappedOrgKey).toBe(keyData.wrappedOrgKey);
    });

    it("should throw error when no active organization", async () => {
      const mockRequest = {
        betterAuthSession: {
          user: { id: "test-user-id" },
          session: {},
        },
      } as AuthenticatedRequest;

      await expect(controller.getEncryptionStatus(mockRequest)).rejects.toThrow("No active organization");
    });
  });

  void describe("setupEncryption", () => {
    it("should enable encryption for organization", async () => {
      const org = await createTestOrg(drizzle);
      const user = await createTestUser(drizzle);

      const mockRequest = {
        betterAuthSession: {
          user: { id: user.id },
          session: { activeOrganizationId: org.id },
        },
      } as AuthenticatedRequest;

      const body = {
        wrappedOrgKey: "base64encodedwrappedkey",
        salt: "base64encodedsalt",
        iv: "base64encodediv",
      };

      const result = await controller.setupEncryption(mockRequest, body);

      expect(result.success).toBe(true);
      expect(result.keyId).toBeDefined();

      // Verify organization was updated
      const updatedOrg = await drizzle.query.organizations.findFirst({
        where: eq(schema.organizations.id, org.id),
      });

      expect(updatedOrg?.encryptionEnabled).toBe(true);
      expect(updatedOrg?.encryptionEnabledBy).toBe(user.id);
      expect(updatedOrg?.encryptionEnabledAt).toBeDefined();
    });

    it("should throw error when encryption already enabled", async () => {
      const org = await createTestOrg(drizzle);
      const user = await createTestUser(drizzle);
      const service = new ClientEncryptionService(drizzle);

      await createTestEncryptionKey(service, org.id);

      const mockRequest = {
        betterAuthSession: {
          user: { id: user.id },
          session: { activeOrganizationId: org.id },
        },
      } as AuthenticatedRequest;

      const body = {
        wrappedOrgKey: "base64encodedwrappedkey",
        salt: "base64encodedsalt",
        iv: "base64encodediv",
      };

      await expect(controller.setupEncryption(mockRequest, body)).rejects.toThrow(
        "Encryption already enabled",
      );
    });

    it("should throw error when no active organization", async () => {
      const mockRequest = {
        betterAuthSession: {
          user: { id: "test-user-id" },
          session: {},
        },
      } as AuthenticatedRequest;

      const body = {
        wrappedOrgKey: "base64encodedwrappedkey",
        salt: "base64encodedsalt",
        iv: "base64encodediv",
      };

      await expect(controller.setupEncryption(mockRequest, body)).rejects.toThrow("No active organization");
    });
  });

  void describe("grantAuditorAccess", () => {
    it("should grant auditor access successfully", async () => {
      const org = await createTestOrg(drizzle);
      const auditor = await createTestUser(drizzle, "auditor", "Auditor");
      const granter = await createTestUser(drizzle, "granter", "Granter");
      const service = new ClientEncryptionService(drizzle);

      await createTestEncryptionKey(service, org.id);

      const mockRequest = {
        betterAuthSession: {
          user: { id: granter.id },
          session: { activeOrganizationId: org.id },
        },
      } as AuthenticatedRequest;

      const body = {
        auditorUserId: auditor.id,
        wrappedOrgKey: "rsawrappedorgkey",
        expiresAt: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(),
      };

      const result = await controller.grantAuditorAccess(mockRequest, body);

      expect(result.success).toBe(true);
      expect(result.accessId).toBeDefined();
    });

    it("should grant auditor access without expiry date", async () => {
      const org = await createTestOrg(drizzle);
      const auditor = await createTestUser(drizzle, "auditor", "Auditor");
      const granter = await createTestUser(drizzle, "granter", "Granter");
      const service = new ClientEncryptionService(drizzle);

      await createTestEncryptionKey(service, org.id);

      const mockRequest = {
        betterAuthSession: {
          user: { id: granter.id },
          session: { activeOrganizationId: org.id },
        },
      } as AuthenticatedRequest;

      const body = {
        auditorUserId: auditor.id,
        wrappedOrgKey: "rsawrappedorgkey",
      };

      const result = await controller.grantAuditorAccess(mockRequest, body);

      expect(result.success).toBe(true);
      expect(result.accessId).toBeDefined();
    });

    it("should throw error when encryption not enabled", async () => {
      const org = await createTestOrg(drizzle);
      const auditor = await createTestUser(drizzle, "auditor", "Auditor");
      const granter = await createTestUser(drizzle, "granter", "Granter");

      const mockRequest = {
        betterAuthSession: {
          user: { id: granter.id },
          session: { activeOrganizationId: org.id },
        },
      } as AuthenticatedRequest;

      const body = {
        auditorUserId: auditor.id,
        wrappedOrgKey: "rsawrappedorgkey",
      };

      await expect(controller.grantAuditorAccess(mockRequest, body)).rejects.toThrow(
        "Encryption not enabled",
      );
    });

    it("should throw error when no active organization", async () => {
      const mockRequest = {
        betterAuthSession: {
          user: { id: "test-user-id" },
          session: {},
        },
      } as AuthenticatedRequest;

      const body = {
        auditorUserId: "auditor-id",
        wrappedOrgKey: "rsawrappedorgkey",
      };

      await expect(controller.grantAuditorAccess(mockRequest, body)).rejects.toThrow(
        "No active organization",
      );
    });
  });

  void describe("getMyAuditorAccess", () => {
    it("should return no access when user has no auditor access", async () => {
      const org = await createTestOrg(drizzle);
      const user = await createTestUser(drizzle);

      const mockRequest = {
        betterAuthSession: {
          user: { id: user.id },
          session: { activeOrganizationId: org.id },
        },
      } as AuthenticatedRequest;

      const result = await controller.getMyAuditorAccess(mockRequest);

      expect(result.hasAccess).toBe(false);
      expect(result.wrappedOrgKey).toBeUndefined();
      expect(result.expiresAt).toBeUndefined();
    });

    it("should return access data when user has auditor access", async () => {
      const org = await createTestOrg(drizzle);
      const auditor = await createTestUser(drizzle, "auditor", "Auditor");
      const granter = await createTestUser(drizzle, "granter", "Granter");
      const service = new ClientEncryptionService(drizzle);

      const encryptionKey = await createTestEncryptionKey(service, org.id);

      const expiresAt = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000);

      await service.grantAuditorAccess({
        organizationId: org.id,
        auditorUserId: auditor.id,
        grantedByUserId: granter.id,
        encryptionKeyId: encryptionKey.id,
        wrappedOrgKey: "rsawrappedorgkey",
        expiresAt,
      });

      const mockRequest = {
        betterAuthSession: {
          user: { id: auditor.id },
          session: { activeOrganizationId: org.id },
        },
      } as AuthenticatedRequest;

      const result = await controller.getMyAuditorAccess(mockRequest);

      expect(result.hasAccess).toBe(true);
      expect(result.wrappedOrgKey).toBe("rsawrappedorgkey");
      expect(result.expiresAt).toBe(expiresAt.toISOString());
    });

    it("should throw error when no active organization", async () => {
      const mockRequest = {
        betterAuthSession: {
          user: { id: "test-user-id" },
          session: {},
        },
      } as AuthenticatedRequest;

      await expect(controller.getMyAuditorAccess(mockRequest)).rejects.toThrow("No active organization");
    });
  });

  void describe("revokeAuditorAccess", () => {
    it("should revoke auditor access successfully", async () => {
      const org = await createTestOrg(drizzle);
      const auditor = await createTestUser(drizzle, "auditor", "Auditor");
      const granter = await createTestUser(drizzle, "granter", "Granter");
      const revoker = await createTestUser(drizzle, "revoker", "Revoker");
      const service = new ClientEncryptionService(drizzle);

      const encryptionKey = await createTestEncryptionKey(service, org.id);

      const access = await service.grantAuditorAccess({
        organizationId: org.id,
        auditorUserId: auditor.id,
        grantedByUserId: granter.id,
        encryptionKeyId: encryptionKey.id,
        wrappedOrgKey: "rsawrappedorgkey",
      });

      const mockRequest = {
        betterAuthSession: {
          user: { id: revoker.id },
          session: { activeOrganizationId: org.id },
        },
      } as AuthenticatedRequest;

      const result = await controller.revokeAuditorAccess(mockRequest, access.id);

      expect(result.success).toBe(true);

      // Verify access was revoked
      const revokedAccess = await service.getAuditorAccess(org.id, auditor.id);
      expect(revokedAccess).toBeNull();
    });
  });
});
