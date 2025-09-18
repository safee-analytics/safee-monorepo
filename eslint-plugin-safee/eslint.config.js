import eslintPluginEslintPlugin from "eslint-plugin-eslint-plugin";
import safeeEslintConfig from "../eslint.config.js";

export default safeeEslintConfig.config(eslintPluginEslintPlugin.configs["flat/recommended"], {
  languageOptions: {
    parserOptions: {
      projectService: true,
      tsconfigRootDir: import.meta.dirname,
    },
  },
});
