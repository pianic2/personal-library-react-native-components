// Structural adapter for an injected `expo-clipboard` module (the module itself is never imported here).
import { defineExpoAdapter } from "../core/defineExpoAdapter.js";
import type { ClipboardApi } from "../core/types.js";

/** The slice of `expo-clipboard` the adapter needs. */
export interface ExpoClipboardModuleLike {
  setStringAsync(value: string): Promise<unknown>;
  getStringAsync(): Promise<string>;
}

/** Maps an injected `expo-clipboard` module onto the capability api. Rejections reach the caller. */
export function createExpoClipboard(module: ExpoClipboardModuleLike): ClipboardApi {
  return {
    getString: async () => String(await module.getStringAsync()),
    setString: async (value) => void (await module.setStringAsync(value)),
  };
}

/** Capability adapter factory: `available` with the module, `unavailable` (noop api) without it. Pass it to CapabilityProvider. */
export const createExpoClipboardAdapter = defineExpoAdapter<"clipboard", ExpoClipboardModuleLike>("clipboard", createExpoClipboard);
