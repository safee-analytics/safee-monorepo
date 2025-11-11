import { defineConfig } from "vitest/config";

export default defineConfig({
  test: {
    environment: "node",
    globals: true,
    pool: "forks",
    poolOptions: {
      forks: {
        singleFork: true,
      },
    },
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
      JWT_SECRET: "test-jwt-secret",
      LOG_LEVEL: "silent",
    },
    testTimeout: 15000,
    // Exclude integration tests that require full server setup
    exclude: ["**/integration/**", "**/e2e/**", "node_modules/**", "build/**"],
  },
});
