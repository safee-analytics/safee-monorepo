import globals from "globals";
import { config } from "../eslint.config.js";

export default config(
  {
    languageOptions: {
      globals: {
        ...globals.vitest,
      },
      parserOptions: {
        project: "./tsconfig.json",
        tsconfigRootDir: import.meta.dirname,
      },
    },
  },
  {
    rules: {
      "no-console": "off",
    },
  },
  {
    ignores: ["coverage/"],
  },
);
