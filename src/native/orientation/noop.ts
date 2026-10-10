import type { OrientationLockAdapter, OrientationLockStatus } from "./types.js";

/** A lock adapter that does nothing: `lock` and `unlock` resolve `false`. Status `noop` unless told otherwise. */
export function createNoopOrientationLock(status: Exclude<OrientationLockStatus, "available"> = "noop"): OrientationLockAdapter {
  return { status, lock: async () => false, unlock: async () => false };
}
