import { defineConfig } from "tsup";

export default defineConfig([
  {
    entry: {
      index: "src/index.ts",
      // Split into separate chunks to avoid Turbopack bug
      components: "src/components/index.ts",
      utils: "src/utils/index.ts",
    },
    format: ["cjs", "esm"],
    dts: true,
    sourcemap: false, // Disabled to fix Turbopack build issue
    clean: true,
    minify: true, // Minify to reduce file size for Turbopack
    external: ["react", "react-dom", "lucide-react"],
    splitting: true, // Enable code splitting
  },
  {
    entry: ["src/tailwind.config.ts"],
    format: ["cjs", "esm"],
    dts: true,
    sourcemap: false,
    external: ["tailwindcss"],
  },
]);
