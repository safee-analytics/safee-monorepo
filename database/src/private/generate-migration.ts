/* eslint-disable no-console */
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { writeFile, readdir, readFile } from "node:fs/promises";
import { execSync } from "node:child_process";
import Postgrator from "postgrator";

const __dirname = dirname(fileURLToPath(import.meta.url));

async function main() {
  const [, , name] = process.argv;
  if (!name) {
    console.error("Usage: npm run generate-migration <migration-name>");
    console.error("Example: npm run generate-migration add-user-preferences");
    process.exit(2);
  }

  try {
    console.log("🏗️ Building database package...");
    console.log("Working directory:", join(__dirname, "../.."));

    // Build the database package first
    execSync("npm run build", {
      encoding: "utf-8",
      cwd: join(__dirname, "../.."),
      stdio: "inherit",
    });

    console.log("🔍 Generating Drizzle schema changes...");
    console.log("Drizzle config should be at:", join(__dirname, "../..", "drizzle.config.ts"));

    // Generate drizzle migration with custom config to force generation
    const drizzleOutput = execSync("npx drizzle-kit generate --custom", {
      encoding: "utf-8",
      cwd: join(__dirname, "../.."),
    });

    console.log("Drizzle output:", drizzleOutput);

    // Find the latest drizzle migration file
    const drizzleMigrationsDir = join(__dirname, "../migrations");
    console.log("Looking for Drizzle migrations in:", drizzleMigrationsDir);
    const drizzleFiles = await readdir(drizzleMigrationsDir);
    console.log("Files in drizzle migrations directory:", drizzleFiles);

    const sqlFiles = drizzleFiles.filter((f) => f.endsWith(".sql")).sort();
    console.log("SQL files found:", sqlFiles);

    const latestDrizzleMigration = sqlFiles[sqlFiles.length - 1];
    console.log("Latest migration file:", latestDrizzleMigration);

    if (!latestDrizzleMigration) {
      console.log("No new Drizzle migration generated (no schema changes detected)");
      return;
    }

    console.log(`📝 Found new Drizzle migration: ${latestDrizzleMigration}`);

    // Read the generated SQL
    const drizzleSql = await readFile(join(drizzleMigrationsDir, latestDrizzleMigration), "utf-8");

    // Get next Postgrator migration number
    const postgratorMigrationsDir = join(__dirname, "../migrations");
    const postgrator = new Postgrator({
      migrationPattern: join(postgratorMigrationsDir, "*"),
      driver: "pg",
      schemaTable: "__postgrator_migrations",
    });

    const maxVersion = await postgrator.getMaxVersion();
    const nextVersion = maxVersion === -Infinity ? 1 : maxVersion + 1;

    // Create Postgrator migration file
    const postgratorMigrationFile = join(postgratorMigrationsDir, `${nextVersion}.do.${name}.sql`);

    const migrationContent = `-- Migration: ${name}
-- Generated from Drizzle schema changes
-- Drizzle file: ${latestDrizzleMigration}

${drizzleSql}`;

    await writeFile(postgratorMigrationFile, migrationContent);

    console.log(`✅ Created Postgrator migration: ${postgratorMigrationFile}`);
    console.log("📋 Migration content preview:");
    console.log("─".repeat(50));
    console.log(migrationContent.split("\n").slice(0, 10).join("\n"));
    if (migrationContent.split("\n").length > 10) {
      console.log("... (truncated)");
    }
    console.log("─".repeat(50));

    console.log("\n🚀 Next steps:");
    console.log("1. Review the migration file");
    console.log("2. Run 'npm run migrate' to apply the migration");
    console.log("3. Commit both the Drizzle and Postgrator migration files");
  } catch (err) {
    console.error("❌ Error generating migration:", err);
    process.exit(1);
  }
}

await main();
