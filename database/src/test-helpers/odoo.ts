import type { OdooClient } from "../odoo/client.js";

/**
 * Cleanup test Odoo databases
 * Deletes all databases matching the pattern: odoo_test_org_*
 */
export async function cleanupTestOdooDatabases(
  odooClient: OdooClient,
  adminPassword: string,
): Promise<{
  deleted: string[];
  failed: string[];
  totalDeleted: number;
}> {
  const testDbPattern = /^odoo_test_org_/;

  const databases = await odooClient.listDatabases();
  const testDatabases = databases.filter((db) => testDbPattern.test(db));

  const deleted: string[] = [];
  const failed: string[] = [];

  for (const db of testDatabases) {
    try {
      await odooClient.dropDatabase(adminPassword, db);
      deleted.push(db);
    } catch (err) {
      failed.push(db);
    }
  }

  return {
    deleted,
    failed,
    totalDeleted: deleted.length,
  };
}
