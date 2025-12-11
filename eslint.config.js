import globals from "globals";
import eslint from "@eslint/js";
import tsEslint from "typescript-eslint";
import eslintPluginImport from "eslint-plugin-import-x";
import eslintConfigPrettier from "eslint-config-prettier";
import eslintPluginUnicorn from "eslint-plugin-unicorn";

const baseConfig = tsEslint.config(
  eslint.configs.recommended,
  eslintPluginImport.flatConfigs.recommended,
  eslintPluginImport.flatConfigs.typescript,
  ...tsEslint.configs.strictTypeChecked,
  ...tsEslint.configs.stylisticTypeChecked,
  {
    languageOptions: {
      globals: globals.builtin,
    },
    plugins: {
      unicorn: eslintPluginUnicorn,
    },
    rules: {
      "unicorn/catch-error-name": ["error", { name: "err" }],
      "unicorn/no-array-for-each": ["error"],
      "unicorn/no-instanceof-array": ["error"],
      "unicorn/prefer-node-protocol": ["error"],
    },
  },
  {
    rules: {
      "no-console": "warn",
      "id-denylist": ["error", "idx"],
      "dot-notation": "error",
      "spaced-comment": "error",
      "prefer-template": "warn",
      "func-style": ["error", "declaration"],
      "prefer-const": "warn",
      "no-var": "error",
      "no-useless-return": "error",
      "no-useless-rename": "error",
      "no-useless-computed-key": "error",
      "no-else-return": "error",
      "no-alert": "error",
      "no-lonely-if": "error",
      "no-nested-ternary": "error",
      "object-shorthand": "error",
      quotes: ["error", "double", { avoidEscape: true }],
      yoda: "error",
      eqeqeq: "error",
      "@typescript-eslint/no-empty-function": "off",
      "@typescript-eslint/restrict-template-expressions": [
        "error",
        {
          allowNumber: true,
          allowBoolean: true,
        },
      ],
      "@typescript-eslint/require-await": "off",
      "@typescript-eslint/consistent-type-definitions": "off",
      "@typescript-eslint/naming-convention": [
        "error",
        {
          selector: "default",
          format: null,
        },
        {
          selector: "enumMember",
          format: ["StrictPascalCase"],
        },
      ],
      "@typescript-eslint/no-unused-vars": [
        "warn",
        { varsIgnorePattern: "^_.*", argsIgnorePattern: "^_.*" },
      ],
      "@typescript-eslint/no-non-null-assertion": "off",
      "import-x/no-relative-packages": ["error"],
    },
  },
  {
    languageOptions: {
      ecmaVersion: 2024,
      sourceType: "module",
      globals: { ...globals.node },
      parserOptions: {
        project: true,
      },
    },
  },
  /*
    The @typescript-eslint/unbound-method rule incorrectly flags Sinon stub methods as having this binding issues, 
    but Sinon stubs are designed to be passed around safely and don't have this context problems. 
    This is a well-known false positive in the TypeScript/Sinon community, so disabling it for test files.
    */
  {
    files: ["**/*.test.ts"],
    rules: {
      "@typescript-eslint/unbound-method": "off",
    },
  },
  {
    ignores: [
      "**/.DS_Store",
      "**/node_modules",
      "**/build",
      "**/public",
      "**/out",
      "**/.svelte-kit",
      "**/.env",
      "**/.env.*",
      "!**/.env.example",
      "**/package-lock.json",
      "**/src/server/routes.ts",
      "**/src/server/swagger.json",
      "*.js",
      "*.cjs",
      "*.mjs",
      ".venv",
    ],
  },
  eslintConfigPrettier,
);

// Export base config as default for direct use
export default baseConfig;

// Export a config function to allow other packages to extend this config
export const config = (...configs) => tsEslint.config(...baseConfig, ...configs);
