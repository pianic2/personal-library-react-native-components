// Typed usage of the accessibility preference hooks (PLRNUI-167). Compiled by `tsc -p tsconfig.tests.json`.
import {
  useAccessibilityPreferences,
  useBoldText,
  useDynamicTypeStyle,
  useFontScale,
  useGrayscale,
  useInvertColors,
  useReduceTransparency,
  useReducedMotion,
  useScreenReaderEnabled,
} from "../../../src/native/accessibility/index.js";
import type { AccessibilityApi, AccessibilityPreferences } from "../../../src/native/core/index.js";

type Equal<A, B> = (<T>() => T extends A ? 1 : 2) extends <T>() => T extends B ? 1 : 2 ? true : false;
type Expect<T extends true> = T;

export type BooleanHooks = Expect<
  Equal<
    [typeof useReducedMotion, typeof useReduceTransparency, typeof useScreenReaderEnabled, typeof useBoldText, typeof useGrayscale, typeof useInvertColors],
    [() => boolean, () => boolean, () => boolean, () => boolean, () => boolean, () => boolean]
  >
>;
export type FontScaleSig = Expect<Equal<typeof useFontScale, () => number>>;
export type AggregateSig = Expect<Equal<typeof useAccessibilityPreferences, () => AccessibilityPreferences>>;
export type PreferencesShape = Expect<
  Equal<
    AccessibilityPreferences,
    {
      reduceMotion: boolean;
      reduceTransparency: boolean;
      screenReader: boolean;
      boldText: boolean;
      grayscale: boolean;
      invertColors: boolean;
      fontScale: number;
    }
  >
>;
export type ApiShape = Expect<
  Equal<AccessibilityApi, { getPreferences(): AccessibilityPreferences; subscribe(listener: (preferences: AccessibilityPreferences) => void): () => void }>
>;

export function usage() {
  const style = useDynamicTypeStyle({ fontSize: 16, lineHeight: 24, fontWeight: "600" as const }, { max: 32 });
  const size: number = style.fontSize;
  const weight: "600" = style.fontWeight;
  const reduced: boolean = useReducedMotion();
  // @ts-expect-error the base style needs a numeric fontSize
  useDynamicTypeStyle({ fontSize: "16" });
  return { size, weight, reduced };
}
