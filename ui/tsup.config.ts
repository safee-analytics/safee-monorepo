import { defineConfig } from "tsup";

export default defineConfig([
  {
    entry: ["src/index.ts"],
    format: ["cjs", "esm"],
    dts: true,
    sourcemap: false, // Disabled to fix Turbopack build issue
    clean: true,
    minify: true, // Minify to reduce file size for Turbopack
    external: ["react", "react-dom"],
  },
  {
    entry: ["src/tailwind.config.ts"],
    format: ["cjs", "esm"],
    dts: true,
    sourcemap: false,
    external: ["tailwindcss"],
  },
]);
