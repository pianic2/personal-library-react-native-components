// ui/components/form/Switch.tsx

import React, { useEffect, useRef } from "react";
import * as ReactNative from "react-native";
import { Pressable, View } from "react-native";
import { useAnimate } from "../../motion/animate.js";
import { useAnimatedValue } from "../../motion/useAnimatedValue.js";
import { useTheme } from "../../theme/useTheme.js";
import { Text } from "../Text/Text.js";

export interface SwitchProps { value: boolean; onChange: (v: boolean) => void; label?: string; disabled?: boolean; }

// Typed constants instead of inline numbers: touch target, track, thumb, padding and the disabled opacity.
const TOUCH_TARGET = 44;
const TRACK_WIDTH = 44;
const TRACK_HEIGHT = 24;
const THUMB = 20;
const TRACK_PADDING = 2;
const DISABLED_OPACITY = 0.5;
/** How far the thumb travels between the off and the on position. */
const THUMB_TRAVEL = TRACK_WIDTH - THUMB - 2 * TRACK_PADDING;

type AnimatedViewType = React.ComponentType<{ style?: unknown }>;
function animatedView(): AnimatedViewType | undefined {
  return (ReactNative as unknown as { Animated?: { View?: AnimatedViewType } }).Animated?.View;
}

export function Switch({ value, onChange, label, disabled = false }: SwitchProps) {
  const { theme, colors } = useTheme();
  const run = useAnimate(theme.motion);
  const offset = useAnimatedValue(value ? THUMB_TRAVEL : 0);
  const previous = useRef(value);

  // The thumb slides to its new position when `value` changes; reduced motion makes `run` jump instead (useAnimate).
  useEffect(() => {
    if (previous.current === value) return;
    previous.current = value;
    const handle = run(offset, value ? THUMB_TRAVEL : 0, { duration: "fast", property: "translateX" });
    handle.start();
    return () => handle.stop();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [value]);

  const thumbStyle = { width: THUMB, height: THUMB, borderRadius: THUMB, backgroundColor: colors.surface };
  const AnimatedView = animatedView();

  return (
    <Pressable
      accessibilityRole="switch"
      accessibilityLabel={label}
      accessibilityState={{ checked: value, disabled }}
      disabled={disabled}
      onPress={() => onChange(!value)}
      style={{ flexDirection: "row", alignItems: "center", minWidth: TOUCH_TARGET, minHeight: TOUCH_TARGET, opacity: disabled ? DISABLED_OPACITY : 1 }}
    >
      <View style={{ width: TRACK_WIDTH, height: TRACK_HEIGHT, borderRadius: TRACK_HEIGHT, backgroundColor: value ? colors.primary : colors.border, padding: TRACK_PADDING }}>
        {AnimatedView ? (
          <AnimatedView style={[thumbStyle, { transform: [{ translateX: offset }] }]} />
        ) : (
          // No `Animated` (SSR, test shim): the thumb snaps.
          <View style={[thumbStyle, { transform: [{ translateX: value ? THUMB_TRAVEL : 0 }] }]} />
        )}
      </View>
      {label && <Text style={{ marginLeft: theme.space.sm }}>{label}</Text>}
    </Pressable>
  );
}
