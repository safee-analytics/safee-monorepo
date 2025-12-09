/** @type {import('next').NextConfig} */
const nextConfig = {
  output: "standalone",
  reactStrictMode: true,
  poweredByHeader: false,
  compress: true,

  // Transpile packages from the monorepo
  transpilePackages: ["@safee/ui", "@safee/auth", "@safee/database"],

  experimental: {
    optimizePackageImports: ["@safee/ui", "lucide-react"],
  },
};

export default nextConfig;
