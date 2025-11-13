import { defineConfig } from "tsup";

export default defineConfig([
  {
    entry: ["src/index.ts"],
    format: ["cjs", "esm"],
    dts: true,
    sourcemap: true,
    clean: true,
    external: ["react", "react-dom"],
  },
  {
    entry: ["src/tailwind.config.ts"],
    format: ["cjs", "esm"],
    dts: true,
    sourcemap: true,
    external: ["tailwindcss"],
  },
]);
