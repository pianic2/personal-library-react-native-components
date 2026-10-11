import { useEffect, useMemo, useState } from "react";
import type { ThemeMode } from "../../theme/types.js";
import { useCapability } from "../core/CapabilityProvider.js";
import type { AppearanceApi, ColorSchemeValue } from "../core/types.js";
import { resolveFallbackAppearance, toColorScheme } from "./sources.js";

// Resolves the api once per adapter. ONLY an adapter whose status is exactly "noop" (nothing configured) falls back to
// React Native's `Appearance`; an injected adapter with status "available" or "unavailable" is used as given.
// A throwing api must not crash the tree: reads degrade to an unknown scheme and subscribing to a no-op. In development a
// swallowed error is reported so real bugs stay visible.
function warnSwallowed(where: string, error: unknown): void {
  if ((globalThis as { __DEV__?: boolean }).__DEV__ === true && typeof console !== "undefined") {
    console.warn(`[appearance] ${where} threw and was ignored (degrading to an unknown colour scheme):`, error);
  }
}

function guard(api: AppearanceApi): AppearanceApi {
  return {
    getColorScheme() {
      try {
        return toColorScheme(api.getColorScheme());
      } catch (error) {
        warnSwallowed("getColorScheme", error);
        return null;
      }
    },
    subscribe(listener) {
      try {
        return api.subscribe((scheme) => listener(toColorScheme(scheme)));
      } catch (error) {
        warnSwallowed("subscribe", error);
        return () => undefined;
      }
    },
  };
}

function useAppearanceApi(): AppearanceApi {
  const adapter = useCapability("appearance");
  return useMemo(() => guard(adapter.status === "noop" ? resolveFallbackAppearance() : adapter.api), [adapter]);
}

/** The OS colour scheme, `null` while unknown (SSR, no `Appearance`); re-renders on change. */
function useRawColorScheme(): ColorSchemeValue {
  const api = useAppearanceApi();
  const [scheme, setScheme] = useState<ColorSchemeValue>(() => api.getColorScheme());
  useEffect(() => {
    setScheme(api.getColorScheme());
    return api.subscribe(setScheme);
  }, [api]);
  return scheme;
}

/**
 * Maps a theme preference to a mode: `light` and `dark` are returned as they are, `system` becomes the given OS scheme,
 * and an unknown scheme (`null`, `undefined`) becomes `light`.
 */
export function resolveThemeMode(preference: ThemeMode | "system", scheme: ColorSchemeValue | undefined = null): ThemeMode {
  if (preference === "light" || preference === "dark") return preference;
  return scheme === "dark" ? "dark" : "light";
}

/** The OS colour scheme, `light` while unknown. Follows changes of the system setting. SSR-safe: renders `light`. */
export function useColorScheme(): ThemeMode {
  return resolveThemeMode("system", useRawColorScheme());
}

/** The theme mode that follows the OS: the same value as `useColorScheme`, typed as a `ThemeMode`. */
export function useSystemThemeMode(): ThemeMode {
  return useColorScheme();
}
