// src/tokens/size.base.ts

export const height = {
  xs: 26,
  sm: 32,
  md: 40,
  lg: 48,
  xl: 56,
} as const;

/** Icon sizes in density-independent pixels. */
export const iconSize = {
  sm: 16,
  md: 20,
  lg: 24,
  xl: 32,
} as const;

export const size = {
  height,
  icon: iconSize,
} as const;