// src/theme/ThemeProvider.tsx

import React, {
  createContext,
  useContext,
  useMemo,
  useState,
  useCallback,
} from "react";

import { createBaseTheme } from "./defaultTheme";
import { createTheme } from "./createTheme";
import type { Theme, ThemeMode } from "./types";

interface ThemeContextValue {
  theme: Theme;
  mode: ThemeMode;
  toggleTheme: () => void;
  setMode: (mode: ThemeMode) => void;
  ready: boolean;
}

const ThemeContext = createContext<ThemeContextValue | null>(null);

export interface ThemeProviderProps {
  initialMode?: ThemeMode;
  children: React.ReactNode;
  themeOverrides?: Partial<Theme>;
}

export function ThemeProvider({
  initialMode = "light",
  children,
  themeOverrides,
}: ThemeProviderProps) {
  const [mode, setModeState] = useState<ThemeMode>(initialMode);

  const setMode = useCallback((m: ThemeMode) => {
    setModeState(m);
  }, []);

  const toggleTheme = useCallback(() => {
    setMode(mode === "light" ? "dark" : "light");
  }, [mode, setMode]);

  const theme = useMemo(
    () => createTheme(themeOverrides, createBaseTheme(mode)),
    [mode, themeOverrides]
  );

  return (
    <ThemeContext.Provider
      value={{ theme, mode, toggleTheme, setMode, ready: true }}
    >
      {children}
    </ThemeContext.Provider>
  );
}

export function useThemeContext() {
  const ctx = useContext(ThemeContext);
  if (!ctx) {
    throw new Error("useThemeContext must be used inside ThemeProvider");
  }
  return ctx;
}
