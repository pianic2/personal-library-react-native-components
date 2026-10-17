import type { SystemUiAdapter } from "./types.js";

/** The adapter when nothing is configured and the platform is not the web: it does nothing. */
export function createNoopSystemUi(): SystemUiAdapter {
  return { apply: async () => undefined };
}
