// src/motion/useShimmer.ts
//
// The shimmer animation for Skeleton (E6-21 owns the component). JS-only: the hook returns one animated value that sweeps
// from `from` to `to` and restarts, and the consumer maps it to opacity or translate. No gradient dependency.
import { useContext, useEffect } from "react";
import type { MotionEasingName, MotionTokens } from "../tokens/motion.base.js";
import { animate, type MotionDurationName } from "./animate.js";
import { getDefaultEngine, type MotionValue } from "./engine.js";
import { MotionContext } from "./MotionProvider.js";
import { useAnimatedValue } from "./useAnimatedValue.js";
import { useMotionPreference } from "./useMotionPreference.js";

export interface ShimmerOptions {
  /** Value at the start of every sweep. Default 0. */
  from?: number;
  /** Value at the end of every sweep. Default 1. Also the static value under reduced motion. */
  to?: number;
  /** A duration token name or milliseconds for one sweep. Default `"slower"`. */
  duration?: MotionDurationName | number;
  /** An easing token name. Default `"standard"`. */
  easing?: MotionEasingName;
  /** The style property the value drives; the native driver is used for opacity and transforms only. Default `"opacity"`. */
  property?: string;
  /** Tokens to resolve names from (pass `theme.motion`). */
  tokens?: MotionTokens;
}

const finiteOr = (n: unknown, fallback: number): number => (typeof n === "number" && Number.isFinite(n) ? n : fallback);

/**
 * A looping value for skeleton shimmer. It sweeps `from` → `to` over `duration` and restarts until the component unmounts.
 * Under reduced motion (system setting or `MotionProvider`) the value stays at `to` and the engine is never asked to run
 * an animation. The engine is the one of the nearest `MotionProvider` (default: the `Animated` engine). An unknown
 * duration or easing token throws a `RangeError`, as `animate()` does.
 */
export function useShimmer(options: ShimmerOptions = {}): MotionValue {
  const { property = "opacity", tokens, easing = "standard", duration = "slower" } = options;
  const from = finiteOr(options.from, 0);
  const to = finiteOr(options.to, 1);
  const reduceMotion = useMotionPreference();
  const { engine: providerEngine } = useContext(MotionContext);
  const value = useAnimatedValue(reduceMotion ? to : from);

  useEffect(() => {
    if (reduceMotion) {
      value.setValue(to);
      return undefined;
    }
    const engine = providerEngine ?? getDefaultEngine();
    value.setValue(from);
    const sweep = animate(value, to, { duration, easing, property, tokens, engine });
    const loop = engine.loop(sweep, { iterations: -1 });
    loop.start();
    return () => {
      loop.stop();
      engine.stop(value);
    };
  }, [reduceMotion, providerEngine, value, from, to, duration, easing, property, tokens]);

  return value;
}
