// Structural adapter for an injected AsyncStorage module (the package itself is never imported here).
import { createUnavailableStorage } from "./memory.js";
import type { StorageAdapter } from "./types.js";

/** The slice of `@react-native-async-storage/async-storage` used here (its default export has these methods). */
export interface AsyncStorageModuleLike {
  getItem(key: string): Promise<string | null>;
  setItem(key: string, value: string): Promise<void>;
  removeItem(key: string): Promise<void>;
}

/** Plain storage over an injected AsyncStorage. Without the module the adapter is `unavailable`. */
export function createAsyncStorage(module: AsyncStorageModuleLike | null | undefined): StorageAdapter {
  if (!module) return createUnavailableStorage("plain");
  return {
    kind: "plain",
    status: "available",
    getItem: async (key) => (await module.getItem(key)) ?? null,
    setItem: (key, value) => Promise.resolve(module.setItem(key, value)),
    removeItem: (key) => Promise.resolve(module.removeItem(key)),
  };
}
