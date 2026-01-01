import { describe, it, expect, beforeAll, afterAll, beforeEach } from "vitest";
import { type DrizzleClient, schema } from "@safee/database";
import { connectTest } from "@safee/database/test-helpers";
import { getOdooAdminCredentials } from "./getOdooAdminCredentials.js";
import { odoo } from "@safee/database";
const encryptionService = new odoo.EncryptionService(
  process.env.JWT_SECRET ?? "development-encryption-key-change-in-production",
);

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

  it("should return null when organization exists but has no odoo database", async () => {
    const [org] = await drizzle
      .insert(schema.organizations)
      .values({
        name: "Org Without Odoo",
        slug: "org-no-odoo",
      })
      .returning();

    const credentials = await getOdooAdminCredentials(drizzle, org.id);

    expect(credentials).toBeNull();
  });

  it("should handle multiple organizations independently", async () => {
    const [org1] = await drizzle
      .insert(schema.organizations)
      .values({
        name: "Test Org 1",
        slug: "test-org-1-multi",
      })
      .returning();

    const [org2] = await drizzle
      .insert(schema.organizations)
      .values({
        name: "Test Org 2",
        slug: "test-org-2-multi",
      })
      .returning();

    const password1 = "org1-admin-password";
    const password2 = "org2-admin-password";

    await drizzle.insert(schema.odooDatabases).values({
      organizationId: org1.id,
      databaseName: "odoo_org1",
      adminLogin: "admin1",
      adminPassword: encryptionService.encrypt(password1),
      odooUrl: "http://localhost:8069",
    });

    await drizzle.insert(schema.odooDatabases).values({
      organizationId: org2.id,
      databaseName: "odoo_org2",
      adminLogin: "admin2",
      adminPassword: encryptionService.encrypt(password2),
      odooUrl: "http://odoo2.example.com",
    });

    const creds1 = await getOdooAdminCredentials(drizzle, org1.id);
    const creds2 = await getOdooAdminCredentials(drizzle, org2.id);

    expect(creds1?.databaseName).toBe("odoo_org1");
    expect(creds1?.adminLogin).toBe("admin1");
    expect(creds1?.adminPassword).toBe(password1);
    expect(creds1?.odooUrl).toBe("http://localhost:8069");

    expect(creds2?.databaseName).toBe("odoo_org2");
    expect(creds2?.adminLogin).toBe("admin2");
    expect(creds2?.adminPassword).toBe(password2);
    expect(creds2?.odooUrl).toBe("http://odoo2.example.com");
  });

  it("should correctly decrypt password with special characters", async () => {
    const [org] = await drizzle
      .insert(schema.organizations)
      .values({
        name: "Special Chars Org",
        slug: "special-chars-org",
      })
      .returning();

    const complexPassword = "P@ssw0rd!#$%^&*()_+-=[]{}|;:,.<>?/~`";
    const encryptedPassword = encryptionService.encrypt(complexPassword);

    await drizzle.insert(schema.odooDatabases).values({
      organizationId: org.id,
      databaseName: "odoo_special",
      adminLogin: "admin_special",
      adminPassword: encryptedPassword,
      odooUrl: "http://localhost:8069",
    });

    const credentials = await getOdooAdminCredentials(drizzle, org.id);

    expect(credentials?.adminPassword).toBe(complexPassword);
  });

  it("should handle different odoo URL formats", async () => {
    const [org] = await drizzle
      .insert(schema.organizations)
      .values({
        name: "HTTPS Org",
        slug: "https-org",
      })
      .returning();

    await drizzle.insert(schema.odooDatabases).values({
      organizationId: org.id,
      databaseName: "odoo_https",
      adminLogin: "admin",
      adminPassword: encryptionService.encrypt("password"),
      odooUrl: "https://odoo.example.com:8443",
    });

    const credentials = await getOdooAdminCredentials(drizzle, org.id);

    expect(credentials?.odooUrl).toBe("https://odoo.example.com:8443");
  });
});
