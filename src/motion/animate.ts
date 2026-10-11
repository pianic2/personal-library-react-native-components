// src/motion/animate.ts
import { useCallback, useContext, useMemo } from "react";
import * as ReactNative from "react-native";
import { motion, toEasing, type CubicBezier, type MotionEasingName, type MotionTokens } from "../tokens/motion.base.js";
import { createDefaultEngine, type MotionEngine, type MotionHandle, type MotionValue } from "./engine.js";
import { MotionContext } from "./MotionProvider.js";
import { useMotionPreference } from "./useMotionPreference.js";

export type MotionDurationName = keyof MotionTokens["duration"];
export type MotionSpringName = keyof MotionTokens["spring"];

export interface AnimateOptions {
  /** A duration token name (`"base"`) or milliseconds. Ignored when `spring` is set. Default `"base"`. */
  duration?: MotionDurationName | number;
  /** An easing token name or a cubic-bezier tuple. Default `"standard"`. Ignored when `spring` is set. */
  easing?: MotionEasingName | CubicBezier;
  /** Animates with this spring token instead of a timing curve. */
  spring?: MotionSpringName;
  /** The style property being animated; the native driver is only used for `opacity` and transforms. */
  property?: string;
  /** Asks for the native driver (default true); still forced off on web and for properties it cannot drive. */
  useNativeDriver?: boolean;
  /** Reduced motion: the value jumps to `to` synchronously and the handle reports `finished: true` on start. */
  reduceMotion?: boolean;
  /** Tokens to resolve names from (pass `theme.motion`); defaults to the base tokens. */
  tokens?: MotionTokens;
  /** The engine to run on; defaults to the `Animated` engine. */
  engine?: MotionEngine;
}

const NATIVE_DRIVER_PROPERTIES = new Set([
  "opacity",
  "transform",
  "translateX",
  "translateY",
  "scale",
  "scaleX",
  "scaleY",
  "rotate",
  "rotateX",
  "rotateY",
  "rotateZ",
  "perspective",
  "skewX",
  "skewY",
]);

/**
 * Whether the native driver may be used: off on web (where it only logs a warning), off for properties it cannot drive
 * (layout properties such as `width`), otherwise the caller's wish (default on).
 */
export function resolveUseNativeDriver(options: Pick<AnimateOptions, "useNativeDriver" | "property">, platformOS?: string): boolean {
  if (platformOS === "web") return false;
  if (options.property !== undefined && !NATIVE_DRIVER_PROPERTIES.has(options.property)) return false;
  return options.useNativeDriver ?? true;
}

let defaultEngine: MotionEngine | undefined;
function getDefaultEngine(): MotionEngine {
  defaultEngine ??= createDefaultEngine();
  return defaultEngine;
}

function platformOS(): string | undefined {
  return (ReactNative as unknown as { Platform?: { OS?: string } }).Platform?.OS;
}

/**
 * Animates `value` to `to`. Durations, easings and springs come from the motion tokens. The returned handle is not
 * started: call `handle.start(onEnd?)`. With `reduceMotion` the value is set to `to` immediately (synchronously, before
 * `start`) and `start` only reports the end.
 */
export function animate(value: MotionValue, to: number, options: AnimateOptions = {}): MotionHandle {
  const engine = options.engine ?? getDefaultEngine();
  const tokens = options.tokens ?? motion;

  if (options.reduceMotion === true) {
    value.setValue(to);
    let done = false;
    return {
      start(onEnd) {
        if (done) return;
        done = true;
        onEnd?.({ finished: true });
      },
      stop() {
        done = true;
      },
    };
  }

  const useNativeDriver = resolveUseNativeDriver(options, platformOS());
  if (options.spring !== undefined) {
    const spring = tokens.spring[options.spring];
    if (!spring) throw new RangeError(`animate: unknown spring token "${String(options.spring)}"`);
    return engine.spring(value, to, { stiffness: spring.stiffness, damping: spring.damping, mass: spring.mass, useNativeDriver });
  }

  const durationOption = options.duration ?? "base";
  const duration = typeof durationOption === "number" ? durationOption : tokens.duration[durationOption];
  if (typeof duration !== "number" || !(duration >= 0)) throw new RangeError(`animate: invalid duration "${String(durationOption)}"`);
  const easingOption = options.easing ?? "standard";
  const easingTuple = typeof easingOption === "string" ? tokens.easing[easingOption] : easingOption;
  if (!easingTuple) throw new RangeError(`animate: unknown easing token "${String(easingOption)}"`);
  return engine.timing(value, to, { duration, easing: toEasing(easingTuple), useNativeDriver });
}

/**
 * `animate` bound to the engine of the nearest `MotionProvider` and to the reduced-motion preference
 * (`useMotionPreference`). Pass `theme.motion` as `tokens` to honour theme overrides.
 */
export function useAnimate(tokens?: MotionTokens): (value: MotionValue, to: number, options?: AnimateOptions) => MotionHandle {
  const { engine } = useContext(MotionContext);
  const reduceMotion = useMotionPreference();
  const resolved = useMemo(() => engine ?? getDefaultEngine(), [engine]);
  return useCallback(
    (value, to, options = {}) => animate(value, to, { tokens, engine: resolved, reduceMotion, ...options }),
    [tokens, resolved, reduceMotion]
  );
}
