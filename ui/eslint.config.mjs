import safeeEslintConfig from "../eslint.config.js";

export default safeeEslintConfig.config(
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
