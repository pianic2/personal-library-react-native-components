// Structural adapter for an injected secure-store module (the package itself is never imported here).
import * as ReactNative from "react-native";
import { createUnavailableStorage } from "./memory.js";
import { createWebStorage, type WebStorageLike } from "./web.js";
import type { StorageAdapter } from "./types.js";

/** The slice of `expo-secure-store` used here. Keys may only contain letters, digits, ".", "-" and "_". */
export interface SecureStoreModuleLike {
  getItemAsync(key: string): Promise<string | null>;
  setItemAsync(key: string, value: string): Promise<void>;
  deleteItemAsync(key: string): Promise<void>;
}

export interface SecureStorageOptions {
  /** Overrides React Native's `Platform.OS` ("web" selects the no-secure-storage path). */
  platform?: string;
  /**
   * Web has no secure storage. By default the adapter is `unavailable` there; set this to store the values in
   * `localStorage` anyway. The adapter then reports `insecure: true`. Never use it for secrets.
   */
  allowInsecureWeb?: boolean;
  /** Overrides `localStorage` for the insecure web mode. */
  webStorage?: WebStorageLike;
}

const UNAVAILABLE_MESSAGE = "Secure storage is unavailable on this platform";

function rejecting(): StorageAdapter {
  const base = createUnavailableStorage("secure");
  return {
    ...base,
    setItem: () => Promise.reject(new Error(UNAVAILABLE_MESSAGE)),
    removeItem: () => Promise.reject(new Error(UNAVAILABLE_MESSAGE)),
  };
}

/**
 * Secure storage over an injected secure-store module. There is no silent downgrade: on web, or without the module, the
 * adapter is `unavailable`, reads resolve `null` and writes REJECT (they never fall back to plain storage). The one
 * exception is `allowInsecureWeb`, which is explicit and reported through `insecure: true`.
 */
export function createSecureStorage(module: SecureStoreModuleLike | null | undefined, options: SecureStorageOptions = {}): StorageAdapter {
  const platform = options.platform ?? (ReactNative as unknown as { Platform?: { OS?: string } }).Platform?.OS ?? "web";
  if (platform === "web") {
    if (!options.allowInsecureWeb) return rejecting();
    const web = createWebStorage(options.webStorage);
    return { ...web, kind: "secure", insecure: true };
  }
  if (!module) return rejecting();
  return {
    kind: "secure",
    status: "available",
    getItem: async (key) => (await module.getItemAsync(key)) ?? null,
    setItem: (key, value) => Promise.resolve(module.setItemAsync(key, value)),
    removeItem: (key) => Promise.resolve(module.deleteItemAsync(key)),
  };
}
