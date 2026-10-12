// WCAG 2.x contrast for the Button's filled variants. Only #RRGGBB / #RGB values can be measured; anything else
// (rgba(), named colours, platform colours) is left alone. Kept local until the shared contrast util (E2-11) lands.

function channel(value: number): number {
  const c = value / 255;
  return c <= 0.03928 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4;
}

function parseHex(color: string): [number, number, number] | null {
  const match = /^#([0-9a-f]{3}|[0-9a-f]{6})(?:[0-9a-f]{2})?$/i.exec(color.trim());
  if (!match) return null;
  const hex = match[1]!.length === 3 ? match[1]!.replace(/./g, (c) => c + c) : match[1]!;
  const n = parseInt(hex, 16);
  return [(n >> 16) & 255, (n >> 8) & 255, n & 255];
}

/** WCAG contrast ratio (1 to 21) between two hex colours, or `null` when either one is not a plain hex colour. */
export function contrastRatio(a: string, b: string): number | null {
  const rgbA = parseHex(a);
  const rgbB = parseHex(b);
  if (!rgbA || !rgbB) return null;
  const la = 0.2126 * channel(rgbA[0]) + 0.7152 * channel(rgbA[1]) + 0.0722 * channel(rgbA[2]);
  const lb = 0.2126 * channel(rgbB[0]) + 0.7152 * channel(rgbB[1]) + 0.0722 * channel(rgbB[2]);
  const [hi, lo] = la >= lb ? [la, lb] : [lb, la];
  return (hi + 0.05) / (lo + 0.05);
}

export const MIN_TEXT_CONTRAST = 4.5;

/**
 * `preferred` when it reads on `background` (ratio >= 4.5, or not measurable), else whichever of `alternatives` reads
 * best; `preferred` again when nothing reaches 4.5.
 */
export function readableOn(background: string, preferred: string, ...alternatives: string[]): string {
  const base = contrastRatio(preferred, background);
  if (base === null || base >= MIN_TEXT_CONTRAST) return preferred;
  let best = preferred;
  let bestRatio = base;
  for (const candidate of alternatives) {
    const ratio = contrastRatio(candidate, background);
    if (ratio !== null && ratio > bestRatio) {
      best = candidate;
      bestRatio = ratio;
    }
  }
  return best;
}

/**
 * `base` with `overlay` drawn over it at `amount` (0 to 1), as #RRGGBB. `null` when either colour is not plain hex, so the
 * caller can fall back to another feedback.
 */
export function mixColors(base: string, overlay: string, amount: number): string | null {
  const a = parseHex(base);
  const b = parseHex(overlay);
  if (!a || !b) return null;
  const t = Math.min(1, Math.max(0, amount));
  const hex = (i: 0 | 1 | 2) => Math.round(a[i] * (1 - t) + b[i] * t).toString(16).padStart(2, "0");
  return `#${hex(0)}${hex(1)}${hex(2)}`.toUpperCase();
}

/**
 * Opacity of the pressed state layer. Mirrors `stateLayer.pressed` in tokens/semantic.base.ts (a test keeps them equal);
 * importing that module here would pull the whole palette into every Button bundle (about 1.4 KB gzip).
 */
export const PRESSED_LAYER = 0.12;
