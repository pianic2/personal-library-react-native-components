import type { ShareAdapter, ShareResult } from "./types.js";

const unsupported: ShareResult = Object.freeze({ action: "unsupported" }) as ShareResult;

/** The adapter for apps that configured nothing: `share` resolves `{ action: "unsupported" }` and shows nothing. */
export function createNoopShare(): ShareAdapter {
  return { share: async () => unsupported };
}
