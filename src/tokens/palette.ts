// src/tokens/palette.ts
//
// Primitive colour ramps, steps 50 to 950. Raw values live here only: components and themes read the semantic roles
// (semantic.base.ts), which pick steps from these ramps.

export type RampStep = 50 | 100 | 200 | 300 | 400 | 500 | 600 | 700 | 800 | 900 | 950;
export type Ramp = Readonly<Record<RampStep, string>>;

const neutral: Ramp = {
  50: "#F8FAFC",
  100: "#F1F5F9",
  200: "#E2E8F0",
  300: "#CBD5E1",
  400: "#94A3B8",
  500: "#64748B",
  600: "#475569",
  700: "#334155",
  800: "#1E293B",
  900: "#0F172A",
  950: "#020617",
};

const brand: Ramp = {
  50: "#EEF1FF",
  100: "#D9E0FF",
  200: "#B4C2FF",
  300: "#8DA2FF",
  400: "#7B92FF",
  500: "#5B7CFF",
  600: "#4A6BEE",
  700: "#3A5ADD",
  800: "#2B47B8",
  900: "#1F3490",
  950: "#141F5C",
};

const secondary: Ramp = {
  50: "#FFF6EC",
  100: "#FFE9D0",
  200: "#FFD3A3",
  300: "#FFB86B",
  400: "#FCA84E",
  500: "#FF9F43",
  600: "#F08E32",
  700: "#E07E22",
  800: "#B2610F",
  900: "#7A420A",
  950: "#442305",
};

const success: Ramp = {
  50: "#F0FDF4",
  100: "#DCFCE7",
  200: "#BBF7D0",
  300: "#86EFAC",
  400: "#4ADE80",
  500: "#22C55E",
  600: "#16A34A",
  700: "#15803D",
  800: "#166534",
  900: "#14532D",
  950: "#052E16",
};

const warning: Ramp = {
  50: "#FFFBEB",
  100: "#FEF3C7",
  200: "#FDE68A",
  300: "#FCD34D",
  400: "#FBBF24",
  500: "#F59E0B",
  600: "#D97706",
  700: "#B45309",
  800: "#92400E",
  900: "#78350F",
  950: "#451A03",
};

const error: Ramp = {
  50: "#FEF2F2",
  100: "#FEE2E2",
  200: "#FECACA",
  300: "#FCA5A5",
  400: "#F87171",
  500: "#EF4444",
  600: "#DC2626",
  700: "#B91C1C",
  800: "#991B1B",
  900: "#7F1D1D",
  950: "#450A0A",
};

const info: Ramp = {
  50: "#EFF6FF",
  100: "#DBEAFE",
  200: "#BFDBFE",
  300: "#93C5FD",
  400: "#60A5FA",
  500: "#3B82F6",
  600: "#2563EB",
  700: "#1D4ED8",
  800: "#1E40AF",
  900: "#1E3A8A",
  950: "#172554",
};

export const palette = { neutral, brand, secondary, success, warning, error, info } as const;

export type PaletteName = keyof typeof palette;
