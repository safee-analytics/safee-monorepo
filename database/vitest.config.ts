import { defineConfig } from "vitest/config";

export default defineConfig({
  test: {
    environment: "node",
    globals: true,
    coverage: {
      provider: "v8",
      reporter: ["text", "json", "html"],
      exclude: ["node_modules/**", "build/**", "**/*.d.ts", "src/private/**"],
    },
    env: {
      NODE_ENV: "test",
      DATABASE_URL: "postgresql://safee:safee@localhost:25432/safee",
      REDIS_URL: "redis://localhost:26379",
    },
    testTimeout: 10000,
    exclude: ["**/integration/**", "**/e2e/**", "node_modules/**", "build/**"],
    fileParallelism: false,
    maxConcurrency: 1,
    pool: "forks",
    maxWorkers: 1,
  },
});
