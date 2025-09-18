import { describe, it, expect, beforeAll, afterAll } from "vitest";
import { connect, redisConnect } from "@safee/database";

describe("Database Integration Tests", () => {
  let db: Awaited<ReturnType<typeof connect>>;
  let redis: Awaited<ReturnType<typeof redisConnect>>;

  beforeAll(async () => {
    // Connect to test database
    db = connect("test", process.env.DATABASE_URL);
    redis = await redisConnect();
  });

  afterAll(async () => {
    // Clean up connections
    await db.pool.end();
    await redis.quit();
  });

  it("should connect to PostgreSQL", async () => {
    const result = await db.pool.query("SELECT 1 as test");
    expect(result.rows[0].test).toBe(1);
  });

  it("should connect to Redis", async () => {
    const result = await redis.ping();
    expect(result).toBe("PONG");
  });

  it("should have correct schemas", async () => {
    const result = await db.pool.query(`
      SELECT schema_name
      FROM information_schema.schemata
      WHERE schema_name IN ('identity', 'finance', 'hr', 'sales', 'system')
      ORDER BY schema_name
    `);

    const schemas = result.rows.map((row: { schema_name: string }) => row.schema_name);
    expect(schemas).toEqual(["finance", "hr", "identity", "sales", "system"]);
  });

  it("should be able to query identity.organizations table", async () => {
    const result = await db.pool.query(`
      SELECT COUNT(*) as count
      FROM identity.organizations
    `);

    // Should not throw and should return a count (even if 0)
    expect(typeof result.rows[0].count).toBe("string");
  });

  it("should be able to perform Redis operations", async () => {
    await redis.set("test:key", "test-value");
    const value = await redis.get("test:key");
    expect(value).toBe("test-value");

    await redis.del("test:key");
    const deletedValue = await redis.get("test:key");
    expect(deletedValue).toBeNull();
  });
});
