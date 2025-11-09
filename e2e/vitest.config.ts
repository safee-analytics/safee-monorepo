import { defineConfig } from "vitest/config";

export default defineConfig({
  test: {
    environment: "node",
    globals: true,
    setupFiles: ["./setup/test-setup.ts"],
    coverage: {
      provider: "v8",
      reporter: ["text", "json", "html"],
      exclude: ["node_modules/**", "dist/**", "**/*.d.ts", "setup/**"],
    },
    env: {
      NODE_ENV: "test",
      DATABASE_URL: "postgresql://postgres:postgres@localhost:25432/safee",
      REDIS_URL: "redis://localhost:26379",
      PUBSUB_EMULATOR_HOST: "localhost:48085",
    },
    testTimeout: 30000,
    hookTimeout: 30000,
  },
});
