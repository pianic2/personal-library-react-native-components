// Structural adapter for an injected `expo-splash-screen` module (the module itself is never imported here).
import type { SplashAdapter } from "./types.js";

/** The slice of `expo-splash-screen` the adapter needs. */
export interface ExpoSplashScreenLike {
  preventAutoHideAsync(): Promise<unknown>;
  hideAsync(): Promise<unknown>;
}

/**
 * Maps an injected `expo-splash-screen` module onto the splash adapter. A rejection of the module (for example
 * "no native splash screen registered") is swallowed: a splash problem must never keep the app from starting.
 */
export function createExpoSplash(module: ExpoSplashScreenLike): SplashAdapter {
  return {
    preventAutoHide: async () => {
      try {
        await module.preventAutoHideAsync();
      } catch {
        // the splash is cosmetic
      }
    },
    hide: async () => {
      try {
        await module.hideAsync();
      } catch {
        // the splash is cosmetic
      }
    },
  };
}
