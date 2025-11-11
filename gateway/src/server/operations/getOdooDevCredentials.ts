import type { DrizzleClient } from "@safee/database";
import { schema } from "@safee/database";
import { eq, and } from "drizzle-orm";
import { encryptionService } from "../services/encryption.js";

export async function getOdooDevCredentials(
  drizzle: DrizzleClient,
  userId: string,
  organizationId: string,
): Promise<{
  login: string;
  password: string;
  webUrl: string;
} | null> {
  const odooDb = await drizzle.query.odooDatabases.findFirst({
    where: eq(schema.odooDatabases.organizationId, organizationId),
  });

  if (!odooDb) {
    return null;
  }

  const odooUser = await drizzle.query.odooUsers.findFirst({
    where: and(eq(schema.odooUsers.userId, userId), eq(schema.odooUsers.odooDatabaseId, odooDb.id)),
  });

  if (!odooUser || !odooUser.odooWebPassword) {
    return null;
  }

  return {
    login: odooUser.odooLogin,
    password: encryptionService.decrypt(odooUser.odooWebPassword),
    webUrl: `${odooDb.odooUrl}/web/login?db=${odooDb.databaseName}`,
  };
}
