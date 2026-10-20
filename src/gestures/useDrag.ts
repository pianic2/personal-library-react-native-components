// src/gestures/useDrag.ts
//
// A drag primitive: tracks a pan gesture on one or both axes, clamps it to bounds and, on release, springs to the nearest
// snap point (spring token from the motion tokens). Reduced motion snaps without animation. No new dependency: the
// default gesture source is React Native's `PanResponder`; the `gesture` controller drives the same logic directly.
import { useMemo, useRef } from "react";
import * as ReactNative from "react-native";
import { useAnimate, type MotionSpringName } from "../motion/animate.js";
import type { MotionHandle, MotionValue } from "../motion/engine.js";
import { useAnimatedValue } from "../motion/useAnimatedValue.js";
import type { MotionTokens } from "../tokens/motion.base.js";

export type DragAxis = "x" | "y" | "both";

/** Inclusive limits of the translation, per side. A missing side is unbounded. */
export interface DragBounds {
  minX?: number;
  maxX?: number;
  minY?: number;
  maxY?: number;
}

/** A resting position. A missing coordinate keeps the current value on that axis. */
export interface DragPoint {
  x?: number;
  y?: number;
}

export interface DragPosition {
  x: number;
  y: number;
}

export interface UseDragOptions {
  /** Axis the drag moves along. The other axis ignores the gesture. Default `"both"`. */
  axis?: DragAxis;
  /** Limits of the translation; the drag is clamped to them. */
  bounds?: DragBounds;
  /** Resting positions. On release the drag settles on the nearest one. Without snap points it stays where it was released. */
  snapPoints?: readonly DragPoint[];
  /** Spring token used to settle. Default `"snappy"`. */
  spring?: MotionSpringName;
  /** Disables the gesture. */
  disabled?: boolean;
  /** Called once the drag has settled (after the spring, or at once under reduced motion). */
  onEnd?: (position: DragPosition) => void;
  /** Tokens to resolve the spring from (pass `theme.motion`). */
  tokens?: MotionTokens;
}

export interface DragGesture {
  /** Begins a drag from the current position and stops a running settle. */
  start(): void;
  /** Moves to the start position plus `(dx, dy)`, clamped to the bounds; `dy` is ignored for `axis: "x"`, `dx` for `"y"`. */
  move(dx: number, dy: number): void;
  /** Ends the drag and settles on the nearest snap point. */
  release(): void;
}

export interface UseDragResult {
  /** Animated translation values; put them in an `Animated.View` transform. */
  position: { x: MotionValue; y: MotionValue };
  /** `Animated.View` style that follows the drag. */
  style: { transform: [{ translateX: MotionValue }, { translateY: MotionValue }] };
  /** Spread on the dragged view. Empty when `PanResponder` is unavailable. */
  panHandlers: Record<string, unknown>;
  /** The gesture logic itself, for custom gesture sources. */
  gesture: DragGesture;
}

interface GestureStateLike {
  dx: number;
  dy: number;
}

interface PanResponderLike {
  create(config: Record<string, unknown>): { panHandlers: Record<string, unknown> };
}

const clamp = (n: number, min = -Infinity, max = Infinity): number => Math.min(Math.max(n, min), max);
const finite = (n: unknown): n is number => typeof n === "number" && Number.isFinite(n);
const MOVE_THRESHOLD = 2;

export function useDrag(options: UseDragOptions = {}): UseDragResult {
  const { axis = "both", bounds, snapPoints, spring = "snappy", disabled = false, onEnd, tokens } = options;
  const run = useAnimate(tokens);
  const x = useAnimatedValue(0);
  const y = useAnimatedValue(0);
  const rest = useRef<DragPosition>({ x: 0, y: 0 });
  const current = useRef<DragPosition>({ x: 0, y: 0 });
  const running = useRef<MotionHandle[]>([]);
  // Latest options, read by the stable gesture callbacks.
  const latest = useRef({ axis, bounds, snapPoints, spring, disabled, onEnd, run });
  latest.current = { axis, bounds, snapPoints, spring, disabled, onEnd, run };

  const gesture = useMemo<DragGesture>(() => {
    const limit = (value: number, axisName: "x" | "y"): number => {
      const b = latest.current.bounds;
      const min = axisName === "x" ? b?.minX : b?.minY;
      const max = axisName === "x" ? b?.maxX : b?.maxY;
      return clamp(value, finite(min) ? min : undefined, finite(max) ? max : undefined);
    };
    const stopRunning = () => {
      for (const handle of running.current) handle.stop();
      running.current = [];
    };
    return {
      start() {
        if (latest.current.disabled) return;
        stopRunning();
        rest.current = { ...current.current };
      },
      move(dx, dy) {
        const { axis: a, disabled: off } = latest.current;
        if (off) return;
        if (a !== "y" && finite(dx)) {
          current.current.x = limit(rest.current.x + dx, "x");
          x.setValue(current.current.x);
        }
        if (a !== "x" && finite(dy)) {
          current.current.y = limit(rest.current.y + dy, "y");
          y.setValue(current.current.y);
        }
      },
      release() {
        const { snapPoints: points, spring: springName, disabled: off, onEnd: done, run: animateTo, axis: a } = latest.current;
        if (off) return;
        stopRunning();
        let target: DragPosition = { ...current.current };
        if (points && points.length > 0) {
          let best = Infinity;
          for (const point of points) {
            const px = a !== "y" && finite(point.x) ? limit(point.x, "x") : current.current.x;
            const py = a !== "x" && finite(point.y) ? limit(point.y, "y") : current.current.y;
            const distance = Math.hypot(px - current.current.x, py - current.current.y);
            if (distance < best) {
              best = distance;
              target = { x: px, y: py };
            }
          }
        }
        rest.current = { ...target };
        current.current = { ...target };
        const handles = [animateTo(x, target.x, { spring: springName }), animateTo(y, target.y, { spring: springName })];
        running.current = handles;
        let pending = handles.length;
        let cancelled = false;
        for (const handle of handles)
          handle.start((result) => {
            if (cancelled || !result.finished) {
              cancelled = true;
              return;
            }
            pending -= 1;
            if (pending === 0) done?.({ ...target });
          });
      },
    };
  }, [x, y]);

  const panHandlers = useMemo<Record<string, unknown>>(() => {
    const pan = (ReactNative as unknown as { PanResponder?: PanResponderLike }).PanResponder;
    if (!pan || typeof pan.create !== "function") return {};
    return pan.create({
      onStartShouldSetPanResponder: () => !latest.current.disabled,
      onMoveShouldSetPanResponder: (_e: unknown, g: GestureStateLike) => {
        if (latest.current.disabled) return false;
        const { axis: a } = latest.current;
        const along = a === "x" ? Math.abs(g.dx) : a === "y" ? Math.abs(g.dy) : Math.max(Math.abs(g.dx), Math.abs(g.dy));
        return along > MOVE_THRESHOLD;
      },
      onPanResponderGrant: () => gesture.start(),
      onPanResponderMove: (_e: unknown, g: GestureStateLike) => gesture.move(g.dx, g.dy),
      onPanResponderRelease: () => gesture.release(),
      onPanResponderTerminate: () => gesture.release(),
    }).panHandlers;
  }, [gesture]);

  const style = useMemo(() => ({ transform: [{ translateX: x }, { translateY: y }] as [{ translateX: MotionValue }, { translateY: MotionValue }] }), [x, y]);
  const position = useMemo(() => ({ x, y }), [x, y]);
  return { position, style, panHandlers, gesture };
}
