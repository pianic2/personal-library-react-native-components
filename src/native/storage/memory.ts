import type { StorageAdapter } from "./types.js";

/** In-memory storage (tests, previews, SSR). Optionally seeded. Values do not survive a reload. */
export function createMemoryStorage(initial: Record<string, string> = {}): StorageAdapter {
  const map = new Map<string, string>(Object.entries(initial));
  return {
    kind: "plain",
    status: "available",
    getItem: async (key) => map.get(key) ?? null,
    setItem: async (key, value) => void map.set(key, value),
    removeItem: async (key) => void map.delete(key),
  };
}

/** Plain storage with no backend: reads resolve `null`, writes do nothing. */
export function createUnavailableStorage(kind: "plain" | "secure" = "plain"): StorageAdapter {
  return {
    kind,
    status: "unavailable",
    getItem: async () => null,
    setItem: async () => undefined,
    removeItem: async () => undefined,
  };
}
