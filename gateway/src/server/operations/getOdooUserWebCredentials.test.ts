import { describe, it, expect, beforeAll, afterAll, beforeEach } from "vitest";
import { type DrizzleClient, schema } from "@safee/database";
import { connectTest } from "@safee/database/test-helpers";
import { getOdooUserWebCredentials } from "./getOdooUserWebCredentials.js";
import { odoo } from "@safee/database";
const encryptionService = new odoo.EncryptionService(
  process.env.JWT_SECRET ?? "development-encryption-key-change-in-production",
);

void describe("getOdooUserWebCredentials", async () => {
  let drizzle: DrizzleClient;
  let close: () => Promise<void>;
  let org: typeof schema.organizations.$inferSelect;
  let user: typeof schema.users.$inferSelect;

  beforeAll(async () => {
    ({ drizzle, close } = await connectTest({ appName: "odoo-user-web-creds-test" }));
  });

  beforeEach(async () => {
    const timestamp = `${Date.now()}-${Math.random().toString(36).substring(7)}`;
    [org] = await drizzle
      .insert(schema.organizations)
      .values({
        name: `Test Org ${timestamp}`,
        slug: `test-org-${timestamp}`,
      })
      .returning();

    [user] = await drizzle
      .insert(schema.users)
      .values({
        email: `test-${timestamp}@example.com`,
        name: "Test User",
      })
      .returning();
  });

  afterAll(async () => {
    await close();
  });

  it("should retrieve and decrypt user web credentials with database info", async () => {
    const [odooDb] = await drizzle
      .insert(schema.odooDatabases)
      .values({
        organizationId: org.id,
        databaseName: "odoo_test_db",
        adminLogin: "admin",
        adminPassword: encryptionService.encrypt("admin-pass"),
        odooUrl: "http://localhost:8069",
      })
      .returning();

    const testPassword = "user-password-xyz";
    const encryptedPassword = encryptionService.encrypt(testPassword);

    await drizzle.insert(schema.odooUsers).values({
      userId: user.id,
      odooDatabaseId: odooDb.id,
      odooUid: 123,
      odooLogin: "user@example.com",
      password: encryptedPassword,
      apiKey: null, // No API key in this test
    });

    const credentials = await getOdooUserWebCredentials(drizzle, user.id, org.id);

    expect(credentials).not.toBeNull();
    expect(credentials?.login).toBe("user@example.com");
    expect(credentials?.password).toBe(testPassword);
    expect(credentials?.webUrl).toContain("http://localhost:8069/web/login");
    expect(credentials?.webUrl).toContain("db=odoo_test_db");
  });

  it("should return null for non-existent user", async () => {
    const fakeUserId = "00000000-0000-0000-0000-000000000000";
    const fakeOrgId = "00000000-0000-0000-0000-000000000001";

    const credentials = await getOdooUserWebCredentials(drizzle, fakeUserId, fakeOrgId);

    expect(credentials).toBeNull();
  });

  it("should return null if user has no odoo account", async () => {
    const credentials = await getOdooUserWebCredentials(drizzle, user.id, org.id);

    expect(credentials).toBeNull();
  });

  it("should handle HTTPS URLs correctly", async () => {
    const [odooDb] = await drizzle
      .insert(schema.odooDatabases)
      .values({
        organizationId: org.id,
        databaseName: "secure_db",
        adminLogin: "admin",
        adminPassword: encryptionService.encrypt("admin-pass"),
        odooUrl: "https://secure.odoo.example.com:443",
      })
      .returning();

    await drizzle.insert(schema.odooUsers).values({
      userId: user.id,
      odooDatabaseId: odooDb.id,
      odooUid: 456,
      odooLogin: "secure@example.com",
      password: encryptionService.encrypt("secure-pass"),
      apiKey: null,
    });

    const credentials = await getOdooUserWebCredentials(drizzle, user.id, org.id);

    expect(credentials?.webUrl).toContain("https://secure.odoo.example.com:443/web/login");
    expect(credentials?.webUrl).toContain("db=secure_db");
  });

  it("should decrypt complex passwords correctly", async () => {
    const [odooDb] = await drizzle
      .insert(schema.odooDatabases)
      .values({
        organizationId: org.id,
        databaseName: "complex_db",
        adminLogin: "admin",
        adminPassword: encryptionService.encrypt("admin-pass"),
        odooUrl: "http://localhost:8069",
      })
      .returning();

    const complexPassword = "C0mpl3x!P@ssw0rd#2024$%&*()_+-=[]{}|;':\",./<>?";
    const encryptedPassword = encryptionService.encrypt(complexPassword);

    await drizzle.insert(schema.odooUsers).values({
      userId: user.id,
      odooDatabaseId: odooDb.id,
      odooUid: 789,
      odooLogin: "complex@example.com",
      password: encryptedPassword,
      apiKey: null,
    });

    const credentials = await getOdooUserWebCredentials(drizzle, user.id, org.id);

    expect(credentials?.password).toBe(complexPassword);
    expect(credentials?.password).not.toBe(encryptedPassword);
  });

  it("should not return credentials for different organization", async () => {
    const timestamp = `${Date.now()}-${Math.random().toString(36).substring(7)}`;
    const [org2] = await drizzle
      .insert(schema.organizations)
      .values({
        name: `Different Org ${timestamp}`,
        slug: `diff-org-${timestamp}`,
      })
      .returning();

    const [odooDb] = await drizzle
      .insert(schema.odooDatabases)
      .values({
        organizationId: org.id, // Original org
        databaseName: "org1_db",
        adminLogin: "admin",
        adminPassword: encryptionService.encrypt("admin-pass"),
        odooUrl: "http://localhost:8069",
      })
      .returning();

    await drizzle.insert(schema.odooUsers).values({
      userId: user.id,
      odooDatabaseId: odooDb.id,
      odooUid: 999,
      odooLogin: "user@org1.com",
      password: encryptionService.encrypt("password"),
      apiKey: null,
    });

    // Try to get credentials with different org ID
    const credentials = await getOdooUserWebCredentials(drizzle, user.id, org2.id);

    expect(credentials).toBeNull();
  });

  it("should handle database names with special characters in URL", async () => {
    const [odooDb] = await drizzle
      .insert(schema.odooDatabases)
      .values({
        organizationId: org.id,
        databaseName: "test_db-2024",
        adminLogin: "admin",
        adminPassword: encryptionService.encrypt("admin-pass"),
        odooUrl: "http://localhost:8069",
      })
      .returning();

    await drizzle.insert(schema.odooUsers).values({
      userId: user.id,
      odooDatabaseId: odooDb.id,
      odooUid: 111,
      odooLogin: "test@example.com",
      password: encryptionService.encrypt("password"),
      apiKey: null,
    });

    const credentials = await getOdooUserWebCredentials(drizzle, user.id, org.id);

    expect(credentials?.webUrl).toContain("db=test_db-2024");
  });

  it("should include correct odooUid in response", async () => {
    const [odooDb] = await drizzle
      .insert(schema.odooDatabases)
      .values({
        organizationId: org.id,
        databaseName: "uid_test_db",
        adminLogin: "admin",
        adminPassword: encryptionService.encrypt("admin-pass"),
        odooUrl: "http://localhost:8069",
      })
      .returning();

    const expectedUid = 42;

    await drizzle.insert(schema.odooUsers).values({
      userId: user.id,
      odooDatabaseId: odooDb.id,
      odooUid: expectedUid,
      odooLogin: "uid@example.com",
      password: encryptionService.encrypt("password"),
      apiKey: null,
    });

    const credentials = await getOdooUserWebCredentials(drizzle, user.id, org.id);

    expect(credentials?.odooUid).toBe(expectedUid);
  });
});
