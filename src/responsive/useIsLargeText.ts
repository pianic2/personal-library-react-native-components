import { useFontScale } from "../native/accessibility/index.js";

/** The font scale from which text counts as large. */
export const LARGE_TEXT_THRESHOLD = 1.3;

/**
 * True when the system font scale is at least `threshold` (default `LARGE_TEXT_THRESHOLD`, 1.3). Built on `useFontScale`,
 * the single font scale implementation of the library, so it follows live changes of the system setting. A `threshold`
 * that is not a positive finite number falls back to the default.
 */
export function useIsLargeText(threshold: number = LARGE_TEXT_THRESHOLD): boolean {
  const scale = useFontScale();
  const limit = Number.isFinite(threshold) && threshold > 0 ? threshold : LARGE_TEXT_THRESHOLD;
  return scale >= limit;
}
