// Web fallback: `navigator.vibrate` when the browser has it. No native package.
import type { HapticsApi } from "../core/types.js";

/** The slice of `navigator` the web mapping needs. */
export interface VibrateNavigator {
  vibrate?(pattern: number | number[]): boolean;
}

const PULSE = { light: 10, medium: 20, heavy: 40 } as const;
const NOTIFICATION = { success: [10, 40, 10], warning: [20, 40, 20], error: [30, 40, 30, 40, 30] } as const;

/** Vibration patterns for each semantic call (milliseconds). */
export function createWebHaptics(nav: VibrateNavigator): HapticsApi {
  const vibrate = async (pattern: number | number[]) => void nav.vibrate?.(pattern);
  return {
    impact: (style = "medium") => vibrate(PULSE[style]),
    notification: (type) => vibrate([...NOTIFICATION[type]]),
    selection: () => vibrate(5),
  };
}

/** The web api when `navigator.vibrate` exists, else `undefined`. */
export function resolveWebHaptics(): HapticsApi | undefined {
  const nav = (globalThis as { navigator?: VibrateNavigator }).navigator;
  return nav && typeof nav.vibrate === "function" ? createWebHaptics(nav) : undefined;
}
