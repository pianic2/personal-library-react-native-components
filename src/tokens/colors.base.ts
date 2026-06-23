// src/tokens/colors.base.ts

export const lightColors = {
  primary: "#5B7CFF",
  primaryHover: "#4A6BEE",
  primaryActive: "#3A5ADD",

  secondary: "#FF9F43",
  secondaryHover: "#F08E32",
  secondaryActive: "#E07E22",

  accent: "#22C55E",

  success: "#16A34A",
  warning: "#F59E0B",
  error: "#DC2626",
  info: "#2563EB",

  background: "#FFFFFF",
  surface: "#F4F4F4",
  surfaceElevated: "#FFFFFF",

  textPrimary: "#020408ff",
  textSecondary: "#475569",
  textMuted: "#94A3B8",
  textInverted: "#FFFFFF",

  border: "#E2E8F0",
  divider: "#CBD5E1",
  outline: "#94A3B8",

  disabled: "#CBD5E1",
  disabledBg: "#F1F5F9",

  overlay: "rgba(15, 23, 42, 0.6)",
  backdrop: "rgba(0, 0, 0, 0.4)",

  codeBorder: "#E2E8F0",
  codeBg: "#F1F5F9",
  codeText: "#0F172A",
} as const;

export const darkColors = {
  primary: "#8DA2FF",
  primaryHover: "#7B92FF",
  primaryActive: "#6A82FF",

  secondary: "#FFB86B",
  secondaryHover: "#FCA84E",
  secondaryActive: "#F39838",

  accent: "#4ADE80",

  success: "#22C55E",
  warning: "#FBBF24",
  error: "#F87171",
  info: "#60A5FA",

  background: "#020617",
  surface: "#020617",
  surfaceElevated: "#020617",

  textPrimary: "#F8FAFC",
  textSecondary: "#CBD5E1",
  textMuted: "#94A3B8",
  textInverted: "#020617",

  border: "#1E293B",
  divider: "#334155",
  outline: "#475569",

  disabled: "#334155",
  disabledBg: "#020617",

  overlay: "rgba(2, 6, 23, 0.7)",
  backdrop: "rgba(0, 0, 0, 0.6)",

  codeBorder: "#475569",
  codeBg: "#0F172A",
  codeText: "#F8FAFC",
} as const;

export type ColorScheme = "light" | "dark";

export function resolveColors(mode: ColorScheme) {
  return mode === "dark" ? darkColors : lightColors;
}

export type Colors = typeof lightColors;
