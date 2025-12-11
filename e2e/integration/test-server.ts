import { concurrently, ConcurrentlyResult } from "concurrently";

const COMMON_ENV = {
  LOG_LEVEL: "info",
  DATABASE_URL: "postgresql://safee:safee@localhost:45432/safee",
  REDIS_URL: "redis://localhost:46379",
  NODE_ENV: "test",
  COOKIE_KEY: "test-key",
  API_SECRET_KEY: "test-api-key",
  JWT_SECRET: "test-jwt-secret",
};

export async function startTestServer() {
  try {
    console.log("🚀 Starting test server...");

    const port = Number(process.env.TEST_PORT) || 3001;

    const apps = [
      {
        name: "gateway",
        command: "npm run -w gateway dev",
        env: { ...COMMON_ENV, PORT: port, HOST: "localhost" },
      },
    ];

    const result = concurrently(apps, { prefixColors: "auto" });

    console.log(`✅ Test server starting on port ${port}`);
    return { port, result };
  } catch (err) {
    console.error("❌ Failed to start test server:", err);
    throw err;
  }
}

export async function stopTestServer(result: ConcurrentlyResult) {
  try {
    console.log("🛑 Stopping test server...");
    for (const command of result.commands) {
      command.kill();
    }
    console.log("🛑 Test server stopped");
  } catch (err) {
    console.error("❌ Failed to stop test server:", err);
  }
}

if (import.meta.url === `file://${process.argv[1]}`) {
  startTestServer().catch((err: unknown) => {
    console.error("Failed to start test server:", err);
    process.exit(1);
  });
}
