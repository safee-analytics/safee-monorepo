import { defineConfig } from "vitest/config";

export default defineConfig({
  test: {
    environment: "node",
    globals: true,
    coverage: {
      provider: "v8",
      reporter: ["text", "json", "html"],
      exclude: [
        "node_modules/**",
        "build/**",
        "**/*.d.ts",
        "src/private/**", // Migration scripts
      ],
    },
    env: {
      NODE_ENV: "test",
      DATABASE_URL: "postgresql://safee:safee@localhost:45432/safee",
      REDIS_URL: "redis://localhost:16379",
    },
    testTimeout: 10000,
    // Only run unit tests (no integration tests that require Docker)
    exclude: ["**/integration/**", "**/e2e/**", "node_modules/**", "build/**"],
  },
});
