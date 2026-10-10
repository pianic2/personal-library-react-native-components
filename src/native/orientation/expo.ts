// Expo adapter for orientation lock. The module is injected by the app; this file never imports expo-* nor calls require.
import { createNoopOrientationLock } from "./noop.js";
import type { OrientationLockAdapter, OrientationLockMode } from "./types.js";

/**
 * Structural view of `expo-screen-orientation`: only the members used here. `OrientationLock` is the enum object
 * (`PORTRAIT_UP`, `LANDSCAPE`, ...), whose values are passed back to `lockAsync`.
 */
export interface ScreenOrientationModuleLike {
  OrientationLock: { PORTRAIT_UP: unknown; LANDSCAPE: unknown };
  lockAsync(orientationLock: never): Promise<unknown>;
  unlockAsync(): Promise<unknown>;
}

/**
 * `createExpoOrientationLock(ScreenOrientation)` returns an `available` adapter; without the module (or with an
 * unusable one) it returns an `unavailable` adapter whose `lock`/`unlock` resolve `false`. Never throws; a rejected
 * native call resolves `false`.
 */
export function createExpoOrientationLock(module?: ScreenOrientationModuleLike | null): OrientationLockAdapter {
  if (module == null || typeof module.lockAsync !== "function" || typeof module.unlockAsync !== "function" || module.OrientationLock == null) {
    return createNoopOrientationLock("unavailable");
  }
  const lockAsync = module.lockAsync as (value: unknown) => Promise<unknown>;
  const attempt = async (run: () => Promise<unknown>): Promise<boolean> => {
    try {
      await run();
      return true;
    } catch {
      return false;
    }
  };
  return {
    status: "available",
    lock: (mode: OrientationLockMode) =>
      attempt(() => lockAsync.call(module, mode === "landscape" ? module.OrientationLock.LANDSCAPE : module.OrientationLock.PORTRAIT_UP)),
    unlock: () => attempt(() => module.unlockAsync()),
  };
}
