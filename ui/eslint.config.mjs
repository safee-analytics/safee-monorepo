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
    ignores: ["tsup.config.ts", "dist/**"],
  },
);
