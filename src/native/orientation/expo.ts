// Expo adapter for orientation lock. The module is injected by the app; this file never imports expo-* nor calls require.
import { createNoopOrientationLock } from "./noop.js";
import type { OrientationLockAdapter, OrientationLockMode } from "./types.js";

/**
 * Structural view of `expo-screen-orientation`: only the members used here, so `typeof ScreenOrientation` is assignable
 * without a cast. `OrientationLock` is the enum object (`PORTRAIT_UP`, `LANDSCAPE`, ...); its values are passed back to
 * `lockAsync` (method syntax keeps the parameter bivariant, so a function taking the enum type is accepted).
 */
export interface ScreenOrientationModuleLike {
  OrientationLock: { PORTRAIT_UP: number; LANDSCAPE: number };
  lockAsync(orientationLock: number): Promise<unknown>;
  unlockAsync(): Promise<unknown>;
}

export interface ExpoOrientationLockOptions {
  /** Called with the native error when a `lock` or `unlock` call rejects or throws. Default: silent. Its own errors are ignored. */
  onError?: (error: unknown, op: "lock" | "unlock") => void;
}

function usable(module: unknown): module is ScreenOrientationModuleLike {
  if (module == null || typeof module !== "object") return false;
  const m = module as Partial<ScreenOrientationModuleLike>;
  return (
    typeof m.lockAsync === "function" &&
    typeof m.unlockAsync === "function" &&
    m.OrientationLock != null &&
    typeof m.OrientationLock === "object" &&
    m.OrientationLock.PORTRAIT_UP != null &&
    m.OrientationLock.LANDSCAPE != null
  );
}

/**
 * `createExpoOrientationLock(ScreenOrientation)` returns an `available` adapter; without the module, or with one that
 * lacks a member, it returns an `unavailable` adapter whose `lock`/`unlock` resolve `false`. Never throws; a failed
 * native call resolves `false` and is reported to `options.onError` when given.
 */
export function createExpoOrientationLock(module?: ScreenOrientationModuleLike | null, options: ExpoOrientationLockOptions = {}): OrientationLockAdapter {
  if (!usable(module)) return createNoopOrientationLock("unavailable");
  const attempt = async (op: "lock" | "unlock", run: () => Promise<unknown>): Promise<boolean> => {
    try {
      await run();
      return true;
    } catch (error) {
      try {
        options.onError?.(error, op);
      } catch {
        // a failing callback must not break the adapter
      }
      return false;
    }
  };
  return {
    status: "available",
    lock: (mode: OrientationLockMode) =>
      attempt("lock", async () => module.lockAsync(mode === "landscape" ? module.OrientationLock.LANDSCAPE : module.OrientationLock.PORTRAIT_UP)),
    unlock: () => attempt("unlock", async () => module.unlockAsync()),
  };
}
