// A ring progress indicator built from plain Views: no svg, no native module (PLRNUI-407).
import React, { useContext, useEffect } from "react";
import * as ReactNative from "react-native";
import { View, type StyleProp, type ViewStyle } from "react-native";
import { useAnimate } from "../../motion/animate.js";
import { getDefaultEngine } from "../../motion/engine.js";
import { MotionContext } from "../../motion/MotionProvider.js";
import { useAnimatedValue } from "../../motion/useAnimatedValue.js";
import { useMotionPreference } from "../../motion/useMotionPreference.js";
import { useTheme } from "../../theme/useTheme.js";
import { useVariants } from "../../theme/useVariants.js";
import { Text } from "../Text/Text.js";
import { circularProgressVariants } from "./circularProgress.variants.js";

export type CircularProgressSize = "xs" | "sm" | "md" | "lg";
export type CircularProgressTone = "primary" | "info" | "success" | "warning" | "danger";

export interface CircularProgressProps {
  /** 0–100; clamped. `undefined` (or not finite) renders an empty ring, unless `indeterminate`. */
  progress?: number;
  /** Unknown duration: a ring segment rotates continuously (a static segment under reduced motion). `progress` is ignored. */
  indeterminate?: boolean;
  /** Diameter: `xs` 20, `sm` 32, `md` 48 (default), `lg` 64. */
  size?: CircularProgressSize;
  /** Ring width in points. Default: one tenth of the diameter, at least 2. */
  thickness?: number;
  /** Colour of the progress arc. Default `"primary"`. */
  tone?: CircularProgressTone;
  /** Content shown in the centre, for example a percentage. Text children are styled; nodes are rendered as given. */
  label?: React.ReactNode;
  /** Announced by assistive technology. */
  accessibilityLabel?: string;
  style?: StyleProp<ViewStyle>;
  testID?: string;
}

const MIN = 0;
const MAX = 100;
const DIAMETER: Record<CircularProgressSize, number> = { xs: 20, sm: 32, md: 48, lg: 64 };
const LABEL_SIZE: Record<CircularProgressSize, "xs" | "sm" | "md"> = { xs: "xs", sm: "xs", md: "sm", lg: "md" };
/** Duration of one turn of the indeterminate ring, in milliseconds. */
const TURN_MS = 1000;
const LINEAR = [0, 0, 1, 1] as const;

type AnimatedViewType = React.ComponentType<{ style?: unknown; children?: React.ReactNode }>;
function animatedView(): AnimatedViewType | undefined {
  return (ReactNative as unknown as { Animated?: { View?: AnimatedViewType } }).Animated?.View;
}

export function CircularProgress({
  progress,
  indeterminate = false,
  size = "md",
  thickness,
  tone = "primary",
  label,
  accessibilityLabel,
  style,
  testID,
}: CircularProgressProps) {
  const styles = useVariants(circularProgressVariants, { tone });
  const diameter = DIAMETER[size];
  const width = thickness !== undefined && Number.isFinite(thickness) && thickness > 0 ? Math.min(thickness, diameter / 2) : Math.max(2, Math.round(diameter / 10));

  const ring = { position: "absolute" as const, top: 0, left: 0, width: diameter, height: diameter, borderRadius: diameter / 2, borderWidth: width };
  const root: StyleProp<ViewStyle> = [{ width: diameter, height: diameter, alignItems: "center", justifyContent: "center" }, style];

  const centre = label === undefined || label === null || label === false ? null : (
    <View style={{ alignItems: "center", justifyContent: "center" }}>
      {typeof label === "string" || typeof label === "number" ? <Text size={LABEL_SIZE[size]} style={styles.label}>
          {label}
        </Text> : label}
    </View>
  );

  if (indeterminate) {
    return (
      <View accessible accessibilityRole="progressbar" accessibilityLabel={accessibilityLabel} accessibilityState={{ busy: true }} style={root} testID={testID}>
        <View style={[ring, styles.track]} />
        <Spinning ringStyle={[ring, styles.arc]} />
        {centre}
      </View>
    );
  }

  const now = progress === undefined || !Number.isFinite(progress) ? MIN : Math.min(Math.max(progress, MIN), MAX);
  const angle = (now / MAX) * 360;
  // The arc ring colours its top and right borders: a 180 degree span that starts at -45 + rotation. Each half is clipped
  // to its own side of the ring, so the right half shows [0, min(angle, 180)] and the left half [180, angle].
  const rightRotation = Math.min(angle, 180) - 135;
  const leftRotation = Math.max(angle, 180) - 495;
  const half = { position: "absolute" as const, top: 0, width: diameter / 2, height: diameter, overflow: "hidden" as const };

  return (
    <View
      accessible
      accessibilityRole="progressbar"
      accessibilityLabel={accessibilityLabel}
      accessibilityValue={{ min: MIN, max: MAX, now }}
      style={root}
      testID={testID}
    >
      <View style={[ring, styles.track]} />
      <View style={[half, { left: diameter / 2 }]} testID={testID ? `${testID}-right` : undefined}>
        <View style={[ring, styles.arc, { left: -diameter / 2, transform: [{ rotate: `${rightRotation}deg` }] }]} />
      </View>
      <View style={[half, { left: 0 }]} testID={testID ? `${testID}-left` : undefined}>
        <View style={[ring, styles.arc, { left: 0, transform: [{ rotate: `${leftRotation}deg` }] }]} />
      </View>
      {centre}
    </View>
  );
}

/** The indeterminate arc: a quarter-turn-wide segment of the ring rotating forever on the native driver. */
function Spinning({ ringStyle }: { ringStyle: StyleProp<ViewStyle> }) {
  const { theme } = useTheme();
  const reduceMotion = useMotionPreference();
  const run = useAnimate(theme.motion);
  const engine = useContext(MotionContext).engine ?? getDefaultEngine();
  const turn = useAnimatedValue(0);

  useEffect(() => {
    if (reduceMotion) return;
    turn.setValue(0);
    const looped = engine.loop(run(turn, 360, { duration: TURN_MS, easing: LINEAR as unknown as [number, number, number, number], property: "rotate", useNativeDriver: true }));
    looped.start();
    return () => {
      looped.stop();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [reduceMotion]);

  const AnimatedView = animatedView();
  const interpolate = (turn as unknown as { interpolate?: (c: { inputRange: number[]; outputRange: string[] }) => unknown }).interpolate;
  if (reduceMotion || !AnimatedView || typeof interpolate !== "function") {
    // A static segment: no motion to follow, still obviously "in progress".
    return <View style={ringStyle} />;
  }
  const rotate = interpolate.call(turn, { inputRange: [0, 360], outputRange: ["0deg", "360deg"] });
  return <AnimatedView style={[ringStyle, { transform: [{ rotate }] }]} />;
}
