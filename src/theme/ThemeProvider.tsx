// src/theme/ThemeProvider.tsx

import React, {
  createContext,
  useContext,
  useMemo,
  useState,
  useCallback,
} from "react";
import { ScrollView, View } from "react-native";

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

interface ThemeProviderProps {
  initialMode?: ThemeMode;
  children: React.ReactNode;
  withScroll?: boolean;
  themeOverrides?: Partial<Theme>;
}

export function ThemeProvider({
  initialMode = "light",
  children,
  withScroll = true,
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

  const ContentWrapper = withScroll ? ScrollView : View;

  return (
    <ThemeContext.Provider
      value={{ theme, mode, toggleTheme, setMode, ready: true }}
    >
      <ContentWrapper
        style={[
          {
            flex: 1,
            backgroundColor: theme.colors.background,
          },
          theme.globalStyles?.app,
          theme.globalStyles?.content,
        ]}
        contentContainerStyle={
          withScroll
            ? [{ flexGrow: 1 }, theme.globalStyles?.scrollContent]
            : undefined
        }
        showsVerticalScrollIndicator={false}
      >
        {children}
      </ContentWrapper>
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
