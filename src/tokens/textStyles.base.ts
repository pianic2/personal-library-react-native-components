// src/tokens/textStyles.base.ts

import { fontFamily, fontSize, fontWeight } from "./typography.base.js";

export const textStyles = {
  display: {
    fontFamily: fontFamily.regular,
    fontSize: fontSize.xxxl,
    fontWeight: fontWeight.bold,
  },
  title: {
    fontFamily: fontFamily.regular,
    fontSize: fontSize.xxl,
    fontWeight: fontWeight.bold,
  },
  heading: {
    fontFamily: fontFamily.regular,
    fontSize: fontSize.xl,
    fontWeight: fontWeight.semibold,
  },
  body: {
    fontFamily: fontFamily.regular,
    fontSize: fontSize.md,
    fontWeight: fontWeight.regular,
  },
  label: {
    fontFamily: fontFamily.regular,
    fontSize: fontSize.sm,
    fontWeight: fontWeight.medium,
  },
  caption: {
    fontFamily: fontFamily.regular,
    fontSize: fontSize.xs,
    fontWeight: fontWeight.regular,
  },
  code: {
    fontFamily: fontFamily.mono,
    fontSize: fontSize.md,
    fontWeight: fontWeight.regular,
  },
} as const;

export type TextStyleName = keyof typeof textStyles;
