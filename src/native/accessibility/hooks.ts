import { useEffect, useMemo, useState } from "react";
import { useCapability } from "../core/CapabilityProvider.js";
import type { AccessibilityApi, AccessibilityPreferences } from "../core/types.js";
import { DEFAULT_PREFERENCES, resolveFallbackAccessibility } from "./sources.js";

// Resolves the api once per adapter. ONLY an adapter whose status is exactly "noop" (nothing configured) falls back to
// the web/React Native source; an injected adapter with status "available" or "unavailable" is used as given.
// A throwing api (for example a denied permission in the mocks) must not crash the tree: reads degrade to "no
// preference set" and subscribing to a no-op. In development a swallowed error is reported so real bugs stay visible.
function warnSwallowed(where: string, error: unknown): void {
  if ((globalThis as { __DEV__?: boolean }).__DEV__ === true && typeof console !== "undefined") {
    console.warn(`[accessibility] ${where} threw and was ignored (degrading to default preferences):`, error);
  }
}

function guard(api: AccessibilityApi): AccessibilityApi {
  return {
    getPreferences() {
      try {
        return api.getPreferences();
      } catch (error) {
        warnSwallowed("getPreferences", error);
        return DEFAULT_PREFERENCES;
      }
    },
    subscribe(listener) {
      try {
        return api.subscribe(listener);
      } catch (error) {
        warnSwallowed("subscribe", error);
        return () => undefined;
      }
    },
  };
}

function useAccessibilityApi(): AccessibilityApi {
  const adapter = useCapability("accessibility");
  return useMemo(() => guard(adapter.status === "noop" ? resolveFallbackAccessibility() : adapter.api), [adapter]);
}

// `select` must be a stable (module-level) function: a primitive result bails out of re-renders when unchanged.
function usePreference<T>(select: (preferences: AccessibilityPreferences) => T): T {
  const api = useAccessibilityApi();
  const [value, setValue] = useState<T>(() => select(api.getPreferences()));
  useEffect(() => {
    setValue(select(api.getPreferences()));
    return api.subscribe((preferences) => setValue(select(preferences)));
  }, [api, select]);
  return value;
}

const selectReduceMotion = (p: AccessibilityPreferences): boolean => p.reduceMotion;
const selectReduceTransparency = (p: AccessibilityPreferences): boolean => p.reduceTransparency;
const selectScreenReader = (p: AccessibilityPreferences): boolean => p.screenReader;
const selectBoldText = (p: AccessibilityPreferences): boolean => p.boldText;
const selectGrayscale = (p: AccessibilityPreferences): boolean => p.grayscale;
const selectInvertColors = (p: AccessibilityPreferences): boolean => p.invertColors;
const selectFontScale = (p: AccessibilityPreferences): number => p.fontScale;
const selectAll = (p: AccessibilityPreferences): AccessibilityPreferences => p;

/** True when the user asked the system to reduce motion. The single implementation in the library. */
export function useReducedMotion(): boolean {
  return usePreference(selectReduceMotion);
}

/** True when the user asked the system to reduce transparency/blur (iOS, web `prefers-reduced-transparency`). */
export function useReduceTransparency(): boolean {
  return usePreference(selectReduceTransparency);
}

/** True while a screen reader (VoiceOver, TalkBack) is running. False on web. */
export function useScreenReaderEnabled(): boolean {
  return usePreference(selectScreenReader);
}

/** True when the system bold-text setting is on (iOS, Android). */
export function useBoldText(): boolean {
  return usePreference(selectBoldText);
}

/** True when the grayscale display filter is on (iOS). */
export function useGrayscale(): boolean {
  return usePreference(selectGrayscale);
}

/** True when invert colors is on (iOS). */
export function useInvertColors(): boolean {
  return usePreference(selectInvertColors);
}

/** The system font-size multiplier (1 = default). The single implementation in the library. */
export function useFontScale(): number {
  return usePreference(selectFontScale);
}

/** Every preference in one object; the same object is returned until a value changes. */
export function useAccessibilityPreferences(): AccessibilityPreferences {
  return usePreference(selectAll);
}

/**
 * `fontSize * scale`, capped at `max` (an absolute font size in the same unit as `fontSize`) when given. A non-finite or
 * non-positive `scale` counts as 1. A `max` below the base size wins over the base size.
 */
export function scaleFontSize(fontSize: number, scale: number, max?: number): number {
  const factor = Number.isFinite(scale) && scale > 0 ? scale : 1;
  const scaled = fontSize * factor;
  return max !== undefined && Number.isFinite(max) && scaled > max ? max : scaled;
}

/** Applies `scaleFontSize` to a text style; `lineHeight` (when set) follows the same ratio so line spacing stays proportional. */
export function scaleTextStyle<T extends { fontSize: number; lineHeight?: number }>(base: T, scale: number, max?: number): T {
  const fontSize = scaleFontSize(base.fontSize, scale, max);
  const ratio = base.fontSize > 0 ? fontSize / base.fontSize : 1;
  return base.lineHeight === undefined ? { ...base, fontSize } : { ...base, fontSize, lineHeight: base.lineHeight * ratio };
}

/** The text style scaled by the system font scale and capped at `max`. */
export function useDynamicTypeStyle<T extends { fontSize: number; lineHeight?: number }>(base: T, options?: { max?: number }): T {
  const scale = useFontScale();
  const max = options?.max;
  const { fontSize, lineHeight } = base;
  // eslint-disable-next-line react-hooks/exhaustive-deps -- `base` is rebuilt every render; its scaled fields are the inputs
  return useMemo(() => scaleTextStyle(base, scale, max), [fontSize, lineHeight, scale, max]);
}

/** A named accessibility preferences snapshot type, re-exported for hook consumers. */
export type { AccessibilityPreferences } from "../core/types.js";
