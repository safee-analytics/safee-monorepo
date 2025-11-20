import { describe, it, expect, beforeAll, afterAll, beforeEach } from "vitest";
import { type DrizzleClient, schema } from "@safee/database";
import { connectTest } from "@safee/database/test-helpers";
import { getConnector } from "./getConnector.js";
import { encryptionService } from "../services/encryption.js";

void describe("getConnector", async () => {
  let drizzle: DrizzleClient;
  let close: () => Promise<void>;

  beforeAll(async () => {
    ({ drizzle, close } = await connectTest({ appName: "get-connector-test" }));
  });

  beforeEach(async () => {
    await drizzle.delete(schema.connectors);
    await drizzle.delete(schema.organizations);
  });

  afterAll(async () => {
    await close();
  });

  void it("should retrieve a connector by id", async () => {
    const timestamp = Date.now();
    const [org] = await drizzle
      .insert(schema.organizations)
      .values({
        name: `Test Org ${timestamp}`,
        slug: `test-org-get-conn-${timestamp}`,
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
        tags: ["production"],
        metadata: { version: "1.0" },
      })
      .returning();

    const result = await getConnector(drizzle, connector.id, org.id);

    expect(result.id).toBe(connector.id);
    expect(result.name).toBe("Test Connector");
    expect(result.type).toBe("postgresql");
    expect(result.isActive).toBe(true);
    expect(result.tags).toEqual(["production"]);
    expect(result.metadata).toEqual({ version: "1.0" });
  });

  void it("should throw error for non-existent connector", async () => {
    const timestamp = Date.now();
    const [org] = await drizzle
      .insert(schema.organizations)
      .values({
        name: `Test Org 2 ${timestamp}`,
        slug: `test-org-get-conn-2-${timestamp}`,
      })
      .returning();

    const fakeConnectorId = "00000000-0000-0000-0000-000000000000";

    await expect(getConnector(drizzle, fakeConnectorId, org.id)).rejects.toThrow();
  });

  void it("should throw error when accessing connector from different organization", async () => {
    const timestamp = Date.now();
    const [org1] = await drizzle
      .insert(schema.organizations)
      .values({
        name: `Org 1 ${timestamp}`,
        slug: `get-conn-org-1-${timestamp}`,
      })
      .returning();

    const [org2] = await drizzle
      .insert(schema.organizations)
      .values({
        name: `Org 2 ${timestamp}`,
        slug: `get-conn-org-2-${timestamp}`,
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
        name: "Org 1 Connector",
        type: "postgresql",
        config: encryptedConfig as unknown as Record<string, unknown>,
      })
      .returning();

    await expect(getConnector(drizzle, connector.id, org2.id)).rejects.toThrow();
  });
});
