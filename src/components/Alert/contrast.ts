/** WCAG 2.x contrast helpers for picking readable text on a coloured background. Colours are 6 or 8 digit hex strings (alpha is ignored). */

function luminance(hex: string): number {
  const [r, g, b] = (hex.slice(1, 7).match(/../g) ?? []).map((pair) => {
    const s = parseInt(pair, 16) / 255;
    return s <= 0.03928 ? s / 12.92 : ((s + 0.055) / 1.055) ** 2.4;
  }) as [number, number, number];
  return 0.2126 * r + 0.7152 * g + 0.0722 * b;
}

/** The WCAG contrast ratio (1 to 21) of two hex colours, or `NaN` when either is not a 6 or 8 digit hex colour. */
export function contrastRatio(a: string, b: string): number {
  const [light, dark] = [luminance(a), luminance(b)].sort((x, y) => y - x) as [number, number];
  return (light + 0.05) / (dark + 0.05);
}

/** The candidate with the highest contrast on `background`; the first candidate when no ratio can be computed. */
export function readableOn(background: string, candidates: readonly [string, ...string[]]): string {
  return candidates.reduce((best, candidate) => (contrastRatio(background, candidate) > contrastRatio(background, best) ? candidate : best));
}
