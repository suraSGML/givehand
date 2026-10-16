"use client";

import * as React from "react";

// Filter out React 19 false-positive script warning in development if present
if (typeof window !== "undefined" && process.env.NODE_ENV === "development") {
  const originalError = console.error;
  console.error = (...args: unknown[]) => {
    if (typeof args[0] === "string" && args[0].includes("Encountered a script tag")) {
      return;
    }
    originalError.apply(console, args);
  };
}

const useIsomorphicLayoutEffect =
  typeof window !== "undefined" ? React.useLayoutEffect : React.useEffect;

interface ThemeContextType {
  theme: string;
  setTheme: (theme: string) => void;
  resolvedTheme: string;
}

const ThemeContext = React.createContext<ThemeContextType>({
  theme: "light",
  setTheme: () => {},
  resolvedTheme: "light",
});

export function ThemeProvider({
  children,
  defaultTheme = "light",
  attribute = "class",
  enableSystem = true,
}: {
  children: React.ReactNode;
  defaultTheme?: string;
  attribute?: string;
  enableSystem?: boolean;
  disableTransitionOnChange?: boolean;
  [key: string]: unknown;
}) {
  const [theme, setThemeState] = React.useState<string>(defaultTheme);

  // Read saved theme from localStorage on client mount
  useIsomorphicLayoutEffect(() => {
    try {
      const saved = localStorage.getItem("theme");
      if (saved === "dark" || saved === "light") {
        setThemeState(saved);
      }
    } catch {}
  }, []);

  const resolvedTheme =
    theme === "system"
      ? typeof window !== "undefined" &&
        window.matchMedia("(prefers-color-scheme: dark)").matches
        ? "dark"
        : "light"
      : theme;

  // Sync <html> class before paint using useIsomorphicLayoutEffect
  useIsomorphicLayoutEffect(() => {
    const root = document.documentElement;
    const effective =
      theme === "system"
        ? window.matchMedia("(prefers-color-scheme: dark)").matches
          ? "dark"
          : "light"
        : theme;

    root.classList.remove("light", "dark");
    if (attribute === "class") {
      root.classList.add(effective);
    } else {
      root.setAttribute(attribute, effective);
    }
  }, [theme, attribute]);

  const setTheme = React.useCallback(
    (newTheme: string) => {
      try {
        localStorage.setItem("theme", newTheme);
      } catch {}
      setThemeState(newTheme);
    },
    []
  );

  return (
    <ThemeContext.Provider value={{ theme, setTheme, resolvedTheme }}>
      {children}
    </ThemeContext.Provider>
  );
}

export function useTheme() {
  return React.useContext(ThemeContext);
}
