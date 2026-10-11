// src/tokens/textStyles.base.ts

import { fontFamily, fontFamilySlots, fontSize, fontWeight, lineHeight, type FontFamilySlot } from "./typography.base.js";

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

// --- Text roles (PLRNUI-160) ---------------------------------------------------------------------------------------
// A role fixes everything a piece of text needs: size, absolute line height, weight, letter spacing, a font family slot
// and the largest factor the OS font scaling may apply. `textStyles` above is unchanged and remains what the theme uses.

export type TextRoleName = "display" | "headline" | "title" | "body" | "bodySmall" | "label" | "caption" | "code" | "price";

export interface TextRole {
  fontSize: number;
  /** Absolute line height in density-independent pixels (never smaller than `fontSize`). */
  lineHeight: number;
  fontWeight: (typeof fontWeight)[keyof typeof fontWeight];
  letterSpacing: number;
  fontFamilySlot: FontFamilySlot;
  /** Upper bound of the OS font scale factor; pass it as `maxFontSizeMultiplier` on the Text. */
  maxFontSizeMultiplier: number;
}

const px = (size: number, ratio: number): number => Math.round(size * ratio);

/** Font scale ceilings: display and controls stay compact, reading text may grow further. */
const MAX_SCALE = { display: 1.2, control: 1.3, reading: 2 } as const;

// The pure-annotated IIFE lets bundlers drop the table when nothing imports it (its member accesses would otherwise be kept).
export const textRoles: Record<TextRoleName, TextRole> = /* @__PURE__ */ (() => ({
  display: { fontSize: fontSize.xxxl, lineHeight: px(fontSize.xxxl, lineHeight.tight), fontWeight: fontWeight.bold, letterSpacing: -0.5, fontFamilySlot: "display", maxFontSizeMultiplier: MAX_SCALE.display },
  headline: { fontSize: fontSize.xxl, lineHeight: px(fontSize.xxl, lineHeight.tight), fontWeight: fontWeight.bold, letterSpacing: -0.25, fontFamilySlot: "display", maxFontSizeMultiplier: MAX_SCALE.display },
  title: { fontSize: fontSize.xl, lineHeight: px(fontSize.xl, lineHeight.normal), fontWeight: fontWeight.semibold, letterSpacing: 0, fontFamilySlot: "display", maxFontSizeMultiplier: MAX_SCALE.control },
  body: { fontSize: fontSize.md, lineHeight: px(fontSize.md, lineHeight.relaxed), fontWeight: fontWeight.regular, letterSpacing: 0, fontFamilySlot: "body", maxFontSizeMultiplier: MAX_SCALE.reading },
  bodySmall: { fontSize: fontSize.sm, lineHeight: px(fontSize.sm, lineHeight.relaxed), fontWeight: fontWeight.regular, letterSpacing: 0, fontFamilySlot: "body", maxFontSizeMultiplier: MAX_SCALE.reading },
  label: { fontSize: fontSize.sm, lineHeight: px(fontSize.sm, lineHeight.normal), fontWeight: fontWeight.medium, letterSpacing: 0.25, fontFamilySlot: "body", maxFontSizeMultiplier: MAX_SCALE.control },
  caption: { fontSize: fontSize.xs, lineHeight: px(fontSize.xs, lineHeight.relaxed), fontWeight: fontWeight.regular, letterSpacing: 0.25, fontFamilySlot: "body", maxFontSizeMultiplier: MAX_SCALE.reading },
  code: { fontSize: fontSize.md, lineHeight: px(fontSize.md, lineHeight.relaxed), fontWeight: fontWeight.regular, letterSpacing: 0, fontFamilySlot: "mono", maxFontSizeMultiplier: MAX_SCALE.reading },
  price: { fontSize: fontSize.lg, lineHeight: px(fontSize.lg, lineHeight.normal), fontWeight: fontWeight.bold, letterSpacing: 0, fontFamilySlot: "body", maxFontSizeMultiplier: MAX_SCALE.control },
}))();

/** What `resolveTextStyle` needs from a theme: optional font family overrides (set after loading custom fonts). */
export interface TextRoleTheme {
  fontFamilies?: Partial<Record<FontFamilySlot, string>>;
}

export interface ResolvedTextStyle {
  style: { fontFamily: string; fontSize: number; lineHeight: number; fontWeight: TextRole["fontWeight"]; letterSpacing: number };
  /** Spread on the Text next to `style`. */
  allowFontScaling: true;
  maxFontSizeMultiplier: number;
}

/** Resolves a role to a React Native text style plus the font scaling props. Unknown roles throw a RangeError. */
export function resolveTextStyle(theme: TextRoleTheme | undefined, role: TextRoleName): ResolvedTextStyle {
  if (!Object.hasOwn(textRoles, role)) throw new RangeError(`resolveTextStyle: unknown text role "${String(role)}"`);
  const r = textRoles[role];
  const family = theme?.fontFamilies?.[r.fontFamilySlot] ?? fontFamilySlots[r.fontFamilySlot];
  return {
    style: { fontFamily: family, fontSize: r.fontSize, lineHeight: r.lineHeight, fontWeight: r.fontWeight, letterSpacing: r.letterSpacing },
    allowFontScaling: true,
    maxFontSizeMultiplier: r.maxFontSizeMultiplier,
  };
}
