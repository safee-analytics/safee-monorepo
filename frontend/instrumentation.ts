import * as Sentry from "@sentry/nextjs";

// Initialize Sentry for both Node.js and Edge runtimes
// Using static configuration instead of dynamic imports for better bundling
export function register() {
  if (process.env.NEXT_RUNTIME === "nodejs" || process.env.NEXT_RUNTIME === "edge") {
    Sentry.init({
      dsn: process.env.SENTRY_DSN,

      // 🔑 Skip OpenTelemetry auto-instrumentation to avoid require-in-the-middle issues
      // with Next.js 16 + Turbopack + standalone mode
      skipOpenTelemetrySetup: true,

      tracesSampleRate: 1,
      enableLogs: true,
      sendDefaultPii: true,
    });
  }
}

export const onRequestError = Sentry.captureRequestError;
