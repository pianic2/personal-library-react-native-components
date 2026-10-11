// src/motion/Presence.tsx
//
// Keeps its children mounted while an exit animation runs, then unmounts them. Built on `animate()` so durations, easings
// and springs come from the motion tokens and reduced motion is honoured.
import React, { useEffect, useRef, useState } from "react";
import * as ReactNative from "react-native";
import { View, type StyleProp, type ViewStyle } from "react-native";
import { motion, type MotionTokens } from "../tokens/motion.base.js";
import { useAnimate, type MotionDurationName, type MotionSpringName } from "./animate.js";
import type { MotionHandle, MotionValue } from "./engine.js";
import { isPresencePreset, presenceHidden, PRESENCE_VISIBLE, type PresencePreset, type PresenceValues } from "./presets.js";
import { useAnimatedValue } from "./useAnimatedValue.js";
import { useMotionPreference } from "./useMotionPreference.js";

export interface PresenceProps {
  /** Whether the children are shown. Going from `true` to `false` runs the exit and unmounts the children when it ends. */
  visible: boolean;
  /** Enter/exit preset. Default `"fade"`. `collapse` scales the height (a transform: it does not reflow siblings). */
  preset?: PresencePreset;
  /** Duration token name or milliseconds. Default `"base"` on enter and `"fast"` on exit. Ignored when `spring` is set. */
  duration?: MotionDurationName | number;
  /** Animates with this spring token instead of a timing curve. */
  spring?: MotionSpringName;
  /** Runs the enter animation on the first render too when `visible` starts as `true`. Default `false`. */
  appear?: boolean;
  /** Preset, duration, spring and the reduced-motion preference are read when `visible` changes; a running transition is not restarted by them. */
  /** Called once when an exit finishes and the children have been unmounted. Not called when the exit is interrupted. */
  onExited?: () => void;
  /** Pass `theme.motion` to follow theme overrides. */
  tokens?: MotionTokens;
  /** Style of the wrapper. */
  style?: StyleProp<ViewStyle>;
  children?: React.ReactNode;
}

type AnimatedViewType = React.ComponentType<{ style?: unknown; children?: React.ReactNode; pointerEvents?: "none" | "auto"; accessibilityElementsHidden?: boolean; importantForAccessibility?: "auto" | "no-hide-descendants" }>;

function animatedView(): AnimatedViewType | undefined {
  return (ReactNative as unknown as { Animated?: { View?: AnimatedViewType } }).Animated?.View;
}

const KEYS: Array<keyof PresenceValues> = ["opacity", "translateY", "scale", "scaleY"];

export function Presence({ visible, preset: presetProp = "fade", duration, spring, appear = false, onExited, tokens, style, children }: PresenceProps): React.ReactElement | null {
  const preset: PresencePreset = isPresencePreset(presetProp) ? presetProp : "fade";
  const resolvedTokens = tokens ?? motion;
  const reduceMotion = useMotionPreference();
  const run = useAnimate(tokens);

  const startHidden = presenceHidden(preset, resolvedTokens, reduceMotion);
  const initial = visible && !appear ? PRESENCE_VISIBLE : startHidden;
  const values: Record<keyof PresenceValues, MotionValue> = {
    opacity: useAnimatedValue(initial.opacity),
    translateY: useAnimatedValue(initial.translateY),
    scale: useAnimatedValue(initial.scale),
    scaleY: useAnimatedValue(initial.scaleY),
  };

  const [mounted, setMounted] = useState(visible);
  // Showing again mounts at once (during render), so the children never miss a frame.
  if (visible && !mounted) setMounted(true);

  const handles = useRef<MotionHandle[]>([]);
  const runId = useRef(0);
  const onExitedRef = useRef(onExited);
  onExitedRef.current = onExited;
  // The `visible` value the effect last acted on; `null` forces the next run (first render with `appear`, restart after StrictMode cleanup).
  const lastRun = useRef<boolean | null>(appear && visible ? null : visible);
  const inFlight = useRef(false);

  useEffect(() => {
    if (lastRun.current === visible) return;
    lastRun.current = visible;

    const id = ++runId.current;
    for (const h of handles.current) h.stop();
    handles.current = [];

    const target = visible ? PRESENCE_VISIBLE : presenceHidden(preset, resolvedTokens, reduceMotion);
    const options = reduceMotion
      ? { duration: 0 }
      : spring !== undefined
        ? { spring }
        : { duration: duration ?? (visible ? "base" : "fast"), easing: visible ? ("decelerate" as const) : ("accelerate" as const) };

    // Reduced motion: opacity only; the other properties jump (they are not rendered).
    const created = KEYS.map((key) => run(values[key], target[key], { ...options, tokens: resolvedTokens }));
    handles.current = created;
    let pending = created.length;
    inFlight.current = true;
    for (const handle of created) {
      handle.start((end) => {
        if (id !== runId.current) return;
        void end;
        pending -= 1;
        if (pending === 0) inFlight.current = false;
        // Whatever the engine reports for a run that is still current, an exit that ended must unmount (never stick mounted).
        if (pending === 0 && !visible) {
          setMounted(false);
          onExitedRef.current?.();
        }
      });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [visible]);

  useEffect(
    () => () => {
      runId.current += 1;
      for (const h of handles.current) h.stop();
      // A StrictMode re-run of the effect must restart a transition that this cleanup just cut off.
      if (inFlight.current) lastRun.current = null;
      inFlight.current = false;
    },
    []
  );

  if (!mounted) return null;

  const exiting = !visible;
  const transform: Array<Record<string, MotionValue>> = [];
  if (!reduceMotion) {
    if (preset === "slide-up" || preset === "slide-down") transform.push({ translateY: values.translateY });
    if (preset === "scale") transform.push({ scale: values.scale });
    if (preset === "collapse") transform.push({ scaleY: values.scaleY });
  }
  const a11y = exiting ? { accessibilityElementsHidden: true, importantForAccessibility: "no-hide-descendants" as const, pointerEvents: "none" as const } : {};

  const AnimatedView = animatedView();
  if (!AnimatedView) {
    // No `Animated` (SSR, test shim): the wrapper snaps to the current state.
    return (
      <View style={[style, { opacity: exiting ? 0 : 1 }]} {...a11y}>
        {children}
      </View>
    );
  }
  return (
    <AnimatedView style={[style, { opacity: values.opacity }, transform.length > 0 ? { transform } : undefined]} {...a11y}>
      {children}
    </AnimatedView>
  );
}
