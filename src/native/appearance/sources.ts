// Appearance sources used by the hooks when no adapter is injected. No expo-* and no native package: only the `Appearance`
// member of `react-native` core (react-native-web implements it on top of `matchMedia`), looked up defensively so SSR and
// test shims never throw.
import * as ReactNative from "react-native";
import type { AppearanceApi, ColorSchemeValue } from "../core/types.js";

/** The slice of React Native's `Appearance` the mapping needs. */
export interface RNAppearance {
  getColorScheme(): string | null | undefined;
  addChangeListener(listener: (preferences: { colorScheme?: string | null }) => void): { remove(): void };
}

/** `light` and `dark` map to themselves; anything else (null, undefined, `unspecified`) is unknown. */
export const toColorScheme = (value: unknown): ColorSchemeValue => (value === "light" || value === "dark" ? value : null);

/** Mapping over React Native's `Appearance` (native and react-native-web). */
export function createReactNativeAppearance(host: RNAppearance): AppearanceApi {
  return {
    getColorScheme: () => toColorScheme(host.getColorScheme()),
    subscribe(listener) {
      const subscription = host.addChangeListener((preferences) => listener(toColorScheme(preferences?.colorScheme)));
      return () => subscription.remove();
    },
  };
}

const inertAppearance: AppearanceApi = { getColorScheme: () => null, subscribe: () => () => undefined };

/** Fallback when no adapter was injected: React Native `Appearance`, else an inert api that reports an unknown scheme. */
export function resolveFallbackAppearance(): AppearanceApi {
  const rn = (ReactNative as unknown as { Appearance?: RNAppearance }).Appearance;
  if (rn && typeof rn.getColorScheme === "function" && typeof rn.addChangeListener === "function") return createReactNativeAppearance(rn);
  return inertAppearance;
}
