import { defineConfig } from "drizzle-kit";
import "dotenv/config";
export default defineConfig({
  dialect: "postgresql",
  out: "./src/migrations",
  schema: "./build/src/drizzle/index.js",
  dbCredentials: { url: process.env.DATABASE_URL! },
  verbose: true,
  strict: true,
  breakpoints: false,
  casing: "snake_case",
  schemaFilter: ["identity", "finance", "hr", "sales", "system", "jobs", "audit", "odoo"],
  migrations: {
    prefix: "index",
    table: "drizzle_migrations",
    schema: "public",
  },
});
