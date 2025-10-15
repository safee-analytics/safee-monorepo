import safeeEslintConfig from "../eslint.config.js";

export default safeeEslintConfig.config({
  languageOptions: {
    parserOptions: {
      projectService: {
        allowDefaultProject: ["*.config.ts"],
      },
      tsconfigRootDir: import.meta.dirname,
    },
  },
});
