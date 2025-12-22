import { describe, it, expect, beforeAll, afterAll, beforeEach } from "vitest";
import { type DrizzleClient, schema } from "@safee/database";
import { connectTest } from "@safee/database/test-helpers";
import { getOdooDevCredentials } from "./getOdooDevCredentials.js";
import { odoo } from "@safee/database";
const encryptionService = new odoo.EncryptionService(process.env.JWT_SECRET ?? "development-encryption-key-change-in-production");

void describe("getOdooDevCredentials", async () => {
  let drizzle: DrizzleClient;
  let close: () => Promise<void>;
  let org: typeof schema.organizations.$inferSelect;
  let user: typeof schema.users.$inferSelect;

  beforeAll(async () => {
    ({ drizzle, close } = await connectTest({ appName: "odoo-dev-credentials-test" }));
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

  it("should retrieve and decrypt user web credentials", async () => {
    const [odooDb] = await drizzle
      .insert(schema.odooDatabases)
      .values({
        organizationId: org.id,
        databaseName: "odoo_test",
        adminLogin: "admin",
        adminPassword: encryptionService.encrypt("admin-pass"),
        odooUrl: "http://localhost:8069",
      })
      .returning();

    const testPassword = "user-web-password-123";
    const encryptedPassword = encryptionService.encrypt(testPassword);

    await drizzle.insert(schema.odooUsers).values({
      userId: user.id,
      odooDatabaseId: odooDb.id,
      odooUid: 1,
      odooLogin: "test@example.com",
      password: encryptedPassword,
      apiKey: null, // No API key in this test
    });

    const credentials = await getOdooDevCredentials(drizzle, user.id, org.id);

    expect(credentials).not.toBeNull();
    expect(credentials?.login).toBe("test@example.com");
    expect(credentials?.password).toBe(testPassword);
    expect(credentials?.webUrl).toContain("http://localhost:8069/web/login");
  });

  it("should return null for non-existent user", async () => {
    const fakeUserId = "00000000-0000-0000-0000-000000000000";
    const fakeOrgId = "00000000-0000-0000-0000-000000000001";

    const credentials = await getOdooDevCredentials(drizzle, fakeUserId, fakeOrgId);

    expect(credentials).toBeNull();
  });
});
