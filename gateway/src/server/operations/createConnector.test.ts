import { describe, it, expect, beforeAll, afterAll, beforeEach } from "vitest";
import { type DrizzleClient, schema } from "@safee/database";
import { connectTest } from "@safee/database/test-helpers";
import { createConnector } from "./createConnector.js";
import { initTestServerContext } from "../test-helpers/testServerContext.js";
import { getServerContext } from "../serverContext.js";

void describe("createConnector", async () => {
  let drizzle: DrizzleClient;
  let close: () => Promise<void>;

  beforeAll(async () => {
    ({ drizzle, close } = await connectTest({ appName: "create-connector-test" }));
    await initTestServerContext(drizzle);
  });

  beforeEach(async () => {
    await drizzle.delete(schema.fileEncryptionMetadata);
    await drizzle.delete(schema.approvalRequests);
    await drizzle.delete(schema.connectors);
    await drizzle.delete(schema.cases);
    await drizzle.delete(schema.users);
    await drizzle.delete(schema.organizations);
  });

  afterAll(async () => {
    await close();
  });

  it("should create a new connector", async () => {
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

    const ctx = getServerContext();
    const result = await createConnector(ctx, org.id, user.id, {
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

  it("should create connector with minimal fields", async () => {
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

    const ctx = getServerContext();
    const result = await createConnector(ctx, org.id, user.id, {
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

  it("should reject connector with invalid config - missing host", async () => {
    const timestamp = Date.now();
    const [org] = await drizzle
      .insert(schema.organizations)
      .values({
        name: `Test Org Invalid ${timestamp}`,
        slug: `test-org-invalid-${timestamp}`,
      })
      .returning();

    const [user] = await drizzle
      .insert(schema.users)
      .values({
        email: `test-invalid-${timestamp}@example.com`,
        name: "Test User",
      })
      .returning();

    const ctx = getServerContext();

    await expect(
      createConnector(ctx, org.id, user.id, {
        name: "Invalid Connector",
        type: "postgresql",
        config: {
          // Missing host
          port: 5432,
          database: "safee",
          username: "safee",
          password: "safee",
        } as never,
      }),
    ).rejects.toThrow(/Invalid connector configuration/);
  });

  it("should reject connector with invalid config - invalid port", async () => {
    const timestamp = Date.now();
    const [org] = await drizzle
      .insert(schema.organizations)
      .values({
        name: `Test Org Port ${timestamp}`,
        slug: `test-org-port-${timestamp}`,
      })
      .returning();

    const [user] = await drizzle
      .insert(schema.users)
      .values({
        email: `test-port-${timestamp}@example.com`,
        name: "Test User",
      })
      .returning();

    const ctx = getServerContext();

    await expect(
      createConnector(ctx, org.id, user.id, {
        name: "Invalid Port Connector",
        type: "postgresql",
        config: {
          host: "localhost",
          port: -1, // Invalid port
          database: "safee",
          username: "safee",
          password: "safee",
        },
      }),
    ).rejects.toThrow(/Invalid connector configuration/);
  });

  it("should allow multiple connectors with same name in same organization", async () => {
    const timestamp = Date.now();
    const [org] = await drizzle
      .insert(schema.organizations)
      .values({
        name: `Test Org Duplicate ${timestamp}`,
        slug: `test-org-dup-${timestamp}`,
      })
      .returning();

    const [user] = await drizzle
      .insert(schema.users)
      .values({
        email: `test-dup-${timestamp}@example.com`,
        name: "Test User",
      })
      .returning();

    const ctx = getServerContext();

    const result1 = await createConnector(ctx, org.id, user.id, {
      name: "Duplicate Name",
      type: "postgresql",
      config: {
        host: "localhost",
        port: 25432,
        database: "safee",
        username: "safee",
        password: "safee",
      },
    });

    const result2 = await createConnector(ctx, org.id, user.id, {
      name: "Duplicate Name",
      type: "postgresql",
      config: {
        host: "localhost",
        port: 25432,
        database: "safee",
        username: "safee",
        password: "safee",
      },
    });

    expect(result1.id).toBeDefined();
    expect(result2.id).toBeDefined();
    expect(result1.id).not.toBe(result2.id);
    expect(result1.name).toBe("Duplicate Name");
    expect(result2.name).toBe("Duplicate Name");
  });

  it("should store connector metadata correctly", async () => {
    const timestamp = Date.now();
    const [org] = await drizzle
      .insert(schema.organizations)
      .values({
        name: `Test Org Metadata ${timestamp}`,
        slug: `test-org-metadata-${timestamp}`,
      })
      .returning();

    const [user] = await drizzle
      .insert(schema.users)
      .values({
        email: `test-metadata-${timestamp}@example.com`,
        name: "Test User",
      })
      .returning();

    const ctx = getServerContext();
    const metadata = {
      environment: "production",
      region: "us-east-1",
      costCenter: "engineering",
    };

    const result = await createConnector(ctx, org.id, user.id, {
      name: "Connector with Metadata",
      type: "postgresql",
      config: {
        host: "localhost",
        port: 25432,
        database: "safee",
        username: "safee",
        password: "safee",
      },
      tags: ["production", "primary"],
      metadata,
    });

    expect(result.metadata).toEqual(metadata);
    expect(result.tags).toEqual(["production", "primary"]);

    // Verify it was stored in the database
    const stored = await drizzle.query.connectors.findFirst({
      where: (connectors, { eq }) => eq(connectors.id, result.id),
    });

    expect(stored?.metadata).toEqual(metadata);
    expect(stored?.tags).toEqual(["production", "primary"]);
  });
});
