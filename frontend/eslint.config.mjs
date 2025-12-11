import nextConfig from "eslint-config-next";
import safeePlugin from "@safee/eslint-plugin";
import tseslint from "typescript-eslint";

const eslintConfig = [
  ...(Array.isArray(nextConfig) ? nextConfig : [nextConfig]),
  ...tseslint.configs.recommended,

  safeePlugin.configs.recommended,

  {
    languageOptions: {
      parserOptions: {
        projectService: true,
        tsconfigRootDir: import.meta.dirname,
      },
    },
  },

  {
    ignores: [
      "node_modules/**",
      ".next/**",
      "out/**",
      "build/**",
      "dist/**",
      "next-env.d.ts",
      "*.config.js",
      "*.config.mjs",
      "scripts/**/*.mjs", // Build scripts
    ],
  },

  {
    rules: {
      // TypeScript - Balanced strictness for frontend
      "@typescript-eslint/no-unused-vars": [
        "error",
        {
          argsIgnorePattern: "^_",
          varsIgnorePattern: "^_",
          caughtErrorsIgnorePattern: "^_",
        },
      ],
      "@typescript-eslint/no-explicit-any": "warn",
      "@typescript-eslint/explicit-module-boundary-types": "off",
      "@typescript-eslint/no-floating-promises": "error", // Important for async safety
      "@typescript-eslint/no-misused-promises": "error", // Prevent promise mistakes

      // React patterns
      "react/react-in-jsx-scope": "off",
      "react/prop-types": "off",
      "react-hooks/rules-of-hooks": "error",
      "react-hooks/exhaustive-deps": "warn",
      "@next/next/no-img-element": "off",

      // Code quality without being pedantic
      "no-console": ["warn", { allow: ["warn", "error"] }],
      "prefer-const": "error",
      "no-var": "error",
      eqeqeq: ["error", "always"], // Require === and !==
      "no-else-return": "error", // Cleaner conditionals

      // Disable only the React-specific pedantic rules
      "func-style": "off", // Arrow functions are idiomatic in React
      "no-nested-ternary": "off", // Sometimes useful in JSX

      // Accessibility
      "jsx-a11y/alt-text": "warn",
      "jsx-a11y/anchor-is-valid": "warn",
    },
  },

  {
    files: ["app/**/*.{ts,tsx}"],
    rules: {
      "@typescript-eslint/no-explicit-any": "error",
    },
  },
  {
    files: ["components/**/*.{ts,tsx}"],
    rules: {
      "@typescript-eslint/no-explicit-any": "error",
    },
  },
];

export default eslintConfig;
