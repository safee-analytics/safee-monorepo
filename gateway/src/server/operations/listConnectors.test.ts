import { describe, it, expect, beforeAll, afterAll, beforeEach } from "vitest";
import { type DrizzleClient, type RedisClient, schema } from "@safee/database";
import { connectTest } from "@safee/database/test-helpers";
import { listConnectors } from "./listConnectors.js";
import { initTestServerContext } from "../test-helpers/testServerContext.js";
import { getServerContext } from "../serverContext.js";

void describe("listConnectors", async () => {
  let drizzle: DrizzleClient;
  let redis: RedisClient;
  let close: () => Promise<void>;
  let org: typeof schema.organizations.$inferSelect;

  beforeAll(async () => {
    ({ drizzle, close } = await connectTest({ appName: "list-connectors-test" }));
    redis = await initTestServerContext(drizzle);
  });

  beforeEach(async () => {
    const timestamp = Date.now();
    [org] = await drizzle
      .insert(schema.organizations)
      .values({
        name: `Test Org ${timestamp}`,
        slug: `test-org-${timestamp}`,
      })
      .returning();
  });

  afterAll(async () => {
    await redis.quit();
    await close();
  });

  it("should list all connectors for an organization", async () => {
    await drizzle
      .insert(schema.connectors)
      .values({
        organizationId: org.id,
        name: "PostgreSQL Connector",
        type: "postgresql",
        config: { host: "localhost", port: 5432, database: "test" },
        isActive: true,
        tags: ["production"],
      })
      .returning();

    await drizzle
      .insert(schema.connectors)
      .values({
        organizationId: org.id,
        name: "MySQL Connector",
        type: "mysql",
        config: { host: "localhost", port: 3306, database: "test" },
        isActive: false,
        tags: ["development"],
      })
      .returning();

    const ctx = getServerContext();
    const connectors = await listConnectors(ctx, org.id, {});

    expect(connectors).toHaveLength(2);
    expect(connectors[0].name).toBe("PostgreSQL Connector");
    expect(connectors[1].name).toBe("MySQL Connector");
  });

  it("should filter connectors by type", async () => {
    await drizzle.insert(schema.connectors).values([
      {
        organizationId: org.id,
        name: "PostgreSQL Connector",
        type: "postgresql",
        config: { host: "localhost" },
        isActive: true,
      },
      {
        organizationId: org.id,
        name: "MySQL Connector",
        type: "mysql",
        config: { host: "localhost" },
        isActive: true,
      },
    ]);

    const ctx = getServerContext();
    const connectors = await listConnectors(ctx, org.id, { type: "postgresql" });

    expect(connectors).toHaveLength(1);
    expect(connectors[0].type).toBe("postgresql");
  });

  it("should filter connectors by isActive status", async () => {
    await drizzle.insert(schema.connectors).values([
      {
        organizationId: org.id,
        name: "Active Connector",
        type: "postgresql",
        config: { host: "localhost" },
        isActive: true,
      },
      {
        organizationId: org.id,
        name: "Inactive Connector",
        type: "mysql",
        config: { host: "localhost" },
        isActive: false,
      },
    ]);

    const ctx = getServerContext();
    const connectors = await listConnectors(ctx, org.id, { isActive: true });

    expect(connectors).toHaveLength(1);
    expect(connectors[0].isActive).toBe(true);
  });

  it("should return empty array for organization with no connectors", async () => {
    const ctx = getServerContext();
    const connectors = await listConnectors(ctx, org.id, {});

    expect(connectors).toHaveLength(0);
  });
});
