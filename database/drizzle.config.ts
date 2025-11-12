import { defineConfig } from "drizzle-kit";

export default defineConfig({
  dialect: "postgresql",
  out: "./src/migrations",
  schema: "./build/src/drizzle/index.js",
  dbCredentials: { url: process.env.DATABASE_URL! },
  verbose: true,
  strict: true,
  breakpoints: false,
  casing: "snake_case",
  schemaFilter: ["identity", "finance", "hr", "sales", "system"],
  migrations: {
    prefix: "index",
    table: "drizzle_migrations",
    schema: "public",
  },
});
