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
  const [resolvedTheme, setResolvedTheme] = useState<"light" | "dark">(() => {
    const stored = getStoredTheme();
    return stored === "auto" ? getSystemTheme() : stored;
  });

  // Apply theme immediately on mount (before first render completes)
  useEffect(() => {
    const root = document.documentElement;
    root.classList.remove("light", "dark");
    root.classList.add(resolvedTheme);
  }, [resolvedTheme]);

  // Update resolvedTheme when theme changes AND apply to document
  useEffect(() => {
    const resolved = theme === "auto" ? getSystemTheme() : theme;
    setResolvedTheme(resolved);

    // Apply theme to document immediately
    const root = document.documentElement;
    root.classList.remove("light", "dark");
    root.classList.add(resolved);

    // Apply color scheme as CSS variable
    root.style.setProperty("--color-primary", `var(--color-${colorScheme})`);
  }, [theme, colorScheme]);

  // Listen to system theme changes when in auto mode
  useEffect(() => {
    if (theme !== "auto") return;

    const mediaQuery = window.matchMedia("(prefers-color-scheme: dark)");
    const handleChange = (e: MediaQueryListEvent) => {
      const newResolved = e.matches ? "dark" : "light";
      setResolvedTheme(newResolved);

      // Apply to document immediately
      const root = document.documentElement;
      root.classList.remove("light", "dark");
      root.classList.add(newResolved);
    };

    mediaQuery.addEventListener("change", handleChange);
    return () => mediaQuery.removeEventListener("change", handleChange);
  }, [theme]);

  const setTheme = (newTheme: Theme) => {
    setThemeState(newTheme);
    localStorage.setItem("safee-theme", newTheme);

    // Update resolved theme immediately
    const resolved = newTheme === "auto" ? getSystemTheme() : newTheme;
    setResolvedTheme(resolved);

    // CRITICAL: Apply to DOM immediately - don't wait for useEffect
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
