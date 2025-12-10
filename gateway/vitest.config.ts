import { defineConfig } from "vitest/config";

export default defineConfig({
  test: {
    environment: "node",
    globals: true,
    fileParallelism: false,
    pool: "forks",
    maxWorkers: 1,
    coverage: {
      provider: "v8",
      reporter: ["text", "json", "html"],
      exclude: [
        "node_modules/**",
        "build/**",
        "dist/**",
        "**/*.d.ts",
        "src/server/routes.ts", // TSOA generated
        "src/server/swagger.json", // TSOA generated
      ],
    },
    env: {
      ENV: "test",
      NODE_ENV: "test",
      DATABASE_URL: "postgresql://safee:safee@localhost:25432/safee",
      REDIS_URL: "redis://localhost:26379",
      ODOO_URL: "http://localhost:18069",
      ODOO_ADMIN_PASSWORD: "admin",
      JWT_SECRET: "test-jwt-secret",
      LOG_LEVEL: "info",
    },
    testTimeout: 15000,
    // Exclude e2e tests that require full server setup
    exclude: ["**/e2e/**", "node_modules/**", "build/**"],
  },
});
