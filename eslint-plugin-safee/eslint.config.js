import eslintPluginEslintPlugin from "eslint-plugin-eslint-plugin";
import { config } from "../eslint.config.js";

export default config(eslintPluginEslintPlugin.configs["flat/recommended"], {
  languageOptions: {
    parserOptions: {
      projectService: true,
      tsconfigRootDir: import.meta.dirname,
    },
  },
});
