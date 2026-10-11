// src/theme/useTheme.ts

import { useThemeContext } from "./ThemeProvider.js";

export function useTheme() {
  const { theme, mode, preference, ready, toggleTheme, setMode, setPreference } = useThemeContext();

  return {
    theme,
    colors: theme.colors,
    /** The resolved mode (`light` or `dark`). */
    mode,
    /** What the app asked for: `light`, `dark` or `system`. */
    preference,
    /** False until the persisted preference has been read. */
    ready,
    toggleTheme,
    setMode,
    setPreference,
  };
}
