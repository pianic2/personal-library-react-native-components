// src/tokens/typography.base.ts

export const fontFamily = {
  regular: "System",
  mono: "monospace",
} as const;

/**
 * Font family slots, each a fallback stack. They are the names a consumer overrides after loading its fonts
 * (`resolveTextStyle` accepts overrides); the stacks work without any loaded font.
 */
export const fontFamilySlots = {
  display: "System",
  body: "System",
  mono: "monospace",
} as const;

export type FontFamilySlot = keyof typeof fontFamilySlots;

export const fontSize = {
  xs: 11,
  sm: 12,
  md: 14,
  lg: 16,
  xl: 20,
  xxl: 28,
  xxxl: 42,
} as const;

export const lineHeight = {
  tight: 1.1,
  normal: 1.3,
  relaxed: 1.5,
} as const;

export const fontWeight = {
  regular: "400",
  medium: "500",
  semibold: "600",
  bold: "700",
} as const;

export const typography = {
  fontFamily,
  fontSize,
  lineHeight,
  fontWeight,
} as const;
