// Structural adapter for injected `expo-system-ui` and `expo-navigation-bar` modules (the modules themselves are never
// imported here). Android only for the navigation bar: pass `navigationBar` on Android and leave it out elsewhere.
import { warnSwallowed } from "./warn.js";
import type { SystemBarsConfig, SystemUiAdapter } from "./types.js";

/** The slice of `expo-system-ui` the adapter needs. */
export interface ExpoSystemUiLike {
  setBackgroundColorAsync(color: string): Promise<unknown>;
}

/** The slice of `expo-navigation-bar` the adapter needs. */
export interface ExpoNavigationBarLike {
  setBackgroundColorAsync?(color: string): Promise<unknown>;
  setButtonStyleAsync?(style: "light" | "dark"): Promise<unknown>;
}

export interface ExpoSystemUiModules {
  systemUi?: ExpoSystemUiLike | null;
  navigationBar?: ExpoNavigationBarLike | null;
}

async function step(name: string, run: () => Promise<unknown> | undefined): Promise<void> {
  try {
    await run();
  } catch (error) {
    warnSwallowed(name, error);
  }
}

/**
 * Maps the injected modules onto the adapter. Every step runs on its own: a failure of one (a rejection or a synchronous
 * throw) is swallowed, with a development-only warning, and does not stop the others. `apply` never rejects.
 */
export function createExpoSystemUi({ systemUi, navigationBar }: ExpoSystemUiModules): SystemUiAdapter {
  return {
    async apply({ mode, backgroundColor }: SystemBarsConfig) {
      if (systemUi) await step("expo-system-ui setBackgroundColorAsync", () => systemUi.setBackgroundColorAsync(backgroundColor));
      if (navigationBar?.setBackgroundColorAsync) await step("expo-navigation-bar setBackgroundColorAsync", () => navigationBar.setBackgroundColorAsync?.(backgroundColor));
      if (navigationBar?.setButtonStyleAsync) await step("expo-navigation-bar setButtonStyleAsync", () => navigationBar.setButtonStyleAsync?.(mode === "dark" ? "light" : "dark"));
    },
  };
}
