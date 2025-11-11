import { describe, it, expect, beforeAll, afterAll, beforeEach } from "vitest";
import { type DrizzleClient, schema } from "@safee/database";
import { connectTest } from "@safee/database/test-helpers";
import { createConnector } from "./createConnector.js";

void describe("createConnector", async () => {
  let drizzle: DrizzleClient;
  let close: () => Promise<void>;

  beforeAll(async () => {
    ({ drizzle, close } = await connectTest({ appName: "create-connector-test" }));
  });

  beforeEach(async () => {
    await drizzle.delete(schema.connectors);
    await drizzle.delete(schema.users);
    await drizzle.delete(schema.organizations);
  });

  afterAll(async () => {
    await close();
  });

  void it("should create a new connector", async () => {
    const timestamp = Date.now();
    const [org] = await drizzle
      .insert(schema.organizations)
      .values({
        name: `Test Org ${timestamp}`,
        slug: `test-org-create-conn-${timestamp}`,
      })
      .returning();

    const [user] = await drizzle
      .insert(schema.users)
      .values({
        email: `test-${timestamp}@example.com`,
        name: "Test User",
      })
      .returning();

    const result = await createConnector(drizzle, org.id, user.id, {
      name: "New PostgreSQL Connector",
      description: "A test connector",
      type: "postgresql",
      config: {
        host: "localhost",
        port: 25432,
        database: "safee",
        username: "safee",
        password: "safee",
      },
      tags: ["test", "development"],
      metadata: { environment: "dev" },
    });

    expect(result.id).toBeDefined();
    expect(result.name).toBe("New PostgreSQL Connector");
    expect(result.description).toBe("A test connector");
    expect(result.type).toBe("postgresql");
    expect(result.isActive).toBe(true);
    expect(result.tags).toEqual(["test", "development"]);
    expect(result.metadata).toEqual({ environment: "dev" });
    expect(result.organizationId).toBe(org.id);
  });

  void it("should create connector with minimal fields", async () => {
    const timestamp = Date.now();
    const [org] = await drizzle
      .insert(schema.organizations)
      .values({
        name: `Test Org 2 ${timestamp}`,
        slug: `test-org-create-conn-2-${timestamp}`,
      })
      .returning();

    const [user] = await drizzle
      .insert(schema.users)
      .values({
        email: `test2-${timestamp}@example.com`,
        name: "Test User 2",
      })
      .returning();

    const result = await createConnector(drizzle, org.id, user.id, {
      name: "Minimal Connector",
      type: "postgresql",
      config: {
        host: "localhost",
        port: 25432,
        database: "safee",
        username: "safee",
        password: "safee",
      },
    });

    expect(result.id).toBeDefined();
    expect(result.name).toBe("Minimal Connector");
    expect(result.type).toBe("postgresql");
    expect(result.isActive).toBe(true);
  });
});
