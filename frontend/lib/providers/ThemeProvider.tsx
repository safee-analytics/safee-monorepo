"use client";

import { createContext, useContext, useEffect, useState, ReactNode } from "react";

export type Theme = "light" | "dark" | "auto";
export type ColorScheme = "blue" | "purple" | "green" | "orange" | "red" | "teal";

interface ThemeContextType {
  theme: Theme;
  resolvedTheme: "light" | "dark";
  colorScheme: ColorScheme;
  setTheme: (theme: Theme) => void;
  setColorScheme: (scheme: ColorScheme) => void;
}

const ThemeContext = createContext<ThemeContextType | undefined>(undefined);

function getSystemTheme(): "light" | "dark" {
  if (typeof window === "undefined") return "light";
  return window.matchMedia("(prefers-color-scheme: dark)").matches ? "dark" : "light";
}

function getStoredTheme(): Theme {
  if (typeof window === "undefined") return "light";
  const stored = localStorage.getItem("safee-theme");
  if (stored === "light" || stored === "dark" || stored === "auto") {
    return stored;
  }
  return "light";
}

function getStoredColorScheme(): ColorScheme {
  if (typeof window === "undefined") return "blue";
  const stored = localStorage.getItem("safee-color-scheme");
  if (
    stored === "blue" ||
    stored === "purple" ||
    stored === "green" ||
    stored === "orange" ||
    stored === "red" ||
    stored === "teal"
  ) {
    return stored;
  }
  return "blue";
}

export function ThemeProvider({ children }: { children: ReactNode }) {
  // Initialize from localStorage immediately to prevent flash
  const [theme, setThemeState] = useState<Theme>(() => getStoredTheme());
  const [colorScheme, setColorSchemeState] = useState<ColorScheme>(() => getStoredColorScheme());
  // Track system theme separately
  const [systemTheme, setSystemTheme] = useState<"light" | "dark">(() => getSystemTheme());

  // Derive resolved theme without storing in state (avoids setState in useEffect)
  const resolvedTheme = theme === "auto" ? systemTheme : theme;

  // Listen to system theme changes when in auto mode
  useEffect(() => {
    if (theme !== "auto") return;

    const mediaQuery = window.matchMedia("(prefers-color-scheme: dark)");
    const handleChange = (e: MediaQueryListEvent) => {
      setSystemTheme(e.matches ? "dark" : "light");
    };

    mediaQuery.addEventListener("change", handleChange);
    return () => { mediaQuery.removeEventListener("change", handleChange); };
  }, [theme]);

  // Apply resolved theme and color scheme to DOM (no setState calls)
  useEffect(() => {
    const root = document.documentElement;
    root.classList.remove("light", "dark");
    root.classList.add(resolvedTheme);
    root.style.setProperty("--color-primary", `var(--color-${colorScheme})`);
  }, [resolvedTheme, colorScheme]);

  const setTheme = (newTheme: Theme) => {
    setThemeState(newTheme);
    localStorage.setItem("safee-theme", newTheme);

    // Update system theme if switching to auto mode
    if (newTheme === "auto") {
      setSystemTheme(getSystemTheme());
    }

    // Apply to DOM immediately - don't wait for useEffect
    const resolved = newTheme === "auto" ? getSystemTheme() : newTheme;
    const root = document.documentElement;
    root.classList.remove("light", "dark");
    root.classList.add(resolved);
  };

  const setColorScheme = (newScheme: ColorScheme) => {
    setColorSchemeState(newScheme);
    localStorage.setItem("safee-color-scheme", newScheme);
  };

  return (
    <ThemeContext.Provider
      value={{
        theme,
        resolvedTheme,
        colorScheme,
        setTheme,
        setColorScheme,
      }}
    >
      {children}
    </ThemeContext.Provider>
  );
}

export function useTheme() {
  const context = useContext(ThemeContext);
  if (!context) {
    throw new Error("useTheme must be used within ThemeProvider");
  }
  return context;
}
