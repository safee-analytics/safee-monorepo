import type { NextConfig } from "next";
import path from "path";

const monorepoRoot = path.join(__dirname, "..");
const nextConfig: NextConfig = {
  reactStrictMode: true,
  outputFileTracingRoot: monorepoRoot,
  output: "standalone",
  serverExternalPackages: ["@safee/database"],
};

export default nextConfig;
