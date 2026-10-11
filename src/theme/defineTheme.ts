// src/theme/defineTheme.ts

import { mergeThemes, type DeepPartial } from "./createTheme.js";
import { createBaseTheme } from "./defaultTheme.js";
import type { Theme } from "./types.js";

/** A theme for each colour mode, produced by {@link defineTheme}. */
export interface ThemePreset {
  readonly light: Theme;
  readonly dark: Theme;
}

export interface DefineThemeInput {
  /**
   * What the preset builds on. A `ThemePreset` supplies each mode from its own mode; a single `Theme` is the starting
   * point of both modes. Defaults to the library base theme of each mode.
   */
  extends?: ThemePreset | Theme;
  /** Overrides applied to the light theme only. */
  light?: DeepPartial<Theme>;
  /** Overrides applied to the dark theme only. */
  dark?: DeepPartial<Theme>;
}

function isThemePreset(value: ThemePreset | Theme): value is ThemePreset {
  const candidate = value as unknown as Record<string, unknown>;
  return "light" in candidate && "dark" in candidate && !("colors" in candidate);
}

/**
 * Composes a theme for each colour mode: `extends` (or the base theme), then the `light` / `dark` overrides of that mode.
 * An override of one mode never touches the other. Layers are merged with the strict rules of `mergeThemes`.
 */
export function defineTheme({ extends: parent, light, dark }: DefineThemeInput = {}): ThemePreset {
  const lightBase = parent === undefined ? createBaseTheme("light") : isThemePreset(parent) ? parent.light : parent;
  const darkBase = parent === undefined ? createBaseTheme("dark") : isThemePreset(parent) ? parent.dark : parent;
  return {
    light: mergeThemes(lightBase, light),
    dark: mergeThemes(darkBase, dark),
  };
}
