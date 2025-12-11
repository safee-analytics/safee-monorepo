import { describe, it, expect, beforeAll, afterAll, beforeEach } from "vitest";
import { type DrizzleClient, schema } from "@safee/database";
import { connectTest } from "@safee/database/test-helpers";
import { getOdooAdminCredentials } from "./getOdooAdminCredentials.js";
import { encryptionService } from "../services/encryption.js";

void describe("getOdooAdminCredentials", async () => {
  let drizzle: DrizzleClient;
  let close: () => Promise<void>;

  beforeAll(async () => {
    ({ drizzle, close } = await connectTest({ appName: "odoo-credentials-test" }));
  });

  beforeEach(async () => {
    await drizzle.delete(schema.odooDatabases);
    await drizzle.delete(schema.organizations);
  });
  afterAll(async () => {
    await close();
  });

  it("should retrieve and decrypt admin credentials for an organization", async () => {
    const [org] = await drizzle
      .insert(schema.organizations)
      .values({
        name: "Test Org for Odoo Credentials",
        slug: "test-odoo-creds",
      })
      .returning();

    const testPassword = "test-admin-password-123";
    const encryptedPassword = encryptionService.encrypt(testPassword);

    const [odooDb] = await drizzle
      .insert(schema.odooDatabases)
      .values({
        organizationId: org.id,
        databaseName: "odoo_test_creds",
        adminLogin: "admin_test",
        adminPassword: encryptedPassword,
        odooUrl: "http://localhost:8069",
      })
      .returning();

    const credentials = await getOdooAdminCredentials(drizzle, org.id);

    expect(credentials).not.toBeNull();
    expect(credentials?.databaseName).toBe(odooDb.databaseName);
    expect(credentials?.adminLogin).toBe(odooDb.adminLogin);
    expect(credentials?.adminPassword).toBe(testPassword);
    expect(credentials?.adminPassword).not.toBe(encryptedPassword);
    expect(credentials?.odooUrl).toBe("http://localhost:8069");
  });

  it("should return null for non-existent organization", async () => {
    const fakeOrgId = "00000000-0000-0000-0000-000000000000";
    const credentials = await getOdooAdminCredentials(drizzle, fakeOrgId);

    expect(credentials).toBeNull();
  });
});
