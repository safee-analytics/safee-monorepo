/**
 * Get Odoo Admin Credentials Operation
 *
 * Retrieves and decrypts admin credentials for an organization's Odoo database
 */

import type { DrizzleClient } from "@safee/database";
import { schema } from "@safee/database";
import { eq } from "drizzle-orm";
import { encryptionService } from "../services/encryption.js";

export interface OdooAdminCredentials {
  databaseName: string;
  adminLogin: string;
  adminPassword: string;
  odooUrl: string;
}

export async function getOdooAdminCredentials(
  drizzle: DrizzleClient,
  organizationId: string,
): Promise<OdooAdminCredentials | null> {
  const dbRecord = await drizzle.query.odooDatabases.findFirst({
    where: eq(schema.odooDatabases.organizationId, organizationId),
  });

  if (!dbRecord) {
    return null;
  }

  // Decrypt the admin password
  const adminPassword = encryptionService.decrypt(dbRecord.adminPassword);

  return {
    databaseName: dbRecord.databaseName,
    adminLogin: dbRecord.adminLogin,
    adminPassword,
    odooUrl: dbRecord.odooUrl,
  };
}
