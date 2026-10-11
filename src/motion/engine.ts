// src/motion/engine.ts
//
// The animation engine behind `animate()`: a small interface plus a default implementation over React Native's `Animated`.
// An app or a test swaps it through the `engine` prop of `MotionProvider`. No `react-native-reanimated`.
import * as ReactNative from "react-native";

/** A value an engine can animate. The default engine returns `Animated.Value`s. */
export interface MotionValue {
  setValue(value: number): void;
}

export interface MotionEnd {
  finished: boolean;
}

/** A controllable animation. `start` may be called once per handle; `stop` is safe at any time. */
export interface MotionHandle {
  start(onEnd?: (result: MotionEnd) => void): void;
  stop(): void;
}

export interface TimingConfig {
  duration: number;
  easing: (t: number) => number;
  useNativeDriver: boolean;
}

export interface SpringConfig {
  stiffness: number;
  damping: number;
  mass: number;
  useNativeDriver: boolean;
}

export interface MotionEngine {
  createValue(initial: number): MotionValue;
  timing(value: MotionValue, to: number, config: TimingConfig): MotionHandle;
  spring(value: MotionValue, to: number, config: SpringConfig): MotionHandle;
  /** Repeats `handle`; `iterations` -1 (the default) repeats until stopped. */
  loop(handle: MotionHandle, config?: { iterations?: number }): MotionHandle;
  /** Stops whatever is running on `value`. */
  stop(value: MotionValue): void;
}

// The slice of React Native's Animated used here (all optional: SSR, the test shim and stripped builds have none).
interface AnimatedLike {
  Value?: new (initial: number) => MotionValue & { stopAnimation?(): void };
  timing?(value: unknown, config: Record<string, unknown>): { start(cb?: (r: MotionEnd) => void): void; stop(): void };
  spring?(value: unknown, config: Record<string, unknown>): { start(cb?: (r: MotionEnd) => void): void; stop(): void };
  loop?(animation: unknown, config?: Record<string, unknown>): { start(cb?: (r: MotionEnd) => void): void; stop(): void };
}

/** Jumps to the final value: no animation, `start` reports `finished: true` synchronously. Used when `Animated` is missing. */
export function createJumpEngine(): MotionEngine {
  const jump = (value: MotionValue, to: number): MotionHandle => {
    let done = false;
    return {
      start(onEnd) {
        if (done) return;
        done = true;
        value.setValue(to);
        onEnd?.({ finished: true });
      },
      stop() {
        done = true;
      },
    };
  };
  return {
    createValue(initial) {
      let current = initial;
      return {
        setValue(next) {
          current = next;
        },
        get value() {
          return current;
        },
      } as MotionValue;
    },
    timing: (value, to) => jump(value, to),
    spring: (value, to) => jump(value, to),
    loop: (handle) => handle,
    stop: () => undefined,
  };
}

/** The default engine over `Animated`; falls back to the jump engine when `Animated` (or its parts) is missing. */
export function createDefaultEngine(host?: { Animated?: AnimatedLike }): MotionEngine {
  const animated = (host ?? (ReactNative as unknown as { Animated?: AnimatedLike })).Animated;
  if (!animated || typeof animated.Value !== "function" || typeof animated.timing !== "function" || typeof animated.spring !== "function")
    return createJumpEngine();
  const A = animated as Required<Pick<AnimatedLike, "Value" | "timing" | "spring">> & AnimatedLike;
  return {
    createValue: (initial) => new A.Value(initial),
    timing: (value, to, config) => A.timing(value, { toValue: to, duration: config.duration, easing: config.easing, useNativeDriver: config.useNativeDriver }),
    spring: (value, to, config) =>
      A.spring(value, { toValue: to, stiffness: config.stiffness, damping: config.damping, mass: config.mass, useNativeDriver: config.useNativeDriver }),
    loop: (handle, config) => (typeof A.loop === "function" ? A.loop(handle, { iterations: config?.iterations ?? -1 }) : handle),
    stop: (value) => (value as { stopAnimation?: () => void }).stopAnimation?.(),
  };
}
