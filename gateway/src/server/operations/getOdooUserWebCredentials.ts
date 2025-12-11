/**
 * Get Odoo User Web Credentials Operation
 *
 * Retrieves and decrypts user web credentials for accessing Odoo UI
 */

import type { DrizzleClient } from "@safee/database";
import { schema } from "@safee/database";
import { eq, and } from "@safee/database";
import { encryptionService } from "../services/encryption.js";

export interface OdooUserWebCredentials {
  login: string;
  password: string;
  webUrl: string;
}

export async function getOdooUserWebCredentials(
  drizzle: DrizzleClient,
  userId: string,
  organizationId: string,
): Promise<OdooUserWebCredentials | null> {
  const odooDb = await drizzle.query.odooDatabases.findFirst({
    where: eq(schema.odooDatabases.organizationId, organizationId),
  });

  if (!odooDb) {
    return null;
  }

  const odooUser = await drizzle.query.odooUsers.findFirst({
    where: and(eq(schema.odooUsers.userId, userId), eq(schema.odooUsers.odooDatabaseId, odooDb.id)),
  });

  if (!odooUser?.password) {
    return null;
  }

  // Decrypt the web password
  const password = encryptionService.decrypt(odooUser.password);

  return {
    login: odooUser.odooLogin,
    password,
    webUrl: `${odooDb.odooUrl}/web/login?db=${odooDb.databaseName}`,
  };
}
