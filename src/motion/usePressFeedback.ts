// src/motion/usePressFeedback.ts
//
// Press feedback for the press primitive (Touchable, E4-03). There is deliberately no PressableScale component: the
// hook returns an animated style and press handlers that Touchable (or any Pressable) spreads.
import { useCallback, useEffect, useRef } from "react";
import { motion, type MotionTokens } from "../tokens/motion.base.js";
import { useAnimate } from "./animate.js";
import type { MotionHandle, MotionValue } from "./engine.js";
import { useAnimatedValue } from "./useAnimatedValue.js";
import { useMotionPreference } from "./useMotionPreference.js";

export interface PressFeedbackOptions {
  /** Scale while pressed. Default `motion.scale.press` (0.97). `false` turns the scale off. Ignored under reduced motion. */
  scale?: number | false;
  /** Opacity while pressed. Default 0.85. Pass `theme.opacity.pressed` to follow the theme. */
  opacity?: number;
  /** Semantic state-layer color (for example `theme.semantic.action.primaryActive`) used as the Android ripple color. */
  stateLayer?: string;
  /** Disables all feedback: no animation, no ripple, inert handlers. */
  disabled?: boolean;
  /** Tokens to resolve the animation from (pass `theme.motion`). */
  tokens?: MotionTokens;
}

export interface PressFeedbackStyle {
  opacity: MotionValue;
  /** Absent under reduced motion (opacity only) and when `scale` is `false`. */
  transform?: [{ scale: MotionValue }];
}

export interface PressFeedback {
  /** Animated style to put on the pressable (`Animated.View` style or the pressable's style when its engine supports it). */
  style: PressFeedbackStyle;
  /** Spread on the pressable. */
  handlers: { onPressIn: () => void; onPressOut: () => void };
  /** The `android_ripple` prop, present when a `stateLayer` is given and feedback is enabled. */
  android_ripple?: { color: string; borderless: false };
}

const DEFAULT_PRESSED_OPACITY = 0.85;

/**
 * Press feedback driven by the motion tokens and the reduced-motion preference. Pressing in animates the scale to
 * `scale` and the opacity to `opacity` (duration `fast`); releasing returns both to 1 (duration `base`). Under reduced
 * motion only the opacity changes, without an animation. A disabled pressable gets no feedback at all.
 */
export function usePressFeedback(options: PressFeedbackOptions = {}): PressFeedback {
  const { scale: scaleOption, opacity: opacityOption, stateLayer, disabled = false, tokens } = options;
  const reduceMotion = useMotionPreference();
  const run = useAnimate(tokens);
  const scaleValue = useAnimatedValue(1);
  const opacityValue = useAnimatedValue(1);
  const running = useRef<MotionHandle[]>([]);

  // Invalid numbers (NaN, infinite, outside 0..1) fall back to the defaults instead of reaching a native-driven value.
  const validUnit = (n: unknown): n is number => typeof n === "number" && Number.isFinite(n) && n > 0 && n <= 1;
  const defaultScale = (tokens ?? motion).scale.press;
  const pressedScale = scaleOption === false ? 1 : validUnit(scaleOption) ? scaleOption : defaultScale;
  const pressedOpacity = validUnit(opacityOption) ? opacityOption : DEFAULT_PRESSED_OPACITY;

  const stopRunning = useCallback(() => {
    for (const handle of running.current) handle.stop();
    running.current = [];
  }, []);

  const go = useCallback(
    (toScale: number, toOpacity: number, duration: "fast" | "base") => {
      stopRunning();
      const handles: MotionHandle[] = [];
      if (!reduceMotion && pressedScale !== 1) handles.push(run(scaleValue, toScale, { duration, property: "scale" }));
      handles.push(run(opacityValue, toOpacity, { duration, property: "opacity" }));
      running.current = handles;
      for (const handle of handles) handle.start();
    },
    [stopRunning, reduceMotion, pressedScale, run, scaleValue, opacityValue]
  );

  // Never leave an animation running (possibly on the native side) after the component is gone.
  useEffect(() => stopRunning, [stopRunning]);

  // A control that becomes disabled while pressed, or switches to reduced motion while pressed, returns to rest at once:
  // otherwise it keeps the pressed look (the release handler is inert when disabled and the scale is no longer animated).
  useEffect(() => {
    if (!disabled && !reduceMotion) return;
    stopRunning();
    scaleValue.setValue(1);
    if (disabled) opacityValue.setValue(1);
  }, [disabled, reduceMotion, stopRunning, scaleValue, opacityValue]);

  const onPressIn = useCallback(() => {
    if (!disabled) go(pressedScale, pressedOpacity, "fast");
  }, [disabled, go, pressedScale, pressedOpacity]);

  const onPressOut = useCallback(() => {
    if (!disabled) go(1, 1, "base");
  }, [disabled, go]);

  const style: PressFeedbackStyle = { opacity: opacityValue };
  if (!reduceMotion && pressedScale !== 1) style.transform = [{ scale: scaleValue }];

  const result: PressFeedback = { style, handlers: { onPressIn, onPressOut } };
  if (stateLayer !== undefined && !disabled) result.android_ripple = { color: stateLayer, borderless: false };
  return result;
}
