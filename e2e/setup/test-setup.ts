import { beforeAll, afterAll } from "vitest";

// Global test setup that runs once before all tests
beforeAll(async () => {
  console.log("🚀 Starting test environment setup...");

  // Wait for Docker services to be ready
  await waitForServices();

  console.log("✅ Test environment ready!");
});

// Global cleanup that runs once after all tests
afterAll(async () => {
  console.log("🧹 Cleaning up test environment...");
  // Any global cleanup can go here
});

async function waitForServices() {
  const maxRetries = 30;
  const retryDelay = 1000;

  // Wait for PostgreSQL
  for (let i = 0; i < maxRetries; i++) {
    try {
      const { Pool } = await import("pg");
      const pool = new Pool({
        connectionString: process.env.DATABASE_URL,
      });
      await pool.query("SELECT 1");
      await pool.end();
      console.log("✅ PostgreSQL is ready");
      break;
    } catch (err) {
      if (i === maxRetries - 1) {
        throw new Error(`PostgreSQL not ready after ${maxRetries} attempts: ${String(err)}`);
      }
      await new Promise((resolve) => setTimeout(resolve, retryDelay));
    }
  }

  // Wait for Redis
  for (let i = 0; i < maxRetries; i++) {
    try {
      const { createClient } = await import("redis");
      const client = createClient({
        url: process.env.REDIS_URL,
      });
      await client.connect();
      await client.ping();
      await client.quit();
      console.log("✅ Redis is ready");
      break;
    } catch (err) {
      if (i === maxRetries - 1) {
        throw new Error(`Redis not ready after ${maxRetries} attempts: ${String(err)}`);
      }
      await new Promise((resolve) => setTimeout(resolve, retryDelay));
    }
  }

  // Wait for Odoo (only required for e2e tests, not integration tests)
  // Skip Odoo check unless explicitly required via REQUIRE_ODOO env var
  if (process.env.REQUIRE_ODOO === "true") {
    const odooHealthUrl = new URL("/web/health", process.env.ODOO_URL ?? "http://localhost:8069").toString();

    for (let i = 0; i < maxRetries; i++) {
      try {
        const response = await fetch(odooHealthUrl);
        if (response.ok) {
          console.log("✅ Odoo is ready");
          break;
        }
        throw new Error(`Unexpected status ${response.status}`);
      } catch (err) {
        if (i === maxRetries - 1) {
          throw new Error(`Odoo not ready after ${maxRetries} attempts: ${String(err)}`);
        }
        await new Promise((resolve) => setTimeout(resolve, retryDelay));
      }
    }
  } else {
    console.log("⏭️  Skipping Odoo check (not required for integration tests)");
  }
}
