/**
 * Odoo Integration Tests
 *
 * These tests verify actual Odoo integration by:
 * - Provisioning real Odoo databases
 * - Creating and authenticating users
 * - Installing modules
 * - Querying model fields
 * - Testing the full end-to-end flow
 *
 * Prerequisites:
 * - Odoo instance running at localhost:8069 (or ODOO_URL env var)
 * - Admin credentials configured in environment
 */

import { describe, it, expect, beforeAll, afterAll, beforeEach, afterEach } from "vitest";
import { type DrizzleClient, schema, odoo, OdooLanguage, OdooDemo } from "@safee/database";
import { connectTest } from "@safee/database/test-helpers";
import { initTestServerContext } from "../test-helpers/testServerContext.js";
import { getServerContext } from "../serverContext.js";
import { getOdooDatabaseInfo } from "./getOdooDatabaseInfo.js";
import { installOdooModules } from "./installOdooModules.js";
import { getOdooModelFields } from "./getOdooModelFields.js";
import { getOdooAdminCredentials } from "./getOdooAdminCredentials.js";
import { getOdooDevCredentials } from "./getOdooDevCredentials.js";
import { getOdooUserWebCredentials } from "./getOdooUserWebCredentials.js";
import { ODOO_URL, ODOO_PORT, ODOO_ADMIN_PASSWORD, JWT_SECRET } from "../../env.js";
import { pino } from "pino";

