import globals from "globals";
import js from "@eslint/js";
import tseslint from "typescript-eslint";
import safee from "@safee/eslint-plugin";

export default [
  js.configs.recommended,
  {
    files: ["**/*.ts", "**/*.tsx"],
    languageOptions: {
      parser: tseslint.parser,
      globals: {
        ...globals.node,
        ...globals.vitest,
      },
      parserOptions: {
        ecmaVersion: "latest",
        sourceType: "module",
        project: "./tsconfig.json",
      },
    },
    plugins: {
      "@typescript-eslint": tseslint.plugin,
      safee,
    },
    rules: {
      ...tseslint.configs.recommended.rules,

      ...safee.configs.recommended.rules,

      "@typescript-eslint/no-unused-vars": ["error", { argsIgnorePattern: "^_" }],
      "@typescript-eslint/explicit-function-return-type": "off",
      "@typescript-eslint/no-explicit-any": "warn",
      "no-console": "off",
    },
  },
  {
    ignores: ["node_modules/", "dist/", "build/", "coverage/", "*.js", "*.mjs"],
  },
];
