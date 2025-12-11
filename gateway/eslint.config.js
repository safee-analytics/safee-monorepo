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
    rules: {
      "@typescript-eslint/no-explicit-any": "error",
    },
  },
  {
    files: ["**/*.test.ts", "**/*.spec.ts"],
    rules: {
      "no-console": "off",
    },
  },
  {
    files: ["**/*.d.ts"],
    rules: {
      "no-undef": "off",
    },
  },
  {
    ignores: [
      "src/generated/",
      "src/server/routes.ts",
      "src/server/swagger.json",
      "vitest.config.ts",
      "dev.ts",
    ],
  },
);
