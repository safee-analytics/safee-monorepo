import { defineConfig } from "vitest/config";

export default defineConfig({
  test: {
    environment: "node",
    globals: true,
    coverage: {
      provider: "v8",
      reporter: ["text", "json", "html"],
      exclude: ["node_modules/**", "build/**", "dist/**", "**/*.d.ts"],
    },
    env: {
      NODE_ENV: "test",
      DATABASE_URL: "postgresql://safee:safee@localhost:25432/safee",
      REDIS_URL: "redis://localhost:26379",
      JWT_SECRET: "test-jwt-secret",
      LOG_LEVEL: "silent",
    },
    testTimeout: 15000,
    // Exclude integration tests that require full server setup
    exclude: ["**/integration/**", "**/e2e/**", "node_modules/**", "build/**"],
    // Force sequential execution to prevent worker interference
    fileParallelism: false,
    pool: "forks",
    maxWorkers: 1,
    maxConcurrency: 1,
  },
});
