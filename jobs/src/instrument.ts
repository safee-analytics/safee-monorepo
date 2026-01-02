import * as Sentry from "@sentry/node";

Sentry.init({
  dsn: process.env.SENTRY_DSN_JOBS,
  sendDefaultPii: true,
  environment: process.env.NODE_ENV ?? "development",

  tracesSampleRate: process.env.NODE_ENV === "production" ? 0.1 : 1.0,

  profilesSampleRate: process.env.NODE_ENV === "production" ? 0.1 : 1.0,
});
