import { describe, it, expect, beforeAll, afterAll, beforeEach } from "vitest";
import { type DrizzleClient, schema } from "@safee/database";
import { connectTest, nukeDatabase } from "@safee/database/test-helpers";
import { eq } from "drizzle-orm";
import { updateConnector } from "./updateConnector.js";
import { encryptionService } from "../services/encryption.js";

void describe("updateConnector", async () => {
  let drizzle: DrizzleClient;
  let close: () => Promise<void>;

  beforeAll(async () => {
    ({ drizzle, close } = await connectTest({ appName: "update-connector-test" }));
  });

  beforeEach(async () => {
    await nukeDatabase(drizzle);
  });

  afterAll(async () => {
    await close();
  });

  void it("should update connector name", async () => {
    const timestamp = Date.now();
    const [org] = await drizzle
      .insert(schema.organizations)
      .values({
        name: `Test Org ${timestamp}`,
        slug: `test-org-update-conn-${timestamp}`,
      })
      .returning();

    const [user] = await drizzle
      .insert(schema.users)
      .values({
        email: `test-${timestamp}@example.com`,
        name: "Test User",
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
        name: "Original Name",
        type: "postgresql",
        config: encryptedConfig as unknown as Record<string, unknown>,
      })
      .returning();

    const result = await updateConnector(drizzle, connector.id, org.id, user.id, {
      name: "Updated Name",
    });

    expect(result.success).toBe(true);

    const updated = await drizzle.query.connectors.findFirst({
      where: eq(schema.connectors.id, connector.id),
    });

    expect(updated?.name).toBe("Updated Name");
  });

  void it("should update connector config", async () => {
    const timestamp = Date.now();
    const [org] = await drizzle
      .insert(schema.organizations)
      .values({
        name: `Test Org 2 ${timestamp}`,
        slug: `test-org-update-conn-2-${timestamp}`,
      })
      .returning();

    const [user] = await drizzle
      .insert(schema.users)
      .values({
        email: `test2-${timestamp}@example.com`,
        name: "Test User 2",
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
        name: "Test Connector",
        type: "postgresql",
        config: encryptedConfig as unknown as Record<string, unknown>,
      })
      .returning();

    const result = await updateConnector(drizzle, connector.id, org.id, user.id, {
      config: { host: "localhost", port: 25432, database: "safee", username: "safee", password: "safee" },
    });

    expect(result.success).toBe(true);

    const updated = await drizzle.query.connectors.findFirst({
      where: eq(schema.connectors.id, connector.id),
    });

    expect(updated).toBeDefined();
    expect(updated?.config).toBeDefined();
  });

  void it("should update isActive status", async () => {
    const timestamp = Date.now();
    const [org] = await drizzle
      .insert(schema.organizations)
      .values({
        name: `Test Org 3 ${timestamp}`,
        slug: `test-org-update-conn-3-${timestamp}`,
      })
      .returning();

    const [user] = await drizzle
      .insert(schema.users)
      .values({
        email: `test3-${timestamp}@example.com`,
        name: "Test User 3",
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
        name: "Test Connector",
        type: "postgresql",
        config: encryptedConfig as unknown as Record<string, unknown>,
        isActive: true,
      })
      .returning();

    const result = await updateConnector(drizzle, connector.id, org.id, user.id, {
      isActive: false,
    });

    expect(result.success).toBe(true);

    const updated = await drizzle.query.connectors.findFirst({
      where: eq(schema.connectors.id, connector.id),
    });

    expect(updated?.isActive).toBe(false);
  });

  void it("should throw error for non-existent connector", async () => {
    const timestamp = Date.now();
    const [org] = await drizzle
      .insert(schema.organizations)
      .values({
        name: `Test Org 4 ${timestamp}`,
        slug: `test-org-update-conn-4-${timestamp}`,
      })
      .returning();

    const [user] = await drizzle
      .insert(schema.users)
      .values({
        email: `test4-${timestamp}@example.com`,
        name: "Test User 4",
      })
      .returning();

    const fakeConnectorId = "00000000-0000-0000-0000-000000000000";

    await expect(
      updateConnector(drizzle, fakeConnectorId, org.id, user.id, { name: "New Name" }),
    ).rejects.toThrow();
  });
});
