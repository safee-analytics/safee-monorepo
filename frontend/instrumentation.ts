import * as Sentry from "@sentry/nextjs";

// Initialize Sentry for both Node.js and Edge runtimes
// Using static configuration instead of dynamic imports for better bundling
export function register() {
  if (process.env.NEXT_RUNTIME === "nodejs" || process.env.NEXT_RUNTIME === "edge") {
    Sentry.init({
      dsn: process.env.SENTRY_DSN,

      // 🔑 Use Sentry's instrumenter instead of OpenTelemetry auto-instrumentation
      // This avoids the require-in-the-middle dependency issues with Next.js 16 + Turbopack
      instrumenter: 'sentry',

      tracesSampleRate: 1,
      enableLogs: true,
      sendDefaultPii: true,
    });
  }
}

export const onRequestError = Sentry.captureRequestError;
