/* eslint-disable no-console */
import { drizzle } from "drizzle-orm/node-postgres";
import pg from "pg";
import { users, organizations } from "../drizzle/index.js";
import * as schema from "../drizzle/index.js";
import { eq } from "drizzle-orm";

const DEV_USER_EMAIL = "dev@safee.local";
const DEV_ORG_NAME = "Safee Development";
const DEV_USER_ID = "00000000-0000-0000-0000-000000000001";
const DEV_ORG_ID = "00000000-0000-0000-0000-000000000002";

async function seedDevUser() {
  const pool = new pg.Pool({
    connectionString: process.env.DATABASE_URL,
  });

  const db = drizzle(pool, { schema });

  try {
    console.log("🌱 Seeding development user...");

    const existingOrg = await db.query.organizations.findFirst({
      where: eq(organizations.id, DEV_ORG_ID),
    });

    if (!existingOrg) {
      await db.insert(organizations).values({
        id: DEV_ORG_ID,
        name: DEV_ORG_NAME,
        slug: "safee-dev",
        defaultLocale: "en",
      });
      console.log("✅ Created development organization");
    } else {
      console.log("⏭️  Development organization already exists");
    }

    const existingUser = await db.query.users.findFirst({
      where: eq(users.id, DEV_USER_ID),
    });

    if (!existingUser) {
      await db.insert(users).values({
        id: DEV_USER_ID,
        email: DEV_USER_EMAIL,
        firstName: "Dev",
        lastName: "User",
        passwordHash: "$2b$10$dummy.hash.for.dev.user.only",
        organizationId: DEV_ORG_ID,
        preferredLocale: "en",
      });
      console.log("✅ Created development user");
      console.log(`   Email: ${DEV_USER_EMAIL}`);
      console.log(`   User ID: ${DEV_USER_ID}`);
    } else {
      console.log("⏭️  Development user already exists");
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
