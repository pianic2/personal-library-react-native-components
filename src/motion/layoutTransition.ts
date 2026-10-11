// src/motion/layoutTransition.ts
//
// Layout transitions over React Native's `LayoutAnimation`, with the durations and the spring of the motion tokens.
//
// Behaviour per platform (what the code does; the device behaviour of RN 0.86 was NOT verified on hardware, only against
// mocks in tests/motion/layout-transition.test.tsx):
// - iOS: `LayoutAnimation.configureNext` is called with the preset configuration.
// - Android: the same call. Before the first call the legacy switch
//   `UIManager.setLayoutAnimationEnabledExperimental(true)` is invoked once when it exists and the New Architecture is not
//   active (`globalThis.nativeFabricUIManager` is undefined). Under the New Architecture the flag is a no-op and layout
//   animations are on, so it is not called; a missing method never throws.
// - Web: nothing happens (React Native Web has no `LayoutAnimation`; use CSS transitions).
// - Reduced motion (`useMotionPreference()` true): nothing happens, the layout snaps.
// - A missing `LayoutAnimation`, a missing `configureNext` or a throwing `configureNext` is swallowed: the layout change
//   still happens, without animation.
import { useCallback } from "react";
import * as ReactNative from "react-native";
import { motion } from "../tokens/motion.base.js";
import { useMotionPreference } from "./useMotionPreference.js";

export type LayoutPreset = "ease" | "spring" | "fade";

interface LayoutAnimationType {
  type: string;
  property?: string;
  springDamping?: number;
  delay?: number;
  duration?: number;
}

export interface LayoutAnimationConfig {
  duration: number;
  create?: LayoutAnimationType;
  update?: LayoutAnimationType;
  delete?: LayoutAnimationType;
}

/** The slice of React Native used here, injectable for tests and previews. */
export interface LayoutTransitionHost {
  LayoutAnimation?: { configureNext?(config: LayoutAnimationConfig, onAnimationDidEnd?: () => void): void };
  UIManager?: { setLayoutAnimationEnabledExperimental?(enabled: boolean): void };
  Platform?: { OS?: string };
}

export interface LayoutTransitionOptions {
  /** Forces the reduced-motion state (the hook passes the motion preference). */
  reduceMotion?: boolean;
  /** Replaces the React Native members; defaults to the real module. */
  host?: LayoutTransitionHost;
}

// Damping ratio of a spring token: damping / (2 * sqrt(stiffness * mass)), clamped to LayoutAnimation's 0..1 range.
const springRatio = (() => {
  const { stiffness, damping, mass } = motion.spring.gentle;
  return Math.min(1, damping / (2 * Math.sqrt(stiffness * mass)));
})();

/** The `LayoutAnimation.configureNext` configuration of a preset, built from the motion tokens. */
export function layoutConfigFor(preset: LayoutPreset): LayoutAnimationConfig {
  switch (preset) {
    case "spring":
      return {
        duration: motion.duration.slow,
        create: { type: "spring", property: "scaleXY", springDamping: springRatio },
        update: { type: "spring", springDamping: springRatio },
        delete: { type: "spring", property: "opacity", springDamping: springRatio },
      };
    case "fade":
      return {
        duration: motion.duration.fast,
        create: { type: "linear", property: "opacity" },
        update: { type: "linear" },
        delete: { type: "linear", property: "opacity" },
      };
    case "ease":
    default:
      return {
        duration: motion.duration.base,
        create: { type: "easeInEaseOut", property: "opacity" },
        update: { type: "easeInEaseOut" },
        delete: { type: "easeInEaseOut", property: "opacity" },
      };
  }
}

const enabledOn = new WeakSet<object>();

function enableAndroidFlag(host: LayoutTransitionHost): void {
  const ui = host.UIManager;
  if (!ui || typeof ui.setLayoutAnimationEnabledExperimental !== "function" || enabledOn.has(ui)) return;
  enabledOn.add(ui);
  if ((globalThis as { nativeFabricUIManager?: unknown }).nativeFabricUIManager !== undefined) return;
  try {
    ui.setLayoutAnimationEnabledExperimental(true);
  } catch {
    // an old or stripped UIManager: layout animations stay as they are
  }
}

/**
 * Animates the layout change that happens in the same frame. Call it right before the state update. Returns true when a
 * transition was scheduled, false when it was skipped (reduced motion, web, no LayoutAnimation) or failed; never throws.
 */
export function animateNextLayout(preset: LayoutPreset, options: LayoutTransitionOptions = {}): boolean {
  if (options.reduceMotion === true) return false;
  const host = options.host ?? (ReactNative as unknown as LayoutTransitionHost);
  try {
    if (host.Platform?.OS === "web") return false;
    const configureNext = host.LayoutAnimation?.configureNext;
    if (typeof configureNext !== "function") return false;
    if (host.Platform?.OS === "android") enableAndroidFlag(host);
    configureNext.call(host.LayoutAnimation, layoutConfigFor(preset));
    return true;
  } catch {
    return false;
  }
}

/**
 * Returns `(preset, update) => void`: schedules the layout transition of `preset` (unless motion is reduced) and then
 * runs `update`, the state change that causes the layout change. `update` always runs.
 */
export function useLayoutTransition(options: Pick<LayoutTransitionOptions, "host"> = {}): (preset: LayoutPreset, update: () => void) => void {
  const reduceMotion = useMotionPreference();
  const host = options.host;
  return useCallback(
    (preset, update) => {
      animateNextLayout(preset, { reduceMotion, host });
      update();
    },
    [reduceMotion, host]
  );
}
