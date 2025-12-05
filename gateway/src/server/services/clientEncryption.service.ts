import { eq, and, schema } from "@safee/database";
import type { DrizzleClient } from "@safee/database";

export interface EncryptionKeyData {
  id: string;
  organizationId: string;
  wrappedOrgKey: string;
  salt: string;
  iv: string;
  keyVersion: number;
  algorithm: string;
  derivationParams: {
    iterations: number;
    hash: string;
    keyLength: number;
  };
  isActive: boolean;
}

export interface AuditorAccessData {
  id: string;
  auditorUserId: string;
  wrappedOrgKey: string;
  expiresAt: Date | null;
  isRevoked: boolean;
}

export interface FileEncryptionMetadataData {
  id: string;
  fileId: string;
  encryptionKeyId: string;
  keyVersion: number;
  iv: string;
  authTag: string;
  algorithm: string;
  chunkSize: number;
  isEncrypted: boolean;
  encryptedAt: Date;
  encryptedBy: string;
}

export class ClientEncryptionService {
  constructor(private db: DrizzleClient) {}

  /**
   * Get active organization encryption key
   */
  async getOrgEncryptionKey(organizationId: string): Promise<EncryptionKeyData | null> {
    const key = await this.db.query.encryptionKeys.findFirst({
      where: and(
        eq(schema.encryptionKeys.organizationId, organizationId),
        eq(schema.encryptionKeys.isActive, true),
      ),
    });

    if (!key) {
      return null;
    }

    return {
      id: key.id,
      organizationId: key.organizationId,
      wrappedOrgKey: key.wrappedOrgKey,
      salt: key.salt,
      iv: key.iv,
      keyVersion: key.keyVersion,
      algorithm: key.algorithm,
      derivationParams: key.derivationParams as {
        iterations: number;
        hash: string;
        keyLength: number;
      },
      isActive: key.isActive,
    };
  }

  /**
   * Create new organization encryption key
   */
  async createOrgEncryptionKey(data: {
    organizationId: string;
    wrappedOrgKey: string;
    salt: string;
    iv: string;
    derivationParams?: {
      iterations: number;
      hash: string;
      keyLength: number;
    };
  }): Promise<EncryptionKeyData> {
    const [key] = await this.db
      .insert(schema.encryptionKeys)
      .values({
        organizationId: data.organizationId,
        wrappedOrgKey: data.wrappedOrgKey,
        salt: data.salt,
        iv: data.iv,
        keyVersion: 1,
        algorithm: "AES-256-GCM",
        derivationParams: data.derivationParams || {
          iterations: 600000,
          hash: "SHA-256",
          keyLength: 32,
        },
        isActive: true,
      })
      .returning();

    return {
      id: key.id,
      organizationId: key.organizationId,
      wrappedOrgKey: key.wrappedOrgKey,
      salt: key.salt,
      iv: key.iv,
      keyVersion: key.keyVersion,
      algorithm: key.algorithm,
      derivationParams: key.derivationParams as {
        iterations: number;
        hash: string;
        keyLength: number;
      },
      isActive: key.isActive,
    };
  }

  /**
   * Grant auditor access to encrypted files
   */
  async grantAuditorAccess(data: {
    organizationId: string;
    auditorUserId: string;
    grantedByUserId: string;
    encryptionKeyId: string;
    wrappedOrgKey: string;
    expiresAt?: Date;
  }): Promise<AuditorAccessData> {
    const [access] = await this.db.insert(schema.auditorAccess).values(data).returning();

    return {
      id: access.id,
      auditorUserId: access.auditorUserId,
      wrappedOrgKey: access.wrappedOrgKey,
      expiresAt: access.expiresAt,
      isRevoked: access.isRevoked,
    };
  }

  /**
   * Get auditor access for a user in an organization
   */
  async getAuditorAccess(organizationId: string, auditorUserId: string): Promise<AuditorAccessData | null> {
    const access = await this.db.query.auditorAccess.findFirst({
      where: and(
        eq(schema.auditorAccess.organizationId, organizationId),
        eq(schema.auditorAccess.auditorUserId, auditorUserId),
        eq(schema.auditorAccess.isRevoked, false),
      ),
    });

    if (!access) {
      return null;
    }

    // Check expiry
    if (access.expiresAt && new Date() > access.expiresAt) {
      return null;
    }

    return {
      id: access.id,
      auditorUserId: access.auditorUserId,
      wrappedOrgKey: access.wrappedOrgKey,
      expiresAt: access.expiresAt,
      isRevoked: access.isRevoked,
    };
  }

  /**
   * Revoke auditor access
   */
  async revokeAuditorAccess(accessId: string, revokedByUserId: string): Promise<void> {
    await this.db
      .update(schema.auditorAccess)
      .set({
        isRevoked: true,
        revokedAt: new Date(),
        revokedByUserId,
      })
      .where(eq(schema.auditorAccess.id, accessId));
  }

  /**
   * List all auditor access grants for an organization
   */
  async listAuditorAccess(organizationId: string): Promise<AuditorAccessData[]> {
    const accessList = await this.db.query.auditorAccess.findMany({
      where: eq(schema.auditorAccess.organizationId, organizationId),
    });

    return accessList.map((access) => ({
      id: access.id,
      auditorUserId: access.auditorUserId,
      wrappedOrgKey: access.wrappedOrgKey,
      expiresAt: access.expiresAt,
      isRevoked: access.isRevoked,
    }));
  }

  /**
   * Store file encryption metadata
   */
  async storeFileEncryptionMetadata(data: {
    fileId: string;
    encryptionKeyId: string;
    keyVersion: number;
    iv: string;
    authTag: string;
    chunkSize: number;
    encryptedBy: string;
  }): Promise<void> {
    await this.db.insert(schema.fileEncryptionMetadata).values({
      ...data,
      algorithm: "AES-256-GCM",
      isEncrypted: true,
    });
  }

  /**
   * Get file encryption metadata
   */
  async getFileEncryptionMetadata(fileId: string): Promise<FileEncryptionMetadataData | null> {
    const metadata = await this.db.query.fileEncryptionMetadata.findFirst({
      where: eq(schema.fileEncryptionMetadata.fileId, fileId),
    });

    if (!metadata) {
      return null;
    }

    return {
      id: metadata.id,
      fileId: metadata.fileId,
      encryptionKeyId: metadata.encryptionKeyId,
      keyVersion: metadata.keyVersion,
      iv: metadata.iv,
      authTag: metadata.authTag,
      algorithm: metadata.algorithm,
      chunkSize: metadata.chunkSize,
      isEncrypted: metadata.isEncrypted,
      encryptedAt: metadata.encryptedAt,
      encryptedBy: metadata.encryptedBy,
    };
  }
}
