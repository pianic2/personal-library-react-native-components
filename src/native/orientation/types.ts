// Orientation and window metrics contract (PLRNUI-182). Types only; no runtime, no native import.

export type Orientation = "portrait" | "landscape";

export interface WindowMetrics {
  width: number;
  height: number;
  scale: number;
  fontScale: number;
}

/**
 * Optional external source of window metrics (injection point for tests and hosts). `subscribe` returns an
 * unsubscribe function. When a hook gets no source it reads `useWindowDimensions()` from react-native.
 */
export interface WindowMetricsSource {
  get(): WindowMetrics;
  subscribe(listener: () => void): () => void;
}

/** A lock request. `default` releases to the platform default through `lock`. */
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
