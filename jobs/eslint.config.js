import { config } from "../eslint.config.js";

export default config({
  languageOptions: {
    parserOptions: {
      projectService: {
        allowDefaultProject: ["*.config.ts"],
      },
      tsconfigRootDir: import.meta.dirname,
    },
  },
});
