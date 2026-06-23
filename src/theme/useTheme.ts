// src/theme/useTheme.ts

import { useThemeContext } from "./ThemeProvider";

export function useTheme() {
  const { theme, mode, toggleTheme, setMode } = useThemeContext();

  return {
    theme,
    colors: theme.colors,
    mode,
    toggleTheme,
    setMode,
  };
}
