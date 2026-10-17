// src/tokens/semantic.base.ts
// Semantic roles derived from the resolved color palette (no raw values).

import type { Colors, ColorScheme } from "./colors.base.js";
import { palette } from "./palette.js";

export function createSemantic(colors: Colors) {
  return {
    surface: {
      base: colors.background,
      raised: colors.surfaceElevated,
      sunken: colors.surface,
      overlay: colors.overlay,
    },
    text: {
      primary: colors.textPrimary,
      secondary: colors.textSecondary,
      muted: colors.textMuted,
      inverted: colors.textInverted,
      disabled: colors.disabled,
    },
    border: {
      default: colors.border,
      divider: colors.divider,
      focus: colors.outline,
    },
    action: {
      primary: colors.primary,
      primaryHover: colors.primaryHover,
      primaryActive: colors.primaryActive,
      disabled: colors.disabledBg,
    },
    feedback: {
      success: colors.success,
      warning: colors.warning,
      error: colors.error,
      info: colors.info,
    },
  } as const;
}

export type SemanticTokens = ReturnType<typeof createSemantic>;

// --- Semantic roles per mode (PLRNUI-152) --------------------------------------------------------------------------
// The roles are the single place that picks palette steps. `colors.base.ts` derives the legacy `theme.colors` from them.
// Every `on*` role is the palette's darkest or lightest step, whichever reads better on its pair (>= 4.5:1, tested).

/** Opacity of the interaction state layers drawn over a surface or a filled container. */
export const stateLayer = {
  hover: 0.08,
  pressed: 0.12,
  focus: 0.12,
  selected: 0.16,
  dragged: 0.16,
} as const;

const { neutral, brand, secondary, error } = palette;

const WHITE = "#FFFFFF";

export interface ColorPair {
  readonly main: string;
  readonly on: string;
  readonly container: string;
  readonly onContainer: string;
}

export interface SemanticRoles {
  /** Surface tiers, 0 the page background and 3 the highest layer. */
  readonly surface: { readonly 0: string; readonly 1: string; readonly 2: string; readonly 3: string };
  readonly onSurface: string;
  readonly onSurfaceMuted: string;
  readonly primary: ColorPair;
  readonly secondary: ColorPair;
  readonly error: ColorPair;
  readonly outline: string;
  readonly outlineVariant: string;
  readonly focusRing: string;
  readonly scrim: string;
  readonly stateLayer: typeof stateLayer;
}

const lightRoles: SemanticRoles = {
  surface: { 0: WHITE, 1: "#F4F4F4", 2: neutral[100], 3: neutral[200] },
  onSurface: "#020408",
  onSurfaceMuted: neutral[600],
  primary: { main: brand[500], on: neutral[950], container: brand[100], onContainer: neutral[900] },
  secondary: { main: secondary[500], on: neutral[950], container: secondary[100], onContainer: neutral[900] },
  error: { main: error[600], on: WHITE, container: error[100], onContainer: neutral[900] },
  outline: neutral[500],
  outlineVariant: neutral[200],
  focusRing: brand[600],
  scrim: "rgba(15, 23, 42, 0.6)",
  stateLayer,
};

const darkRoles: SemanticRoles = {
  surface: { 0: neutral[950], 1: "#0B1220", 2: neutral[900], 3: neutral[800] },
  onSurface: neutral[50],
  onSurfaceMuted: neutral[300],
  primary: { main: brand[300], on: neutral[950], container: brand[950], onContainer: brand[100] },
  secondary: { main: secondary[300], on: neutral[950], container: secondary[950], onContainer: secondary[100] },
  error: { main: error[400], on: neutral[950], container: error[950], onContainer: error[100] },
  outline: neutral[500],
  outlineVariant: neutral[800],
  focusRing: brand[300],
  scrim: "rgba(2, 6, 23, 0.7)",
  stateLayer,
};

/** The semantic roles of a colour scheme. */
export function createSemanticRoles(mode: ColorScheme): SemanticRoles {
  return mode === "dark" ? darkRoles : lightRoles;
}
