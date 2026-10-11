// src/tokens/radius.ts

export const radius = {
  none: 0,
  xs: 4,
  sm: 6,
  md: 10,
  lg: 16,
  xl: 24,
  full: 9999,
  /** Alias of `full`: a fully rounded (pill) shape. */
  pill: 9999,
} as const;

export type Radius = keyof typeof radius;
