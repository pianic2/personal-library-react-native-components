// src/tokens/border.base.ts

/** Border widths in density-independent pixels. `hairline` is the thinnest visible line on a density 2 screen. */
export const borderWidth = {
  none: 0,
  hairline: 0.5,
  thin: 1,
  medium: 2,
} as const;

/** Opacity of interactive and overlay states (0 to 1). */
export const opacity = {
  disabled: 0.5,
  pressed: 0.85,
  hover: 0.92,
  scrim: 0.5,
} as const;

export type BorderWidth = keyof typeof borderWidth;
export type OpacityToken = keyof typeof opacity;
