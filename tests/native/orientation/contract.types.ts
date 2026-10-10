// Typed usage compiled by tsconfig.tests.json. `typecheck:contracts` (tsconfig.type-tests.json) only includes
// `tests/types/**`, which this ticket does not own, so it cannot include this file.
import { createExpoOrientationLock, useOrientation, useWindowMetrics } from "../../../src/native/orientation/index.js";
import type { Orientation, OrientationLockAdapter, WindowMetrics } from "../../../src/native/orientation/index.js";

// Shaped like `typeof ScreenOrientation` (numeric enum, extra members), declared locally: no expo type is imported.
enum OrientationLock {
  DEFAULT = 0,
  PORTRAIT_UP = 3,
  LANDSCAPE = 5,
}
declare const ScreenOrientation: {
  OrientationLock: typeof OrientationLock;
  lockAsync(orientationLock: OrientationLock): Promise<void>;
  unlockAsync(): Promise<void>;
  getOrientationAsync(): Promise<number>;
};

export const adapter: OrientationLockAdapter = createExpoOrientationLock(ScreenOrientation, {
  onError: (error: unknown, op: "lock" | "unlock") => void [error, op],
});
export const orientation: () => Orientation = () => useOrientation();
export const metrics: () => WindowMetrics = () => useWindowMetrics();
