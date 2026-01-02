// This file configures the initialization of Sentry on the server.
// The config you add here will be used whenever the server handles a request.
// https://docs.sentry.io/platforms/javascript/guides/nextjs/

import * as Sentry from "@sentry/nextjs";

// Deployment environment: local (localhost), development (dev.safee.dev), production (prod.safee.dev)
const deploymentEnv = process.env.NEXT_PUBLIC_DEPLOYMENT_ENV || process.env.DEPLOYMENT_ENV || "local";
const isLocal = deploymentEnv === "local";
const isProduction = deploymentEnv === "production";

Sentry.init({
  dsn: process.env.SENTRY_DSN,

  environment: deploymentEnv,

  // Avoid pulling in @opentelemetry/* modules in the Next.js runtime
  skipOpenTelemetrySetup: true,

  tracesSampleRate: isProduction ? 0.1 : 1.0,

  enableLogs: true,

  sendDefaultPii: true,

  enabled: !isLocal,
});
