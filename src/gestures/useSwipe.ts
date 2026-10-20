// src/gestures/useSwipe.ts
// JS-only swipe detection on React Native's PanResponder (works in Expo Go and on web). Imports only react and react-native.

import { useMemo, useRef } from "react";
import * as ReactNative from "react-native";

export type SwipeDirection = "left" | "right" | "up" | "down";

/** Which axis the gesture may claim. `"horizontal"` never claims a vertical move, so vertical scrolling keeps working. */
export type SwipeDirectionLock = "none" | "horizontal" | "vertical";

export interface UseSwipeOptions {
  onSwipeLeft?: () => void;
  onSwipeRight?: () => void;
  onSwipeUp?: () => void;
  onSwipeDown?: () => void;
  /** Minimum travel in points along the swipe axis. Default 48. */
  threshold?: number;
  /** Minimum speed in points per millisecond that completes a swipe shorter than the threshold. Default: disabled. */
  velocity?: number;
  /** Restricts the gesture to one axis. Default `"none"`. */
  directionLock?: SwipeDirectionLock;
  /** Turns the gesture off without unmounting. Default false. */
  disabled?: boolean;
}

export interface SwipeHandlers {
  onStartShouldSetResponder?: unknown;
  onMoveShouldSetResponder?: unknown;
  onResponderGrant?: unknown;
  onResponderMove?: unknown;
  onResponderRelease?: unknown;
  onResponderTerminate?: unknown;
  onResponderTerminationRequest?: unknown;
  [key: string]: unknown;
}

export interface UseSwipeResult {
  /** Spread on the view that receives the gesture. */
  panHandlers: SwipeHandlers;
}

/** The part of PanResponder's gesture state this hook reads. */
export interface SwipeGestureState {
  dx: number;
  dy: number;
  vx: number;
  vy: number;
}

export const DEFAULT_SWIPE_THRESHOLD = 48;

/** Movement before the gesture claims the responder, so a tap is never taken. */
const CLAIM_DISTANCE = 8;

/** @internal The PanResponder config; exported for tests only, not part of the public API. */
export function createSwipeConfig(read: () => UseSwipeOptions): Record<string, unknown> {
  // Wins only when the swipe axis is allowed by the lock.
  const axisAllowed = (axis: "x" | "y"): boolean => {
    const lock = read().directionLock ?? "none";
    return lock === "none" || (lock === "horizontal" ? axis === "x" : axis === "y");
  };
  return {
    onStartShouldSetPanResponder: () => false,
    onMoveShouldSetPanResponder: (_e: unknown, g: SwipeGestureState) => {
      if (read().disabled) return false;
      const ax = Math.abs(g.dx);
      const ay = Math.abs(g.dy);
      if (ax >= ay) return axisAllowed("x") && ax > CLAIM_DISTANCE;
      return axisAllowed("y") && ay > CLAIM_DISTANCE;
    },
    onPanResponderRelease: (_e: unknown, g: SwipeGestureState) => {
      const o = read();
      if (o.disabled) return;
      const horizontal = Math.abs(g.dx) >= Math.abs(g.dy);
      if (!axisAllowed(horizontal ? "x" : "y")) return;
      const distance = horizontal ? g.dx : g.dy;
      const speed = Math.abs(horizontal ? g.vx : g.vy);
      const threshold = o.threshold ?? DEFAULT_SWIPE_THRESHOLD;
      const far = Math.abs(distance) >= threshold;
      const fast = o.velocity !== undefined && speed >= o.velocity && Math.abs(distance) > CLAIM_DISTANCE;
      if (!far && !fast) return;
      const callback = horizontal
        ? distance < 0 ? o.onSwipeLeft : o.onSwipeRight
        : distance < 0 ? o.onSwipeUp : o.onSwipeDown;
      callback?.();
    },
  };
}

/** Detects left/right/up/down swipes with `PanResponder`. Spread `panHandlers` on a View. Each gesture fires at most one callback, once, on release. */
export function useSwipe(options: UseSwipeOptions = {}): UseSwipeResult {
  const latest = useRef(options);
  latest.current = options;
  const panHandlers = useMemo(
    () => ReactNative.PanResponder.create(createSwipeConfig(() => latest.current) as never).panHandlers as SwipeHandlers,
    []
  );
  return { panHandlers };
}
