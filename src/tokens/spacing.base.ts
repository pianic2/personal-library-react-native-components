// src/tokens/spacing.base.ts

export const spacing = {
  0: 0,
  4: 4,
  8: 8,
  12: 12,
  20: 20,
  30: 30,
  80: 80,
} as const;

export type Spacing = keyof typeof spacing;

// Alias semantici (consigliati nei componenti)
export const space = {
  none: spacing[0],
  xs: spacing[4],
  sm: spacing[8],
  md: spacing[12],
  lg: spacing[20],
  xl: spacing[30],
  xxl: spacing[80],
} as const;
