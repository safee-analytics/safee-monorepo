import type { Config } from "tailwindcss";
import plugin from "tailwindcss/plugin";

const config: Config = {
  darkMode: "class", // Enable dark mode with class strategy
  content: [
    "./pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./components/**/*.{js,ts,jsx,tsx,mdx}",
    "./app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      // Arabic-friendly fonts
      fontFamily: {
        sans: ["var(--font-inter)", "var(--font-cairo)", "sans-serif"],
        cairo: ["var(--font-cairo)", "sans-serif"],
      },
      colors: {
        // Safee brand colors - Professional blue palette
        safee: {
          50: "#eff6ff",
          100: "#dbeafe",
          200: "#bfdbfe",
          300: "#93c5fd",
          400: "#60a5fa",
          500: "#3b82f6", // Main brand color
          600: "#2563eb",
          700: "#1d4ed8",
          800: "#1e40af",
          900: "#1e3a8a",
        },
        // Status colors
        success: {
          500: "#10b981",
          600: "#059669",
        },
        warning: {
          500: "#f59e0b",
          600: "#d97706",
        },
        danger: {
          500: "#ef4444",
          600: "#dc2626",
        },
        // Semantic color tokens for theming
        background: {
          DEFAULT: "rgb(255 255 255)", // white in light mode
          secondary: "rgb(249 250 251)", // gray-50 in light mode
          tertiary: "rgb(243 244 246)", // gray-100 in light mode
        },
        foreground: {
          DEFAULT: "rgb(17 24 39)", // gray-900 in light mode
          secondary: "rgb(75 85 99)", // gray-600 in light mode
          tertiary: "rgb(156 163 175)", // gray-400 in light mode
        },
        border: {
          DEFAULT: "rgb(229 231 235)", // gray-200 in light mode
          secondary: "rgb(209 213 219)", // gray-300 in light mode
        },
      },
      // Dark mode overrides using CSS variables
      backgroundColor: {
        "bg-primary": "var(--bg-primary)",
        "bg-secondary": "var(--bg-secondary)",
        "bg-tertiary": "var(--bg-tertiary)",
      },
      textColor: {
        "text-primary": "var(--text-primary)",
        "text-secondary": "var(--text-secondary)",
        "text-tertiary": "var(--text-tertiary)",
      },
      borderColor: {
        "border-primary": "var(--border-primary)",
        "border-secondary": "var(--border-secondary)",
      },
      animation: {
        blob: "blob 7s infinite",
      },
      keyframes: {
        blob: {
          "0%": {
            transform: "translate(0px, 0px) scale(1)",
          },
          "33%": {
            transform: "translate(30px, -50px) scale(1.1)",
          },
          "66%": {
            transform: "translate(-20px, 20px) scale(0.9)",
          },
          "100%": {
            transform: "translate(0px, 0px) scale(1)",
          },
        },
      },
    },
  },
  plugins: [
    plugin(({ addUtilities }) => {
      addUtilities({
        ".animation-delay-2000": {
          "animation-delay": "2s",
        },
        ".animation-delay-4000": {
          "animation-delay": "4s",
        },
      });
    }),
  ],
};

export default config;
