/**
 * Get Odoo User Web Credentials Operation
 *
 * Retrieves and decrypts user web credentials for accessing Odoo UI
 */

import type { DrizzleClient } from "@safee/database";
import { schema, eq, and, odoo } from "@safee/database";
import { JWT_SECRET } from "../../env.js";

export interface OdooUserWebCredentials {
  login: string;
  password: string;
  webUrl: string;
  odooUid: number;
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
  const encryptionService = new odoo.EncryptionService(JWT_SECRET);
  const password = encryptionService.decrypt(odooUser.password);

  return {
    login: odooUser.odooLogin,
    password,
    webUrl: `${odooDb.odooUrl}/web/login?db=${odooDb.databaseName}`,
    odooUid: odooUser.odooUid,
  };
}
