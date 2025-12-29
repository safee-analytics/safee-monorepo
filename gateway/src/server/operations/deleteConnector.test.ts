import { describe, it, expect, beforeAll, afterAll, beforeEach } from "vitest";
import { type DrizzleClient, schema, eq, odoo } from "@safee/database";
import { connectTest } from "@safee/database/test-helpers";
import { deleteConnector } from "./deleteConnector.js";
const encryptionService = new odoo.EncryptionService(
  process.env.JWT_SECRET ?? "development-encryption-key-change-in-production",
);
import { initTestServerContext } from "../test-helpers/testServerContext.js";
import { getServerContext } from "../serverContext.js";

void describe("deleteConnector", async () => {
  let drizzle: DrizzleClient;
  let close: () => Promise<void>;

  beforeAll(async () => {
    ({ drizzle, close } = await connectTest({ appName: "delete-connector-test" }));
    await initTestServerContext(drizzle);
  });

  beforeEach(async () => {
    await drizzle.delete(schema.fileEncryptionMetadata);
    await drizzle.delete(schema.approvalRequests);
    await drizzle.delete(schema.connectors);
    await drizzle.delete(schema.organizations);
  });

  afterAll(async () => {
    await close();
  });

  it("should delete a connector", async () => {
    const timestamp = Date.now();
    const [org] = await drizzle
      .insert(schema.organizations)
      .values({
        name: `Test Org ${timestamp}`,
        slug: `test-org-delete-conn-${timestamp}`,
      })
      .returning();

    const config = {
      host: "localhost",
      port: 25432,
      database: "safee",
      username: "safee",
      password: "safee",
    };
    const encryptedConfig = encryptionService.encrypt(JSON.stringify(config));

    const [connector] = await drizzle
      .insert(schema.connectors)
      .values({
        organizationId: org.id,
        name: "Connector to Delete",
        type: "postgresql",
        config: encryptedConfig as unknown as Record<string, unknown>,
      })
      .returning();

    const ctx = getServerContext();
    const result = await deleteConnector(ctx, connector.id, org.id);

    expect(result.success).toBe(true);

    const deleted = await drizzle.query.connectors.findFirst({
      where: eq(schema.connectors.id, connector.id),
    });

    expect(deleted).toBeUndefined();
  });

  it("should not delete connector from different organization", async () => {
    const timestamp = Date.now();
    const [org1] = await drizzle
      .insert(schema.organizations)
      .values({
        name: `Test Org 1 ${timestamp}`,
        slug: `test-org-1-${timestamp}`,
      })
      .returning();

    const [org2] = await drizzle
      .insert(schema.organizations)
      .values({
        name: `Test Org 2 ${timestamp}`,
        slug: `test-org-2-${timestamp}`,
      })
      .returning();

    const config = {
      host: "localhost",
      port: 25432,
      database: "safee",
      username: "safee",
      password: "safee",
    };
    const encryptedConfig = encryptionService.encrypt(JSON.stringify(config));

    const [connector] = await drizzle
      .insert(schema.connectors)
      .values({
        organizationId: org1.id,
        name: "Connector from Org 1",
        type: "postgresql",
        config: encryptedConfig as unknown as Record<string, unknown>,
      })
      .returning();

    const ctx = getServerContext();
    // Try to delete with org2's ID
    const result = await deleteConnector(ctx, connector.id, org2.id);

    expect(result.success).toBe(true);

    // Connector should still exist because organizationId didn't match
    const stillExists = await drizzle.query.connectors.findFirst({
      where: eq(schema.connectors.id, connector.id),
    });

    expect(stillExists).toBeDefined();
    expect(stillExists?.organizationId).toBe(org1.id);
  });

  it("should handle deleting non-existent connector", async () => {
    const timestamp = Date.now();
    const [org] = await drizzle
      .insert(schema.organizations)
      .values({
        name: `Test Org ${timestamp}`,
        slug: `test-org-delete-nonexist-${timestamp}`,
      })
      .returning();

    const ctx = getServerContext();
    const fakeId = crypto.randomUUID();

    // Should not throw error for non-existent connector
    const result = await deleteConnector(ctx, fakeId, org.id);

    expect(result.success).toBe(true);
  });

  it("should delete multiple connectors independently", async () => {
    const timestamp = Date.now();
    const [org] = await drizzle
      .insert(schema.organizations)
      .values({
        name: `Test Org ${timestamp}`,
        slug: `test-org-multi-delete-${timestamp}`,
      })
      .returning();

    const config = {
      host: "localhost",
      port: 25432,
      database: "safee",
      username: "safee",
      password: "safee",
    };
    const encryptedConfig = encryptionService.encrypt(JSON.stringify(config));

    const [connector1] = await drizzle
      .insert(schema.connectors)
      .values({
        organizationId: org.id,
        name: "Connector 1",
        type: "postgresql",
        config: encryptedConfig as unknown as Record<string, unknown>,
      })
      .returning();

    const [connector2] = await drizzle
      .insert(schema.connectors)
      .values({
        organizationId: org.id,
        name: "Connector 2",
        type: "mysql",
        config: encryptedConfig as unknown as Record<string, unknown>,
      })
      .returning();

    const ctx = getServerContext();

    // Delete first connector
    const result1 = await deleteConnector(ctx, connector1.id, org.id);
    expect(result1.success).toBe(true);

    // First should be deleted
    const deleted1 = await drizzle.query.connectors.findFirst({
      where: eq(schema.connectors.id, connector1.id),
    });
    expect(deleted1).toBeUndefined();

    // Second should still exist
    const stillExists = await drizzle.query.connectors.findFirst({
      where: eq(schema.connectors.id, connector2.id),
    });
    expect(stillExists).toBeDefined();
  });
});
