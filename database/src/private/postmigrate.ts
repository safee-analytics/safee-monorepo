/* eslint-disable no-console */
import { drizzle } from "drizzle-orm/node-postgres";
import pg from "pg";
import * as schema from "../drizzle/index.js";
import { sql } from "drizzle-orm";
import { spawn } from "node:child_process";

async function initializeOdooDatabase(dbName: string): Promise<void> {
  return new Promise((resolve, reject) => {
    console.log(`🔧 Initializing Odoo database '${dbName}' with base modules...`);

    const odooInit = spawn("docker", [
      "exec",
      "safee-odoo-1",
      "/opt/odoo/odoo-bin",
      "-c",
      "/etc/odoo/odoo.conf",
      "-d",
      dbName,
      "-i",
      "base",
      "--stop-after-init",
    ]);

    let output = "";
    odooInit.stdout.on("data", (data: Buffer) => {
      output += data.toString();
    });

    odooInit.stderr.on("data", (data: Buffer) => {
      output += data.toString();
    });

    odooInit.on("close", (code) => {
      if (code === 0) {
        console.log(`✅ Initialized Odoo database '${dbName}'`);
        resolve();
      } else {
        console.log(`⚠️  Odoo initialization output:\n${output}`);
        reject(new Error(`Odoo initialization failed with code ${code}`));
      }
    });
  });
}

async function seedDevUser() {
  const pool = new pg.Pool({
    connectionString: process.env.DATABASE_URL,
  });

  const db = drizzle(pool, { schema });

  try {
    console.log("🌱 Running post-migration tasks...");

    // Create odoo_safee database for Safee development
    console.log("🗄️  Creating odoo_safee database...");
    await db.execute(sql`
CREATE OR REPLACE FUNCTION safe_create_odoo_safee_db() RETURNS void AS $$
DECLARE
    already_exists BOOLEAN;
BEGIN
    SELECT EXISTS (SELECT 1 FROM pg_database WHERE datname = 'odoo_safee') INTO already_exists;

    IF NOT already_exists THEN
        PERFORM dblink_exec('dbname=' || current_database(), 'CREATE DATABASE odoo_safee');
    END IF;
END
$$ LANGUAGE plpgsql
`);

    try {
      await db.execute(sql`SELECT safe_create_odoo_safee_db()`);
      console.log("✅ Created odoo_safee database");
    } catch (err: unknown) {
      // If dblink extension doesn't exist, create database using raw query
      if (err instanceof Error && err.message.includes("dblink")) {
        console.log("⚠️  dblink not available, using direct CREATE DATABASE");
        await pool.query("CREATE DATABASE odoo_safee");
        console.log("✅ Created odoo_safee database");
      } else {
        throw err;
      }
    }

    await db.execute(sql`DROP FUNCTION IF EXISTS safe_create_odoo_safee_db()`);

    // Initialize odoo_safee database with Odoo base modules
    try {
      const databases = await pool.query("SELECT datname FROM pg_database WHERE datname = 'odoo_safee'");
      if (databases.rows.length > 0) {
        // Check if database is already initialized
        const odooPool = new pg.Pool({
          connectionString: process.env.DATABASE_URL?.replace(/\/[^/]+$/, "/odoo_safee"),
        });
        try {
          const result = await odooPool.query(
            "SELECT 1 FROM information_schema.tables WHERE table_name = 'ir_module_module' LIMIT 1",
          );
          if (result.rows.length === 0) {
            // Database exists but not initialized
            await odooPool.end();
            await initializeOdooDatabase("odoo_safee");
          } else {
            console.log("⏭️  odoo_safee database already initialized");
          }
        } catch {
          console.log("⚠️  Could not check odoo_safee initialization status, skipping initialization");
        } finally {
          await odooPool.end();
        }
      }
    } catch (initErr) {
      console.log("⚠️  Could not initialize odoo_safee database, skipping:", initErr);
    }

    console.log("🎉 Post-migration tasks completed!");
  } catch (err) {
    console.error("❌ Error in post-migration:", err);
    process.exit(1);
  } finally {
    await pool.end();
  }
}

void seedDevUser();