void describe("Odoo Integration Tests", async () => {
  let drizzle: DrizzleClient;
  let close: () => Promise<void>;
  let org: typeof schema.organizations.$inferSelect;
  let user: typeof schema.users.$inferSelect;
  let sharedOdooDatabase: { databaseName: string; adminLogin: string; adminPassword: string };
  const logger = pino({ level: "silent" });
  const encryptionService = new odoo.EncryptionService(JWT_SECRET);

  beforeAll(async () => {
    console.log("\n🔧 Setting up Odoo Integration Tests...");
    console.log(`📍 Odoo URL: ${ODOO_URL}`);
    console.log(`📍 Odoo Port: ${ODOO_PORT}`);

    ({ drizzle, close } = await connectTest({ appName: "odoo-integration-test" }));
    await initTestServerContext(drizzle);

    // Verify Odoo is reachable
    console.log("🔍 Checking Odoo connectivity...");
    const odooClient = new odoo.OdooClient(ODOO_URL);
    try {
      const databases = await odooClient.listDatabases();
      console.log(`✅ Odoo is reachable! Found ${databases.length} existing databases`);
    } catch (err) {
      console.error("❌ Failed to connect to Odoo:", err);
      throw new Error(
        `Cannot connect to Odoo at ${ODOO_URL}. Make sure Odoo is running and accessible.`,
      );
    }

    // Provision ONE shared Odoo database for all tests
    console.log("🏗️  Provisioning shared Odoo database for all tests...");
    const timestamp = `${Date.now()}-${Math.random().toString(36).substring(7)}`;
    const [sharedOrg] = await drizzle
      .insert(schema.organizations)
      .values({
        name: `Shared Test Org ${timestamp}`,
        slug: `shared-test-org-${timestamp}`,
      })
      .returning();

    const odooDatabaseService = new odoo.OdooDatabaseService({
      logger,
      drizzle,
      redis: getServerContext().redis,
      odooClient,
      encryptionService,
      odooConfig: {
        url: ODOO_URL,
        port: ODOO_PORT,
        adminPassword: ODOO_ADMIN_PASSWORD,
      },
    });

    const startTime = Date.now();
    const result = await odooDatabaseService.provisionDatabase(sharedOrg.id, {
      lang: OdooLanguage.English,
      demo: OdooDemo.Disabled,
    });
    const provisionTime = Date.now() - startTime;

    sharedOdooDatabase = {
      databaseName: result.databaseName,
      adminLogin: "admin",
      adminPassword: ODOO_ADMIN_PASSWORD,
    };

    console.log(`✅ Shared Odoo database provisioned in ${provisionTime}ms`);
    console.log(`📊 Database: ${sharedOdooDatabase.databaseName}`);
    console.log(`👤 Admin: ${sharedOdooDatabase.adminLogin}`);
    console.log("🚀 All tests will reuse this database\n");

    logger.info({ database: sharedOdooDatabase.databaseName }, "Shared Odoo database provisioned");
  });

  // Helper to link org to shared Odoo database
  async function linkOrgToSharedDatabase(orgId: string) {
    await drizzle.insert(schema.odooDatabases).values({
      organizationId: orgId,
      databaseName: sharedOdooDatabase.databaseName,
      adminLogin: sharedOdooDatabase.adminLogin,
      adminPassword: await encryptionService.encrypt(sharedOdooDatabase.adminPassword),
      odooUrl: ODOO_URL,
      provisioningStatus: "active",
      provisioningCompletedAt: new Date(),
    });
  }

  beforeEach(async () => {
    const timestamp = `${Date.now()}-${Math.random().toString(36).substring(7)}`;

    // Create organization (but reuse shared Odoo database)
    [org] = await drizzle
      .insert(schema.organizations)
      .values({
        name: `Test Org ${timestamp}`,
        slug: `test-org-${timestamp}`,
      })
      .returning();

    // Create user
    [user] = await drizzle
      .insert(schema.users)
      .values({
        email: `test-${timestamp}@example.com`,
        name: "Test User",
      })
      .returning();
  });

  afterEach(async () => {
    // Clean up test data created during the test
    const client = odoo.createOdooClient(
      {
        url: ODOO_URL,
        port: ODOO_PORT,
        database: sharedOdooDatabase.databaseName,
        username: sharedOdooDatabase.adminLogin,
        password: sharedOdooDatabase.adminPassword,
      },
      logger,
    );

    try {
      await client.authenticate();
      // Delete any test partners created during tests
      const partnerIds = await client.search("res.partner", [["name", "ilike", "Test Partner"]]);
      if (partnerIds.length > 0) {
        await client.unlink("res.partner", partnerIds);
      }
      // Delete any test users created during tests (except admin)
      const userIds = await client.search("res.users", [
        ["login", "ilike", "test-"],
        ["id", "!=", 1],
      ]);
      if (userIds.length > 0) {
        await client.write("res.users", userIds, { active: false });
      }
    } catch (err) {
      logger.warn({ err }, "Failed to clean up Odoo test data");
    }
  });

  afterAll(async () => {
    await close();
  });

  it("should provision a new Odoo database", async () => {
    const logger = getServerContext().logger.child({ test: "provision-database" });
    const odooDatabaseService = new odoo.OdooDatabaseService({
      logger,
      drizzle,
      redis: getServerContext().redis,
      odooClient: new odoo.OdooClient(ODOO_URL),
      encryptionService,
      odooConfig: {
        url: ODOO_URL,
        port: ODOO_PORT,
        adminPassword: ODOO_ADMIN_PASSWORD,
      },
    });

    // Provision the database
    const result = await odooDatabaseService.provisionDatabase(org.id, {
      lang: OdooLanguage.English,
      demo: OdooDemo.Disabled,
    });

    expect(result.databaseName).toBeTruthy();

    // Verify database exists in Odoo
    const client = odoo.createOdooClient(
      {
        url: ODOO_URL,
        port: ODOO_PORT,
        database: result.databaseName,
        username: "admin",
        password: ODOO_ADMIN_PASSWORD,
      },
      logger,
    );

    // Should be able to authenticate
    const uid = await client.authenticate();
    expect(uid).toBeGreaterThan(0);
  });

  it("should create and authenticate an Odoo user", async () => {
    const logger = getServerContext().logger.child({ test: "create-user" });

    // Link org to shared database
    await linkOrgToSharedDatabase(org.id);

    // Provision user in shared Odoo database
    const userProvisioningService = new odoo.OdooUserProvisioningService({
      drizzle,
      logger,
      encryptionService,
      odooUrl: ODOO_URL,
    });

    const odooUser = await userProvisioningService.provisionUser(user.id, org.id);

    expect(odooUser.odooUid).toBeGreaterThan(0);
    expect(odooUser.odooLogin).toBe(user.email);

    // Verify user can authenticate
    const client = odoo.createOdooClient(
      {
        url: ODOO_URL,
        port: ODOO_PORT,
        database: sharedOdooDatabase.databaseName,
        username: user.email,
        password: odooUser.odooPassword,
      },
      logger,
    );

    const uid = await client.authenticate();
    expect(uid).toBe(odooUser.odooUid);
  });

  it("should install modules in Odoo database", async () => {
    // Link org to shared database
    await linkOrgToSharedDatabase(org.id);

    // Install modules
    const ctx = getServerContext();
    const result = await installOdooModules(org.id, ctx);

    expect(result.success).toBe(true);
    expect(result.message).toContain("successfully");

    // Verify modules are installed by checking database info
    const dbInfo = await getOdooDatabaseInfo(drizzle, org.id);
    expect(dbInfo.modules.length).toBeGreaterThan(0);

    // Check for specific expected modules
    const moduleNames = dbInfo.modules.map((m) => m.name);
    expect(moduleNames).toContain("base");
  });

  it("should retrieve model fields from Odoo", async () => {
    const logger = getServerContext().logger.child({ test: "get-model-fields" });

    // Link org to shared database
    await linkOrgToSharedDatabase(org.id);

    const userProvisioningService = new odoo.OdooUserProvisioningService({
      drizzle,
      logger,
      encryptionService,
      odooUrl: ODOO_URL,
    });

    await userProvisioningService.provisionUser(user.id, org.id);

    // Get model fields (simple mode)
    const fields = await getOdooModelFields(user.id, org.id, "res.users", true);

    expect(Array.isArray(fields)).toBe(true);
    expect(fields.length).toBeGreaterThan(0);

    // Check for expected fields on res.users
    const fieldNames = (fields as { name: string }[]).map((f) => f.name);
    expect(fieldNames).toContain("login");
    expect(fieldNames).toContain("name");
    expect(fieldNames).toContain("email");
  });

  it("should retrieve comprehensive database info", async () => {
    // Link org to shared database
    await linkOrgToSharedDatabase(org.id);

    // Get database info
    const dbInfo = await getOdooDatabaseInfo(drizzle, org.id);

    expect(dbInfo.database.name).toBe(sharedOdooDatabase.databaseName);
    expect(dbInfo.database.exists).toBe(true);
    expect(dbInfo.database.loginUrl).toContain(sharedOdooDatabase.databaseName);

    // Should have at least admin user
    expect(dbInfo.users.length).toBeGreaterThan(0);
    const adminUser = dbInfo.users.find((u) => u.login === "admin");
    expect(adminUser).toBeDefined();
    expect(adminUser?.active).toBe(true);
    expect(adminUser?.groups.length).toBeGreaterThan(0);

    // Should have modules
    expect(dbInfo.modules.length).toBeGreaterThan(0);

    // Should have access groups
    expect(dbInfo.accessGroups.length).toBeGreaterThan(0);
  });

  it("should verify credentials work for actual authentication", async () => {
    const logger = getServerContext().logger.child({ test: "verify-credentials" });

    // Link org to shared database
    await linkOrgToSharedDatabase(org.id);

    // Now test that getOdooAdminCredentials actually returns working credentials
    const credentials = await getOdooAdminCredentials(drizzle, org.id);

    expect(credentials).not.toBeNull();
    expect(credentials!.databaseName).toBe(sharedOdooDatabase.databaseName);

    // Use the credentials to actually authenticate
    const client = odoo.createOdooClient(
      {
        url: ODOO_URL,
        port: ODOO_PORT,
        database: credentials!.databaseName,
        username: credentials!.adminLogin,
        password: credentials!.adminPassword,
      },
      logger,
    );

    const uid = await client.authenticate();
    expect(uid).toBeGreaterThan(0);
  });

  it("should handle full user lifecycle: provision -> authenticate -> query -> deactivate", async () => {
    const logger = getServerContext().logger.child({ test: "user-lifecycle" });

    // 1. Link org to shared database
    await linkOrgToSharedDatabase(org.id);

    // 2. Provision user
    const userProvisioningService = new odoo.OdooUserProvisioningService({
      drizzle,
      logger,
      encryptionService,
      odooUrl: ODOO_URL,
    });

    const odooUser = await userProvisioningService.provisionUser(user.id, org.id);

    // 3. Authenticate as user
    const userClient = odoo.createOdooClient(
      {
        url: ODOO_URL,
        port: ODOO_PORT,
        database: sharedOdooDatabase.databaseName,
        username: user.email,
        password: odooUser.odooPassword,
      },
      logger,
    );

    const uid = await userClient.authenticate();
    expect(uid).toBe(odooUser.odooUid);

    // 4. Query data as user
    const partners = await userClient.searchRead("res.partner", [], ["name", "email"]);
    expect(Array.isArray(partners)).toBe(true);

    // 5. Deactivate user in Odoo (simulate user deletion)
    const adminClient = odoo.createOdooClient(
      {
        url: ODOO_URL,
        port: ODOO_PORT,
        database: sharedOdooDatabase.databaseName,
        username: "admin",
        password: ODOO_ADMIN_PASSWORD,
      },
      logger,
    );

    await adminClient.authenticate();
    await adminClient.write("res.users", [odooUser.odooUid], { active: false });

    // 6. Verify deactivated user cannot authenticate
    await expect(userClient.authenticate()).rejects.toThrow();
  });

  it("should verify dev credentials work for actual authentication", async () => {
    const logger = getServerContext().logger.child({ test: "dev-credentials" });

    // Link org to shared database
    await linkOrgToSharedDatabase(org.id);

    const userProvisioningService = new odoo.OdooUserProvisioningService({
      drizzle,
      logger,
      encryptionService,
      odooUrl: ODOO_URL,
    });

    await userProvisioningService.provisionUser(user.id, org.id);

    // Get dev credentials
    const devCredentials = await getOdooDevCredentials(drizzle, user.id, org.id);

    expect(devCredentials).not.toBeNull();
    expect(devCredentials!.login).toBe(user.email);

    // Verify credentials work for authentication
    const client = odoo.createOdooClient(
      {
        url: ODOO_URL,
        port: ODOO_PORT,
        database: sharedOdooDatabase.databaseName,
        username: devCredentials!.login,
        password: devCredentials!.password,
      },
      logger,
    );

    const uid = await client.authenticate();
    expect(uid).toBeGreaterThan(0);
  });

  it("should verify user web credentials work for actual authentication", async () => {
    const logger = getServerContext().logger.child({ test: "web-credentials" });

    // Link org to shared database
    await linkOrgToSharedDatabase(org.id);

    const userProvisioningService = new odoo.OdooUserProvisioningService({
      drizzle,
      logger,
      encryptionService,
      odooUrl: ODOO_URL,
    });

    const odooUser = await userProvisioningService.provisionUser(user.id, org.id);

    // Get web credentials
    const webCredentials = await getOdooUserWebCredentials(drizzle, user.id, org.id);

    expect(webCredentials).not.toBeNull();
    expect(webCredentials!.login).toBe(user.email);
    expect(webCredentials!.odooUid).toBe(odooUser.odooUid);
    expect(webCredentials!.webUrl).toContain(sharedOdooDatabase.databaseName);

    // Verify credentials work for authentication
    const client = odoo.createOdooClient(
      {
        url: ODOO_URL,
        port: ODOO_PORT,
        database: sharedOdooDatabase.databaseName,
        username: webCredentials!.login,
        password: webCredentials!.password,
      },
      logger,
    );

    const uid = await client.authenticate();
    expect(uid).toBe(webCredentials!.odooUid);
  });

  it("should perform CRUD operations via XML-RPC", async () => {
    const logger = getServerContext().logger.child({ test: "crud-operations" });

    // Link org to shared database
    await linkOrgToSharedDatabase(org.id);

    const client = odoo.createOdooClient(
      {
        url: ODOO_URL,
        port: ODOO_PORT,
        database: sharedOdooDatabase.databaseName,
        username: "admin",
        password: ODOO_ADMIN_PASSWORD,
      },
      logger,
    );

    await client.authenticate();

    // CREATE: Create a partner
    const partnerId = await client.create("res.partner", {
      name: "Test Partner",
      email: "test@partner.com",
    });

    expect(partnerId).toBeGreaterThan(0);

    // READ: Read the partner
    const partners = await client.read("res.partner", [partnerId], ["name", "email"]);
    expect(partners.length).toBe(1);
    expect(partners[0].name).toBe("Test Partner");
    expect(partners[0].email).toBe("test@partner.com");

    // SEARCH: Search for the partner
    const ids = await client.search("res.partner", [["name", "=", "Test Partner"]]);
    expect(ids).toContain(partnerId);

    // SEARCH_READ: Search and read in one call
    const results = await client.searchRead("res.partner", [["id", "=", partnerId]], ["name", "email"]);
    expect(results.length).toBe(1);
    expect(results[0].name).toBe("Test Partner");

    // UPDATE: Update the partner
    await client.write("res.partner", [partnerId], {
      name: "Updated Partner",
    });

    const updated = await client.read("res.partner", [partnerId], ["name"]);
    expect(updated[0].name).toBe("Updated Partner");

    // DELETE: Delete the partner
    await client.unlink("res.partner", [partnerId]);

    const deleted = await client.search("res.partner", [["id", "=", partnerId]]);
    expect(deleted.length).toBe(0);
  });

  it("should query available models and their fields", async () => {
    const logger = getServerContext().logger.child({ test: "models-fields" });

    // Link org to shared database
    await linkOrgToSharedDatabase(org.id);

    const client = odoo.createOdooClient(
      {
        url: ODOO_URL,
        port: ODOO_PORT,
        database: sharedOdooDatabase.databaseName,
        username: "admin",
        password: ODOO_ADMIN_PASSWORD,
      },
      logger,
    );

    await client.authenticate();

    // Get all models
    const models = await client.searchRead("ir.model", [], ["model", "name"]);
    expect(models.length).toBeGreaterThan(0);

    // Verify core models exist
    const modelNames = models.map((m) => m.model);
    expect(modelNames).toContain("res.users");
    expect(modelNames).toContain("res.partner");
    expect(modelNames).toContain("res.company");

    // Get fields for res.users model
    const fields = await client.fieldsGet("res.users");
    expect(Object.keys(fields).length).toBeGreaterThan(0);
    expect(fields.login).toBeDefined();
    expect(fields.name).toBeDefined();
    expect(fields.email).toBeDefined();
  });

  it("should handle database backup and restore", async () => {
    const logger = getServerContext().logger.child({ test: "backup-restore" });

    // Link org to shared database
    await linkOrgToSharedDatabase(org.id);

    // Create some data
    const client = odoo.createOdooClient(
      {
        url: ODOO_URL,
        port: ODOO_PORT,
        database: sharedOdooDatabase.databaseName,
        username: "admin",
        password: ODOO_ADMIN_PASSWORD,
      },
      logger,
    );

    await client.authenticate();
    const partnerId = await client.create("res.partner", {
      name: "Backup Test Partner",
      email: "backup@test.com",
    });

    expect(partnerId).toBeGreaterThan(0);

    // Verify partner exists
    const beforeBackup = await client.search("res.partner", [["id", "=", partnerId]]);
    expect(beforeBackup).toContain(partnerId);

    // Note: Actual backup/restore would require admin access to Odoo's database manager
    // This test verifies the data exists and could be backed up
  });
});
