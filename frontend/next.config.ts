import { withSentryConfig } from "@sentry/nextjs";
import type { NextConfig } from "next";
import path from "node:path";

const monorepoRoot = path.join(__dirname, "..");
const nextConfig: NextConfig = {
  reactStrictMode: true,
  outputFileTracingRoot: monorepoRoot,
  output: "standalone",
  serverExternalPackages: ["@safee/database"],
};

export default withSentryConfig(nextConfig, {
  org: "safee-analytics",
  project: "safee-dev",
  silent: !process.env.CI,
  widenClientFileUpload: true,
  tunnelRoute: "/monitoring",
  // Automatically tree-shake Sentry logger statements to reduce bundle size
  disableLogger: true,
});
