import type { SplashAdapter } from "./types.js";

/** The splash adapter for web and for apps with no splash module: both calls resolve and do nothing. */
export function createNoopSplash(): SplashAdapter {
  return { preventAutoHide: async () => undefined, hide: async () => undefined };
}
