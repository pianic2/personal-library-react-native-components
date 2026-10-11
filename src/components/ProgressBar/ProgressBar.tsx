// ui/components/feedback/ProgressBar.tsx

import React, { useContext, useEffect, useState } from "react";
import * as ReactNative from "react-native";
import { View, type DimensionValue, type LayoutChangeEvent } from "react-native";
import { useAnimate } from "../../motion/animate.js";
import { getDefaultEngine } from "../../motion/engine.js";
import { MotionContext } from "../../motion/MotionProvider.js";
import { useAnimatedValue } from "../../motion/useAnimatedValue.js";
import { useMotionPreference } from "../../motion/useMotionPreference.js";
import { useTheme } from "../../theme/useTheme.js";

type Tone = "primary" | "info" | "success" | "warning" | "danger";
type LegacyColor = "primary" | "info" | "success" | "warning" | "error";

export interface ProgressBarProps {
  /** 0–100; clamped. `undefined` (or not finite) renders an empty bar, unless `indeterminate`. */
  progress?: number;
  /** Colour of the fill. Default `"primary"`. */
  tone?: Tone;
  /** @deprecated Use `tone`. Kept as an alias; `tone` wins when both are set. */
  color?: LegacyColor;
  /** Unknown duration: a segment sweeps along the track (a static segment under reduced motion). `progress` is ignored. */
  indeterminate?: boolean;
  /** Announced by assistive technology. */
  accessibilityLabel?: string;
}

const MIN = 0;
const MAX = 100;
/** Share of the track the indeterminate segment covers, and the sweep time in milliseconds. */
const SEGMENT_RATIO = 0.4;
const SWEEP_MS = 1200;

type AnimatedViewType = React.ComponentType<{ style?: unknown; children?: React.ReactNode }>;
function animatedView(): AnimatedViewType | undefined {
  return (ReactNative as unknown as { Animated?: { View?: AnimatedViewType } }).Animated?.View;
}

export function ProgressBar({ progress, tone, color, indeterminate = false, accessibilityLabel }: ProgressBarProps) {
  const { theme, colors } = useTheme();
  // `danger` is the tone name (ADR 0014); the theme colour is called `error`, and so is the deprecated `color` value.
  const key = tone ? (tone === "danger" ? "error" : tone) : (color ?? "primary");
  const fill = colors[key];

  const track = {
    height: theme.space.sm,
    backgroundColor: colors.border,
    borderRadius: theme.radius.full,
    overflow: "hidden" as const,
  };

  if (indeterminate) {
    return <IndeterminateBar track={track} fill={fill} accessibilityLabel={accessibilityLabel} />;
  }

  const now = progress === undefined || !Number.isFinite(progress) ? MIN : Math.min(Math.max(progress, MIN), MAX);
  const width: DimensionValue = `${now}%`;

  return (
    <View
      accessible
      accessibilityRole="progressbar"
      accessibilityLabel={accessibilityLabel}
      accessibilityValue={{ min: MIN, max: MAX, now }}
      style={track}
    >
      <View style={{ width, height: "100%", backgroundColor: fill }} />
    </View>
  );
}

function IndeterminateBar({ track, fill, accessibilityLabel }: { track: object; fill: string; accessibilityLabel?: string }) {
  const { theme } = useTheme();
  const reduceMotion = useMotionPreference();
  const run = useAnimate(theme.motion);
  const engine = useContext(MotionContext).engine ?? getDefaultEngine();
  const offset = useAnimatedValue(0);
  const [trackWidth, setTrackWidth] = useState(0);

  const segment = trackWidth * SEGMENT_RATIO;

  useEffect(() => {
    if (reduceMotion || trackWidth === 0) return;
    // The segment travels from just outside the left edge to just outside the right edge, then the loop restarts it.
    offset.setValue(-segment);
    const sweep = run(offset, trackWidth, { duration: SWEEP_MS, easing: "standard", property: "translateX" });
    const looped = engine.loop(sweep);
    looped.start();
    return () => {
      looped.stop();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [reduceMotion, trackWidth]);

  const AnimatedView = animatedView();
  const onLayout = (e: LayoutChangeEvent) => setTrackWidth(e.nativeEvent.layout.width);
  const segmentStyle = { width: `${SEGMENT_RATIO * 100}%` as DimensionValue, height: "100%" as const, backgroundColor: fill };

  return (
    <View
      accessible
      accessibilityRole="progressbar"
      accessibilityLabel={accessibilityLabel}
      accessibilityState={{ busy: true }}
      onLayout={onLayout}
      style={track}
    >
      {reduceMotion || !AnimatedView ? (
        // A static segment: no motion to follow, still obviously "in progress".
        <View style={segmentStyle} />
      ) : (
        <AnimatedView style={[segmentStyle, { transform: [{ translateX: offset }] }]} />
      )}
    </View>
  );
}
