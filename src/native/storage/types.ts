import type { ThemeStorageAdapter } from "../../theme/types.js";

/** `secure`: values are kept in the platform keychain / keystore. `plain`: ordinary app storage, readable by the user and by backups. */
export type StorageKind = "plain" | "secure";

/**
 * `available`: reads and writes work. `unavailable`: no backend (module not injected, no `localStorage`, or secure storage
 * asked for on web without `allowInsecureWeb`); reads resolve `null` and writes either do nothing (plain) or reject (secure).
 */
export type StorageStatus = "available" | "unavailable";

/** Key-value storage. Structurally assignable to the theme's `ThemeStorageAdapter`, so it can be passed to `ThemeProvider`. */
export interface StorageAdapter {
  readonly kind: StorageKind;
  readonly status: StorageStatus;
  /** True only for a secure adapter that was explicitly downgraded to browser storage (`allowInsecureWeb`). */
  readonly insecure?: boolean;
  getItem(key: string): Promise<string | null>;
  setItem(key: string, value: string): Promise<void>;
  removeItem(key: string): Promise<void>;
}

// Compile-time guarantee: a StorageAdapter can be used wherever the theme expects a ThemeStorageAdapter.
type Assignable<_T extends ThemeStorageAdapter> = true;
export type StorageAdapterIsThemeStorage = Assignable<StorageAdapter>;
