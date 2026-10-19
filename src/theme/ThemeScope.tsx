// src/theme/ThemeScope.tsx
//
// The theme context and the nested scope. The context lives here (not in ThemeProvider.tsx) so the scope can provide it
// without widening what `ThemeProvider.tsx` exports to the package root.
import React, { useContext, useMemo } from "react";
import { createSingletonContext } from "../providers/createSingletonContext.js";
import { density as densityTokens } from "../tokens/density.base.js";
import type { DensityLevel, ThemePreference } from "./contract.js";
import { mergeThemes, type DeepPartial } from "./createTheme.js";
import { createBaseTheme } from "./defaultTheme.js";
import type { ThemePreset as ThemePresetPair } from "./defineTheme.js";
import type { Theme, ThemeMode } from "./types.js";

/** What turns a mode into a theme: the preset, the override layers (outermost first) and the density. */
export interface ThemeConfig {
  readonly preset: ThemePresetPair | undefined;
  readonly overrides: ReadonlyArray<DeepPartial<Theme> | undefined>;
  readonly density: DensityLevel | undefined;
}

export interface ThemeContextValue {
  theme: Theme;
  /** The resolved mode: `system` is already replaced by the OS scheme. */
  mode: ThemeMode;
  /** What the app asked for: `light`, `dark` or `system`. */
  preference: ThemePreference;
  /** False until the persisted preference has been read (always true without persistence). */
  ready: boolean;
  toggleTheme: () => void;
  setMode: (mode: ThemeMode) => void;
  setPreference: (preference: ThemePreference) => void;
  /** The OS colour scheme (`light` when unknown). */
  systemScheme: ThemeMode;
  config: ThemeConfig;
}

export const ThemeContext = createSingletonContext<ThemeContextValue | null>("theme", null);

export function isDensityLevel(value: unknown): value is DensityLevel {
  return typeof value === "string" && Object.hasOwn(densityTokens.scale, value);
}

function isPresetPair(value: unknown): value is ThemePresetPair {
  const candidate = value as { light?: unknown; dark?: unknown } | null | undefined;
  return typeof candidate === "object" && candidate !== null && typeof candidate.light === "object" && typeof candidate.dark === "object";
}

export function resolveMode(preference: ThemePreference, systemScheme: ThemeMode): ThemeMode {
  return preference === "system" ? systemScheme : preference;
}

/** Builds the theme of `mode`: the preset (or the base theme), then the override layers, then the density. */
export function buildTheme(mode: ThemeMode, config: ThemeConfig): Theme {
  const base = isPresetPair(config.preset) ? config.preset[mode] : createBaseTheme(mode);
  const merged = mergeThemes(base, ...config.overrides);
  if (config.density === undefined || !isDensityLevel(config.density)) return merged;
  return { ...merged, density: { ...merged.density, default: config.density } };
}

export interface ThemeScopeProps {
  /** Mode of the scope. Default: the one of the enclosing theme. `system` follows the OS. */
  preference?: ThemePreference;
  /** Preset of the scope (from `defineTheme`). Default: the enclosing preset. */
  preset?: ThemePresetPair;
  /** Density of the scope. Default: the enclosing density. */
  density?: DensityLevel;
  /** Overrides applied on top of the enclosing overrides. */
  themeOverrides?: DeepPartial<Theme>;
  children?: React.ReactNode;
}

/**
 * Overrides the theme for the sub-tree only. Everything not given is inherited from the enclosing `ThemeProvider` or
 * `ThemeScope`. `setMode`, `toggleTheme` and `setPreference` called inside a scope act on the enclosing provider (the
 * scope itself stays pinned to the props it was given).
 */
export function ThemeScope({ preference, preset, density, themeOverrides, children }: ThemeScopeProps) {
  const parent = useContext(ThemeContext);
  if (!parent) throw new Error("ThemeScope must be used inside ThemeProvider");

  const inherits = preference === undefined && preset === undefined && density === undefined && themeOverrides === undefined;
  const value = useMemo<ThemeContextValue>(() => {
    if (inherits) return parent;
    const config: ThemeConfig = {
      preset: preset ?? parent.config.preset,
      overrides: themeOverrides === undefined ? parent.config.overrides : [...parent.config.overrides, themeOverrides],
      density: density ?? parent.config.density,
    };
    const nextPreference = preference ?? parent.preference;
    const mode = preference === undefined ? parent.mode : resolveMode(preference, parent.systemScheme);
    return { ...parent, theme: buildTheme(mode, config), mode, preference: nextPreference, config };
  }, [inherits, parent, preference, preset, density, themeOverrides]);

  return <ThemeContext.Provider value={value}>{children}</ThemeContext.Provider>;
}
