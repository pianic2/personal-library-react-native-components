import React, { useEffect, useState } from "react";
import * as ReactNative from "react-native";
import { Platform, Pressable } from "react-native";
import type { AccessibilityRole, GestureResponderEvent, Insets, PressableProps, StyleProp, ViewStyle } from "react-native";
import { useMotionPreference } from "../../motion/useMotionPreference.js";
import { usePressFeedback } from "../../motion/usePressFeedback.js";
import { useHaptics } from "../../native/haptics/useHaptics.js";
import { useTheme } from "../../theme/useTheme.js";
import { Slot } from "../Slot/index.js";

export type TouchableFeedback = "opacity" | "scale" | "ripple" | "none";
export type TouchableRole = "button" | "link" | "tab" | "checkbox" | "radio" | "switch" | "menuitem";
export type TouchableHaptic = "light" | "medium" | false;

/** The state a function `style` receives. `disabled` is true while the Touchable is disabled or loading. */
export interface TouchableState {
  pressed: boolean;
  focused: boolean;
  disabled: boolean;
}

export interface TouchableProps {
  /** Pressable content. With `asChild` it is the single element that becomes the pressable. */
  children?: React.ReactNode;
  onPress?: (event: GestureResponderEvent) => void;
  onLongPress?: (event: GestureResponderEvent) => void;
  /** No presses, no feedback, no haptic; dimmed with `theme.components.button.opacity.disabled`. */
  disabled?: boolean;
  /** Blocks presses like `disabled` and reports `accessibilityState.busy`. Not dimmed. */
  loading?: boolean;
  /** Press feedback. `ripple` is the Android ripple and falls back to `opacity` elsewhere. Default `opacity`. */
  feedback?: TouchableFeedback;
  /** Minimum width and height in points. Values below 44 are raised to 44. Default 44. */
  minTarget?: number;
  /** Extra touch area around the element, passed to the pressable. */
  hitSlop?: number | Insets;
  /** Impact haptic once per accepted press (`onPress` or `onLongPress`). Uses the `haptics` capability: a no-op if absent. Default off. */
  haptic?: TouchableHaptic;
  /** Accessibility role. Default `button`. */
  role?: TouchableRole;
  /** Render the single child as the pressable instead of a wrapper: `Slot` merges the props into it. */
  asChild?: boolean;
  /** Required unless the content has text (a development warning is logged otherwise). */
  accessibilityLabel?: string;
  /** Reported as `accessibilityState.selected` (for example for `tab`). */
  selected?: boolean;
  /** Reported as `accessibilityState.checked` (for example for `checkbox`, `radio`, `switch`). */
  checked?: boolean | "mixed";
  /** Style, or a function of the press/focus/disabled state. Applied after the Touchable's own style. */
  style?: StyleProp<ViewStyle> | ((state: TouchableState) => StyleProp<ViewStyle>);
  testID?: string;
}

const MIN_TARGET = 44;
const DEFAULT_PRESSED_OPACITY = 0.85;

type AnimatedPressableType = React.ComponentType<Record<string, unknown>>;
let animatedPressable: AnimatedPressableType | null | undefined;

// `Animated` is missing in SSR builds and in the test shim: the pressable then applies a static pressed style instead.
function getAnimatedPressable(): AnimatedPressableType | null {
  if (animatedPressable === undefined) {
    const animated = (ReactNative as unknown as { Animated?: { createAnimatedComponent?: (c: unknown) => AnimatedPressableType } }).Animated;
    animatedPressable = animated?.createAnimatedComponent ? animated.createAnimatedComponent(Pressable) : null;
  }
  return animatedPressable;
}

/** True when the tree has a text leaf (a non-blank string or a number), so the control has a visible name. */
function hasTextContent(node: React.ReactNode): boolean {
  if (typeof node === "string") return node.trim().length > 0;
  if (typeof node === "number") return true;
  if (Array.isArray(node)) return node.some(hasTextContent);
  if (React.isValidElement(node)) return hasTextContent((node.props as { children?: React.ReactNode }).children);
  return false;
}

type DomLike = { matches?: (selector: string) => boolean };

// Keyboard focus only: a pointer click focuses the element too but must not draw the ring. Without `:focus-visible`
// support, or without a DOM target, the ring is shown.
function isFocusVisible(event: unknown): boolean {
  const e = event as { target?: DomLike; nativeEvent?: { target?: DomLike } } | undefined;
  const target = e?.nativeEvent?.target ?? e?.target;
  try {
    return typeof target?.matches === "function" ? target.matches(":focus-visible") : true;
  } catch {
    return true;
  }
}

/**
 * The pressable primitive: press feedback (`usePressFeedback`), a minimum touch target, hit slop, loading and disabled
 * semantics, a web focus ring and an optional haptic. Components that press (Button, Chip, ListItem, Link) compose it
 * instead of hand-rolling `Pressable` styling.
 */
