import type { NextConfig } from "next";
import path from "path";

const monorepoRoot = path.join(__dirname, "..");
const nextConfig: NextConfig = {
  reactStrictMode: true,
  turbopack: {
    root: monorepoRoot,
  },
  outputFileTracingRoot: monorepoRoot,
};

export default nextConfig;
