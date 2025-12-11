import { describe, it, expect, beforeAll, afterAll, beforeEach } from "vitest";
import { type DrizzleClient, type RedisClient, schema } from "@safee/database";
import { connectTest, nukeDatabase } from "@safee/database/test-helpers";
import { eq } from "@safee/database";
import { updateConnector } from "./updateConnector.js";
import { encryptionService } from "../services/encryption.js";
import { initTestServerContext } from "../test-helpers/testServerContext.js";
import { getServerContext } from "../serverContext.js";

void describe("updateConnector", async () => {
  let drizzle: DrizzleClient;
  let redis: RedisClient;
  let close: () => Promise<void>;

  beforeAll(async () => {
    ({ drizzle, close } = await connectTest({ appName: "update-connector-test" }));
    redis = await initTestServerContext(drizzle);
  });

  beforeEach(async () => {
    await nukeDatabase(drizzle);
  });

  afterAll(async () => {
    await redis.quit();
    await close();
  });

  it("should update connector name", async () => {
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

    const ctx = getServerContext();
    const result = await updateConnector(ctx, connector.id, org.id, user.id, {
      name: "Updated Name",
    });

    expect(result.success).toBe(true);

    const updated = await drizzle.query.connectors.findFirst({
      where: eq(schema.connectors.id, connector.id),
    });

    expect(updated?.name).toBe("Updated Name");
  });

  it("should update connector config", async () => {
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

    const ctx = getServerContext();
    const result = await updateConnector(ctx, connector.id, org.id, user.id, {
      config: { host: "localhost", port: 25432, database: "safee", username: "safee", password: "safee" },
    });

    expect(result.success).toBe(true);

    const updated = await drizzle.query.connectors.findFirst({
      where: eq(schema.connectors.id, connector.id),
    });

    expect(updated).toBeDefined();
    expect(updated?.config).toBeDefined();
  });

  it("should update isActive status", async () => {
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

    const ctx = getServerContext();
    const result = await updateConnector(ctx, connector.id, org.id, user.id, {
      isActive: false,
    });

    expect(result.success).toBe(true);

    const updated = await drizzle.query.connectors.findFirst({
      where: eq(schema.connectors.id, connector.id),
    });

    expect(updated?.isActive).toBe(false);
  });

  it("should throw error for non-existent connector", async () => {
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

    const ctx = getServerContext();
    await expect(
      updateConnector(ctx, fakeConnectorId, org.id, user.id, { name: "New Name" }),
    ).rejects.toThrow();
  });
});