export function Touchable({
  children,
  onPress,
  onLongPress,
  disabled = false,
  loading = false,
  feedback = "opacity",
  minTarget = MIN_TARGET,
  hitSlop,
  haptic = false,
  role = "button",
  asChild = false,
  accessibilityLabel,
  selected,
  checked,
  style,
  testID,
}: TouchableProps) {
  const { theme, colors } = useTheme();
  const haptics = useHaptics();
  const reduceMotion = useMotionPreference();
  const [focused, setFocused] = useState(false);
  const [pressed, setPressed] = useState(false);

  const inert = disabled || loading;
  const buttonTokens = theme.components.button;
  const androidRipple = feedback === "ripple" && Platform.OS === "android";
  // A themed pressed opacity of 1 means "no opacity change" (Button swaps the background instead): the hook default applies.
  const themedPressed = buttonTokens.opacity.pressed;
  const pressedOpacity = themedPressed > 0 && themedPressed < 1 ? themedPressed : DEFAULT_PRESSED_OPACITY;

  const press = usePressFeedback({
    disabled: inert || feedback === "none",
    scale: feedback === "scale" ? undefined : false,
    // Scale-only feedback and the Android ripple leave the opacity alone.
    opacity: feedback === "scale" || androidRipple ? 1 : pressedOpacity,
    ...(androidRipple ? { stateLayer: theme.semantic.action.primaryActive } : {}),
    tokens: theme.motion,
  });

  const minSize = Number.isFinite(minTarget) ? Math.max(MIN_TARGET, minTarget) : MIN_TARGET;
  const childLabel = asChild && React.isValidElement(children) ? (children.props as { accessibilityLabel?: unknown }).accessibilityLabel : undefined;
  const hasLabel = (accessibilityLabel !== undefined && accessibilityLabel !== "") || (typeof childLabel === "string" && childLabel !== "");
  const named = hasLabel || hasTextContent(children);
  useEffect(() => {
    if (__DEV__ && !named) {
      console.warn("[ui/Touchable] Touchable has no `accessibilityLabel` and no text child: assistive technology cannot name it.");
    }
  }, [named]);

  const accept = (event: GestureResponderEvent, handler: ((e: GestureResponderEvent) => void) | undefined) => {
    if (inert) return;
    if (haptic) void haptics.impact(haptic);
    handler?.(event);
  };
  const handlePress = onPress || haptic ? (event: GestureResponderEvent) => accept(event, onPress) : undefined;
  const handleLongPress = onLongPress ? (event: GestureResponderEvent) => accept(event, onLongPress) : undefined;

  const accessibilityState = {
    disabled,
    ...(loading ? { busy: true } : {}),
    ...(selected === undefined ? {} : { selected }),
    ...(checked === undefined ? {} : { checked }),
  };

  const base: ViewStyle = {
    minHeight: minSize,
    minWidth: minSize,
    borderRadius: theme.radius.sm,
    opacity: disabled ? buttonTokens.opacity.disabled : 1,
  };
  const focusRing: ViewStyle | undefined =
    focused && !inert
      ? ({ outlineColor: colors.primary, outlineStyle: "solid", outlineWidth: theme.borderWidth.thick, outlineOffset: 2 } as ViewStyle)
      : undefined;
  const userStyle = typeof style === "function" ? style({ pressed, focused, disabled: inert }) : style;

  const feedbackOn = !inert && feedback !== "none" && !androidRipple;
  // Static pressed look: used when `Animated` is unavailable and for `asChild` (the child is not an animated component).
  const hasScale = feedback === "scale" && !reduceMotion && press.style.transform !== undefined;
  const staticPressed: ViewStyle | undefined =
    pressed && feedbackOn
      ? {
          ...(feedback === "scale" ? {} : { opacity: pressedOpacity }),
          ...(hasScale ? { transform: [{ scale: theme.motion.scale.press }] } : {}),
        }
      : undefined;

  const common = {
    accessibilityRole: role as AccessibilityRole,
    accessibilityState,
    ...(accessibilityLabel === undefined ? {} : { accessibilityLabel }),
    ...(hitSlop === undefined ? {} : { hitSlop }),
    ...(testID === undefined ? {} : { testID }),
    disabled,
    onPress: handlePress,
    onLongPress: handleLongPress,
    onPressIn: () => {
      setPressed(true);
      press.handlers.onPressIn();
    },
    onPressOut: () => {
      setPressed(false);
      press.handlers.onPressOut();
    },
    onFocus: (event: unknown) => {
      if (Platform.OS === "web" && isFocusVisible(event)) setFocused(true);
    },
    onBlur: () => setFocused(false),
    ...(press.android_ripple ? { android_ripple: press.android_ripple } : {}),
  } satisfies PressableProps;

  if (asChild) {
    return (
      <Slot {...common} style={[base, focusRing, staticPressed, userStyle]}>
        {children as React.ReactElement}
      </Slot>
    );
  }

  const AnimatedPressable = getAnimatedPressable();
  if (AnimatedPressable) {
    // The hook animates the pressed opacity and scale: its style carries the animated values.
    return (
      <AnimatedPressable {...common} style={[base, focusRing, feedbackOn ? press.style : undefined, userStyle]}>
        {children}
      </AnimatedPressable>
    );
  }
  return (
    <Pressable {...common} style={[base, focusRing, staticPressed, userStyle]}>
      {children}
    </Pressable>
  );
}
