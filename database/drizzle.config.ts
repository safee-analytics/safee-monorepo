import "dotenv/config";
import { defineConfig } from "drizzle-kit";

export default defineConfig({
  dialect: "postgresql",
  out: "./src/drizzle",
  schema: "./build/src/drizzle/index.js",
  dbCredentials: { url: process.env.DATABASE_URL! },
  verbose: true,
  strict: true,
  breakpoints: false,
  casing: "snake_case",
  schemaFilter: ["identity", "finance", "hr", "sales", "system"],
});
