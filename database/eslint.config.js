import { config } from "../eslint.config.js";

export default config(
  {
    languageOptions: {
      parserOptions: {
        projectService: true,
        tsconfigRootDir: import.meta.dirname,
      },
    },
  },
  {
    ignores: ["drizzle.config.ts", "vitest.config.ts"],
  },
);
