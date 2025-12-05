import type { DrizzleClient } from "@safee/database";
import { schema } from "@safee/database";
import { ClientEncryptionService } from "../services/clientEncryption.service.js";

export interface TestOrganization {
  id: string;
  name: string;
  slug: string;
}

export interface TestUser {
  id: string;
  email: string;
  name: string | null;
}

export interface TestEncryptionKey {
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

/**
 * Create a test organization
 */
export async function createTestOrg(drizzle: DrizzleClient, suffix?: string): Promise<TestOrganization> {
  const timestamp = Date.now();
  const uniqueSuffix = suffix || `${timestamp}`;

  const [org] = await drizzle
    .insert(schema.organizations)
    .values({
      name: `Test Org ${uniqueSuffix}`,
      slug: `test-org-${uniqueSuffix}`,
    })
    .returning();

  return org;
}

/**
 * Create a test user
 */
export async function createTestUser(
  drizzle: DrizzleClient,
  suffix?: string,
  namePrefix = "Test User",
): Promise<TestUser> {
  const timestamp = Date.now();
  const uniqueSuffix = suffix || `${timestamp}`;

  const [user] = await drizzle
    .insert(schema.users)
    .values({
      email: `test-${uniqueSuffix}@example.com`,
      name: `${namePrefix} ${uniqueSuffix}`,
    })
    .returning();

  return user;
}

/**
 * Create a test encryption key for an organization
 */
export async function createTestEncryptionKey(
  service: ClientEncryptionService,
  organizationId: string,
  customData?: Partial<{
    wrappedOrgKey: string;
    salt: string;
    iv: string;
    derivationParams: {
      iterations: number;
      hash: string;
      keyLength: number;
    };
  }>,
): Promise<TestEncryptionKey> {
  return await service.createOrgEncryptionKey({
    organizationId,
    wrappedOrgKey: customData?.wrappedOrgKey || "base64encodedwrappedkey",
    salt: customData?.salt || "base64encodedsalt",
    iv: customData?.iv || "base64encodediv",
    derivationParams: customData?.derivationParams,
  });
}

/**
 * Grant test auditor access
 */
export async function grantTestAuditorAccess(
  service: ClientEncryptionService,
  params: {
    organizationId: string;
    auditorUserId: string;
    grantedByUserId: string;
    encryptionKeyId: string;
    expiresAt?: Date;
  },
) {
  return await service.grantAuditorAccess({
    ...params,
    wrappedOrgKey: "rsawrappedorgkey",
  });
}

/**
 * Clean up encryption tables for tests
 */
export async function cleanupEncryptionTables(drizzle: DrizzleClient): Promise<void> {
  await drizzle.delete(schema.fileEncryptionMetadata);
  await drizzle.delete(schema.auditorAccess);
  await drizzle.delete(schema.userKeypairs);
  await drizzle.delete(schema.encryptionKeys);
  await drizzle.delete(schema.users);
  await drizzle.delete(schema.organizations);
}
