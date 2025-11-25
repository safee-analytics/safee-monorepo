import { describe, it, expect, beforeAll, afterAll, beforeEach } from "vitest";
import { type DrizzleClient, type RedisClient, schema } from "@safee/database";
import { connectTest } from "@safee/database/test-helpers";
import { eq } from "drizzle-orm";
import { deleteConnector } from "./deleteConnector.js";
import { encryptionService } from "../services/encryption.js";
import { initTestServerContext } from "../test-helpers/testServerContext.js";
import { getServerContext } from "../serverContext.js";

void describe("deleteConnector", async () => {
  let drizzle: DrizzleClient;
  let redis: RedisClient;
  let close: () => Promise<void>;

  beforeAll(async () => {
    ({ drizzle, close } = await connectTest({ appName: "delete-connector-test" }));
    redis = await initTestServerContext(drizzle);
  });

  beforeEach(async () => {
    await drizzle.delete(schema.connectors);
    await drizzle.delete(schema.organizations);
  });

  afterAll(async () => {
    await redis.quit();
    await close();
  });

  void it("should delete a connector", async () => {
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
});
