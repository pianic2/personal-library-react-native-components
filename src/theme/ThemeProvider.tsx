// src/theme/ThemeProvider.tsx

import React, {
  createContext,
  useContext,
  useMemo,
  useState,
  useCallback,
  useEffect,
} from "react";

import { createBaseTheme } from "./defaultTheme";
import { createTheme } from "./createTheme";
import type { Theme, ThemeMode, ThemeStorageAdapter } from "./types";

const DEFAULT_THEME_STORAGE_KEY = "personal-library.theme";

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
  storage?: ThemeStorageAdapter;
  storageKey?: string;
  persistTheme?: boolean;
}

function isThemeMode(value: string | null): value is ThemeMode {
  return value === "light" || value === "dark";
}

export function ThemeProvider({
  initialMode = "light",
  children,
  themeOverrides,
  storage,
  storageKey = DEFAULT_THEME_STORAGE_KEY,
  persistTheme = false,
}: ThemeProviderProps) {
  const [mode, setModeState] = useState<ThemeMode>(initialMode);
  const canPersist = persistTheme && storage;

  useEffect(() => {
    if (!canPersist) {
      return;
    }

    let active = true;

    storage
      .getItem(storageKey)
      .then((storedMode) => {
        if (active && isThemeMode(storedMode)) {
          setModeState(storedMode);
        }
      })
      .catch(() => undefined);

    return () => {
      active = false;
    };
  }, [canPersist, storage, storageKey]);

  const setMode = useCallback((m: ThemeMode) => {
    setModeState(m);

    if (canPersist) {
      void storage.setItem(storageKey, m).catch(() => undefined);
    }
  }, [canPersist, storage, storageKey]);

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
