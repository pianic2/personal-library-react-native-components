// src/tokens/colors.base.ts

import { palette } from "./palette.js";
import { createSemanticRoles } from "./semantic.base.js";

// The legacy colour keys, derived from the semantic roles (semantic.base.ts) and the palette ramps (palette.ts). Every key
// of the previous literal objects is kept and, except for the dark surfaces below, so is every value.
const { neutral, brand, secondary, success, warning, info } = palette;
const light = createSemanticRoles("light");
const dark = createSemanticRoles("dark");

export const lightColors = {
  primary: light.primary.main,
  primaryHover: brand[600],
  primaryActive: brand[700],

  secondary: light.secondary.main,
  secondaryHover: secondary[600],
  secondaryActive: secondary[700],

  accent: success[500],

  success: success[600],
  warning: warning[500],
  error: light.error.main,
  info: info[600],

  background: light.surface[0],
  surface: light.surface[1],
  surfaceElevated: light.surface[0],

  // Was the 8 digit "#020408ff"; the opaque 6 digit form is the same colour.
  textPrimary: light.onSurface,
  textSecondary: light.onSurfaceMuted,
  textMuted: neutral[400],
  textInverted: "#FFFFFF",

  border: neutral[200],
  divider: neutral[300],
  outline: light.outline,

  disabled: neutral[300],
  disabledBg: neutral[100],

  overlay: light.scrim,
  backdrop: "rgba(0, 0, 0, 0.4)",

  codeBorder: neutral[200],
  codeBg: neutral[100],
  codeText: neutral[900],
} as const;

// Dark: background, surface and surfaceElevated used to be the same colour (#020617); they now step up through the
// surface tiers 0, 1 and 2 so raised content can be told apart from the page.
export const darkColors = {
  primary: dark.primary.main,
  primaryHover: brand[400],
  primaryActive: "#6A82FF",

  secondary: dark.secondary.main,
  secondaryHover: secondary[400],
  secondaryActive: "#F39838",

  accent: success[400],

  success: success[500],
  warning: warning[400],
  error: dark.error.main,
  info: info[400],

  background: dark.surface[0],
  surface: dark.surface[1],
  surfaceElevated: dark.surface[2],

  textPrimary: dark.onSurface,
  textSecondary: dark.onSurfaceMuted,
  textMuted: neutral[400],
  textInverted: neutral[950],

  border: neutral[800],
  divider: neutral[700],
  outline: dark.outline,

  disabled: neutral[700],
  disabledBg: neutral[950],

  overlay: dark.scrim,
  backdrop: "rgba(0, 0, 0, 0.6)",

  codeBorder: neutral[600],
  codeBg: neutral[900],
  codeText: neutral[50],
} as const;

export type ColorScheme = "light" | "dark";

export function resolveColors(mode: ColorScheme) {
  return mode === "dark" ? darkColors : lightColors;
}

export type Colors = {
  readonly [Key in keyof typeof lightColors]: string;
};
