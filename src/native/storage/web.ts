import { createUnavailableStorage } from "./memory.js";
import type { StorageAdapter } from "./types.js";

/** The slice of the DOM `Storage` interface used here. */
export interface WebStorageLike {
  getItem(key: string): string | null;
  setItem(key: string, value: string): void;
  removeItem(key: string): void;
}

/** `window.localStorage`, or `undefined` when it is missing or access throws (SSR, sandboxed iframes, blocked cookies). */
export function resolveLocalStorage(): WebStorageLike | undefined {
  try {
    const storage = (globalThis as { localStorage?: WebStorageLike }).localStorage;
    return storage && typeof storage.getItem === "function" && typeof storage.setItem === "function" ? storage : undefined;
  } catch {
    return undefined;
  }
}

/**
 * Plain storage over `localStorage` (or an injected `Storage`). Without a usable storage the adapter is `unavailable`.
 * Reads that throw resolve `null`; a failing write (quota, private mode) rejects so the caller can react.
 */
export function createWebStorage(storage: WebStorageLike | undefined = resolveLocalStorage()): StorageAdapter {
  if (!storage) return createUnavailableStorage("plain");
  return {
    kind: "plain",
    status: "available",
    getItem: async (key) => {
      try {
        return storage.getItem(key);
      } catch {
        return null;
      }
    },
    setItem: async (key, value) => storage.setItem(key, value),
    removeItem: async (key) => {
      try {
        storage.removeItem(key);
      } catch {
        // removing from a blocked storage is a no-op
      }
    },
  };
}
