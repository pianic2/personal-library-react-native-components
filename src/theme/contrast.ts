// src/theme/contrast.ts
//
// WCAG 2.x contrast math (PLRNUI-278). Pure functions, no dependency. Used by scripts/validate-theme-contrast.mjs and
// available to presets and tests. Not exported from the package root yet: the wiring tickets own that.

/** Minimum ratio for normal text (WCAG AA). */
export const AA_TEXT = 4.5;
/** Minimum ratio for large text and for user interface components and graphical objects (WCAG AA). */
export const AA_NON_TEXT = 3;

export interface Rgba {
  /** 0 to 255 */
  r: number;
  g: number;
  b: number;
  /** 0 (transparent) to 1 (opaque) */
  a: number;
}

const HEX = /^#([0-9a-f]{3,4}|[0-9a-f]{6}|[0-9a-f]{8})$/i;
const NUMBER = "(?:\\d*\\.?\\d+%?)";
// rgb(r, g, b), rgba(r, g, b, a) (commas) or rgb(r g b), rgb(r g b / a) (spaces, a slash before the alpha). Nothing else.
const COMMA_FORM = new RegExp(`^rgba?\\(\\s*(${NUMBER})\\s*,\\s*(${NUMBER})\\s*,\\s*(${NUMBER})(?:\\s*,\\s*(${NUMBER}))?\\s*\\)$`, "i");
const SPACE_FORM = new RegExp(`^rgba?\\(\\s*(${NUMBER})\\s+(${NUMBER})\\s+(${NUMBER})(?:\\s*/\\s*(${NUMBER}))?\\s*\\)$`, "i");

function clamp(value: number, min: number, max: number): number {
  return Math.min(max, Math.max(min, value));
}

function channelValue(token: string): number | null {
  const percent = /^(\d*\.?\d+)%$/.exec(token);
  const n = percent ? (Number(percent[1]) / 100) * 255 : /^\d*\.?\d+$/.test(token) ? Number(token) : Number.NaN;
  return Number.isFinite(n) ? clamp(n, 0, 255) : null;
}

function alphaValue(token: string): number | null {
  const percent = /^(\d*\.?\d+)%$/.exec(token);
  const n = percent ? Number(percent[1]) / 100 : /^\d*\.?\d+$/.test(token) ? Number(token) : Number.NaN;
  return Number.isFinite(n) ? clamp(n, 0, 1) : null;
}

/**
 * Parses `#RGB`, `#RGBA`, `#RRGGBB`, `#RRGGBBAA`, `rgb(r, g, b)`, `rgba(r, g, b, a)` and the space form `rgb(r g b / a)`
 * (channels and alpha may be percentages). Returns `null` for anything else, including mixed or doubled separators.
 */
export function parseColor(input: string): Rgba | null {
  if (typeof input !== "string") return null;
  const text = input.trim();
  const hex = HEX.exec(text);
  if (hex) {
    let digits = hex[1]!;
    if (digits.length <= 4) digits = digits.replace(/./g, (c) => c + c);
    const value = (from: number) => parseInt(digits.slice(from, from + 2), 16);
    return { r: value(0), g: value(2), b: value(4), a: digits.length === 8 ? value(6) / 255 : 1 };
  }
  const fn = COMMA_FORM.exec(text) ?? SPACE_FORM.exec(text);
  if (fn) {
    const channels = [fn[1]!, fn[2]!, fn[3]!].map(channelValue);
    const alpha = fn[4] === undefined ? 1 : alphaValue(fn[4]);
    if (channels.some((c) => c === null) || alpha === null) return null;
    return { r: channels[0]!, g: channels[1]!, b: channels[2]!, a: alpha };
  }
  return null;
}

function mustParse(input: string, what: string): Rgba {
  const color = parseColor(input);
  if (!color) throw new TypeError(`contrast: cannot parse ${what} "${String(input)}" (expected #RGB, #RGBA, #RRGGBB, #RRGGBBAA, rgb() or rgba())`);
  return color;
}

/** `foreground` drawn over an opaque `background`, as an opaque colour. */
export function compositeOver(foreground: Rgba, background: Rgba): Rgba {
  const a = foreground.a;
  const mix = (f: number, b: number) => f * a + b * (1 - a);
  return { r: mix(foreground.r, background.r), g: mix(foreground.g, background.g), b: mix(foreground.b, background.b), a: 1 };
}

function linear(value: number): number {
  const c = value / 255;
  return c <= 0.03928 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4;
}

/** WCAG relative luminance (0 black to 1 white) of an opaque colour. A translucent colour is measured over white. */
export function relativeLuminance(color: string): number {
  const parsed = mustParse(color, "colour");
  const c = parsed.a < 1 ? compositeOver(parsed, { r: 255, g: 255, b: 255, a: 1 }) : parsed;
  return 0.2126 * linear(c.r) + 0.7152 * linear(c.g) + 0.0722 * linear(c.b);
}

/**
 * WCAG contrast ratio (1 to 21) of `foreground` on `background`. A translucent `background` is first composited over
 * `backdrop` (default white); a translucent `foreground` is composited over the resulting background. The composited
 * colour is rounded to whole 8-bit channels before its luminance is taken (as a screen shows it), which can move a borderline
 * pair by a few thousandths. Throws a
 * `TypeError` for a colour it cannot parse, so a gate built on it fails closed.
 */
export function contrastRatio(foreground: string, background: string, backdrop = "#FFFFFF"): number {
  const back = compositeOver(mustParse(background, "background"), mustParse(backdrop, "backdrop"));
  const front = compositeOver(mustParse(foreground, "foreground"), back);
  const toHex = (c: Rgba) => `#${[c.r, c.g, c.b].map((v) => Math.round(clamp(v, 0, 255)).toString(16).padStart(2, "0")).join("")}`;
  const l1 = relativeLuminance(toHex(front));
  const l2 = relativeLuminance(toHex(back));
  const [hi, lo] = l1 >= l2 ? [l1, l2] : [l2, l1];
  return (hi + 0.05) / (lo + 0.05);
}

/** True when `ratio` reaches `minimum` (4.5 for text, 3 for large text and UI components). */
export function meetsContrast(ratio: number, minimum: number): boolean {
  return Number.isFinite(ratio) && ratio >= minimum;
}
