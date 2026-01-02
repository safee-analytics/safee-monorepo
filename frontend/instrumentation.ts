import * as Sentry from "@sentry/nextjs";

// Initialize Sentry for both Node.js and Edge runtimes.
// skipOpenTelemetrySetup avoids @opentelemetry imports that are not installed in the project.
export function register() {
  if (process.env.NEXT_RUNTIME === "nodejs" || process.env.NEXT_RUNTIME === "edge") {
    Sentry.init({
      dsn: process.env.SENTRY_DSN,
      skipOpenTelemetrySetup: true,
      tracesSampleRate: 1,
      enableLogs: true,
      sendDefaultPii: true,
    });
  }
}

export const onRequestError = Sentry.captureRequestError;
