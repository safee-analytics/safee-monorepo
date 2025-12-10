import nextConfig from "eslint-config-next";
import safeePlugin from "@safee/eslint-plugin";
import tseslint from "typescript-eslint";

const eslintConfig = [
  ...(Array.isArray(nextConfig) ? nextConfig : [nextConfig]),
  ...tseslint.configs.recommended,

  safeePlugin.configs.recommended,

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
    ],
  },

  {
    rules: {
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

      "react/react-in-jsx-scope": "off",
      "react/prop-types": "off",
      "react-hooks/rules-of-hooks": "error",
      "react-hooks/exhaustive-deps": "warn",
      "@next/next/no-img-element": "off", // Use next/image

      "no-console": ["warn", { allow: ["warn", "error"] }],
      "prefer-const": "error",
      "no-var": "error",

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
];

export default eslintConfig;
