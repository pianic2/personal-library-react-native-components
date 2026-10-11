// Typed usage of the appearance hooks (PLRNUI-154). Compiled by `tsc -p tsconfig.tests.json` through appearance.test.tsx.
import type { ThemeMode } from "../../../src/theme/types.js";
import { resolveThemeMode, useColorScheme, useSystemThemeMode } from "../../../src/native/appearance/index.js";
import type { AppearanceApi, ColorSchemeValue } from "../../../src/native/core/index.js";

type Equal<A, B> = (<T>() => T extends A ? 1 : 2) extends <T>() => T extends B ? 1 : 2 ? true : false;
type Expect<T extends true> = T;

export type UseColorSchemeSig = Expect<Equal<typeof useColorScheme, () => ThemeMode>>;
export type UseSystemThemeModeSig = Expect<Equal<typeof useSystemThemeMode, () => ThemeMode>>;
export type ResolveThemeModeSig = Expect<Equal<typeof resolveThemeMode, (preference: ThemeMode | "system", scheme?: ColorSchemeValue) => ThemeMode>>;
export type ColorSchemeValues = Expect<Equal<ColorSchemeValue, "light" | "dark" | null>>;
export type AppearanceApiShape = Expect<
  Equal<AppearanceApi, { getColorScheme(): ColorSchemeValue; subscribe(listener: (scheme: ColorSchemeValue) => void): () => void }>
>;

export const resolved: ThemeMode = resolveThemeMode("system", null);
// @ts-expect-error only "light", "dark" and "system" are preferences
resolveThemeMode("auto");
