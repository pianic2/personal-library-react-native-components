// Orientation and window metrics contract (PLRNUI-182). Types only; no runtime, no native import.

export type Orientation = "portrait" | "landscape";

export interface WindowMetrics {
  width: number;
  height: number;
  scale: number;
  fontScale: number;
}

/**
 * Optional external source of window metrics (injection point for tests and hosts). When a hook gets no source it
 * reads `useWindowDimensions()` from react-native. Contract:
 * - `subscribe` registers `listener` and returns an unsubscribe function; it is called on unmount and when the
 *   `source` object changes. Keep the `source` object stable between renders (hoist or memoize it).
 * - `get` may return a fresh object on every call: the hook caches the snapshot by value (width, height, scale,
 *   fontScale).
 * - `getServer` (optional) is the snapshot used on the server and while hydrating; it defaults to `get`.
 * - Pass a source on every render of a component or on none: switching between "source" and "no source" changes the
 *   hook order. Swapping one source for another is fine.
 */
export interface WindowMetricsSource {
  get(): WindowMetrics;
  getServer?(): WindowMetrics;
  subscribe(listener: () => void): () => void;
}

/** A lock request. Use `unlock()` to release the lock. */
export type OrientationLockMode = "portrait" | "landscape";

/**
 * `available`: backed by a real module. `unavailable`: the module was not provided. `noop`: nothing is configured
 * (web, Expo-less). In both non-available states `lock` and `unlock` resolve `false` and never throw.
 */
export type OrientationLockStatus = "available" | "unavailable" | "noop";

/**
 * Not a `CapabilityMap` entry (that map is closed and owned by the core): a standalone adapter shape.
 * `lock`/`unlock` resolve `true` when the lock was applied, `false` otherwise (including errors).
 */
export interface OrientationLockAdapter {
  status: OrientationLockStatus;
  lock(mode: OrientationLockMode): Promise<boolean>;
  unlock(): Promise<boolean>;
}
