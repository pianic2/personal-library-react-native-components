// src/theme/ThemeProvider.tsx

import React, { useCallback, useEffect, useMemo, useRef, useState } from "react";
import * as ReactNative from "react-native";

import { registerSingletonContext } from "../providers/createSingletonContext.js";
import type { DensityLevel, ThemePreference } from "./contract.js";
import type { DeepPartial } from "./createTheme.js";
import type { ThemePreset as ThemePresetPair } from "./defineTheme.js";
import {
  buildTheme,
  isDensityLevel,
  resolveMode,
  ThemeContext,
  type ThemeConfig,
  type ThemeContextValue,
} from "./ThemeScope.js";
import type { Theme, ThemeMode, ThemeStorageAdapter } from "./types.js";

// Registered once per copy of the library; a second copy logs one development warning (D10).
registerSingletonContext("theme", ThemeContext);

const DEFAULT_THEME_STORAGE_KEY = "personal-library.theme";

export interface ThemeProviderProps {
  /** Initial mode (`light` by default). Kept for compatibility; `preference` wins when both are given. */
  initialMode?: ThemeMode;
  /** Initial preference: `light`, `dark`, or `system` to follow the OS (live). */
  preference?: ThemePreference;
  /** A preset made with `defineTheme`; each mode is built from its own side of the preset. */
  preset?: ThemePresetPair;
  /** Density level (written to `theme.density.default`). Read back from storage when this prop is not given. */
  density?: DensityLevel;
  children: React.ReactNode;
  themeOverrides?: DeepPartial<Theme>;
  storage?: ThemeStorageAdapter;
  storageKey?: string;
  persistTheme?: boolean;
  /** Replaces the OS colour scheme (`light` / `dark`); `null` means unknown. For previews and tests. Default: React Native's `useColorScheme`. */
  systemScheme?: ThemeMode | null;
}

// `useColorScheme` is read once: the shim of the unit tests and stripped builds do not have it, and a hook that is
// present or absent for the whole life of the process keeps the order of hooks stable.
const useNativeColorScheme: () => string | null | undefined =
  typeof (ReactNative as { useColorScheme?: unknown }).useColorScheme === "function"
    ? ((ReactNative as unknown as { useColorScheme: () => string | null | undefined }).useColorScheme)
    : () => null;

function isThemeMode(value: unknown): value is ThemeMode {
  return value === "light" || value === "dark";
}

function isPreference(value: unknown): value is ThemePreference {
  return isThemeMode(value) || value === "system";
}

interface StoredTheme {
  preference: ThemePreference;
  density: DensityLevel | undefined;
}

/** Reads a stored value: the JSON object, or the legacy plain `light` / `dark`. Anything else is ignored. */
function parseStored(raw: string | null): StoredTheme | null {
  if (isThemeMode(raw)) return { preference: raw, density: undefined };
  if (typeof raw !== "string") return null;
  try {
    const parsed = JSON.parse(raw) as { preference?: unknown; density?: unknown } | null;
    if (parsed === null || typeof parsed !== "object" || !isPreference(parsed.preference)) return null;
    return { preference: parsed.preference, density: isDensityLevel(parsed.density) ? parsed.density : undefined };
  } catch {
    return null;
  }
}

export function ThemeProvider({
  initialMode = "light",
  preference: preferenceProp,
  preset,
  density,
  children,
  themeOverrides,
  storage,
  storageKey = DEFAULT_THEME_STORAGE_KEY,
  persistTheme = false,
  systemScheme: schemeOverride,
}: ThemeProviderProps) {
  const [preference, setPreferenceState] = useState<ThemePreference>(isPreference(preferenceProp) ? preferenceProp : initialMode);
  const [storedDensity, setStoredDensity] = useState<DensityLevel | undefined>(undefined);
  const canPersist = persistTheme && storage;
  const [ready, setReady] = useState<boolean>(!canPersist);
  // A choice made before the stored value arrives wins over it.
  const touched = useRef(false);

  const native = useNativeColorScheme();
  const systemScheme: ThemeMode = isThemeMode(schemeOverride) ? schemeOverride : schemeOverride === null ? "light" : isThemeMode(native) ? native : "light";
  const mode = resolveMode(preference, systemScheme);
  const activeDensity = density ?? storedDensity;

  useEffect(() => {
    if (!canPersist) {
      setReady(true);
      return;
    }

    let active = true;
    setReady(false);

    storage
      .getItem(storageKey)
      .then((raw) => {
        if (!active) return;
        const stored = parseStored(raw);
        if (stored && !touched.current) {
          setPreferenceState(stored.preference);
          setStoredDensity(stored.density);
        }
      })
      .catch(() => undefined)
      .then(() => {
        if (active) setReady(true);
      });

    return () => {
      active = false;
    };
  }, [canPersist, storage, storageKey]);

  const config = useMemo<ThemeConfig>(
    () => ({ preset, overrides: [themeOverrides], density: activeDensity }),
    [preset, themeOverrides, activeDensity],
  );
  const theme = useMemo(() => buildTheme(mode, config), [mode, config]);

  const setPreference = useCallback(
    (next: ThemePreference) => {
      touched.current = true;
      setPreferenceState(next);

      if (canPersist) {
        const payload = JSON.stringify({ preference: next, presetId: theme.preset, density: activeDensity ?? theme.density.default });
        void storage.setItem(storageKey, payload).catch(() => undefined);
      }
    },
    [canPersist, storage, storageKey, theme.preset, theme.density.default, activeDensity],
  );

  const setMode = useCallback((m: ThemeMode) => setPreference(m), [setPreference]);
  const toggleTheme = useCallback(() => setPreference(mode === "light" ? "dark" : "light"), [mode, setPreference]);

  const value = useMemo<ThemeContextValue>(
    () => ({ theme, mode, preference, ready, toggleTheme, setMode, setPreference, systemScheme, config }),
    [theme, mode, preference, ready, toggleTheme, setMode, setPreference, systemScheme, config],
  );

  return <ThemeContext.Provider value={value}>{children}</ThemeContext.Provider>;
}

export function useThemeContext(): ThemeContextValue {
  const ctx = React.useContext(ThemeContext);
  if (!ctx) {
    throw new Error("useThemeContext must be used inside ThemeProvider");
  }
  return ctx;
}
