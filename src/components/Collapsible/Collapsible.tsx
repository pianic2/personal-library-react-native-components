import React, { createContext, useCallback, useContext, useEffect, useId, useMemo, useRef, useState } from "react";
import * as ReactNative from "react-native";
import { Pressable, View, type LayoutChangeEvent, type PressableProps, type StyleProp, type ViewProps, type ViewStyle } from "react-native";
import { useAnimate } from "../../motion/animate.js";
import type { MotionHandle } from "../../motion/engine.js";
import { useAnimatedValue } from "../../motion/useAnimatedValue.js";
import { useMotionPreference } from "../../motion/useMotionPreference.js";
import { useControllableState } from "../../hooks/useControllableState.js";
import { useTheme } from "../../theme/useTheme.js";
import { useVariants } from "../../theme/useVariants.js";
import { Slot } from "../Slot/index.js";
import { collapsibleVariants } from "./collapsible.variants.js";

/** Duration of the expand/collapse animation in milliseconds, until the motion tokens are adopted by this component. */
const DEFAULT_DURATION = 200;

export interface CollapsibleProps extends Omit<ViewProps, "children" | "style"> {
  /** Controlled open state. When set, the region is open exactly when this is true; change it from `onOpenChange`. */
  open?: boolean;
  /** Initial open state when uncontrolled. Default `false`. */
  defaultOpen?: boolean;
  /** Called with the next open state when the trigger toggles the region. */
  onOpenChange?: (open: boolean) => void;
  /** Length of the height animation in milliseconds. Default 200. */
  duration?: number;
  /** Set to `false` to open and close instantly. Reduced motion also makes the change instant. Default `true`. */
  animated?: boolean;
  /** Keeps the content mounted (hidden) while closed, so its state survives. Default `false`: closed content is unmounted. */
  keepMounted?: boolean;
  style?: StyleProp<ViewStyle>;
  testID?: string;
  children?: React.ReactNode;
}

export interface CollapsibleTriggerProps extends Omit<PressableProps, "children"> {
  /** Merges the trigger props into the single child element instead of rendering a Pressable. */
  asChild?: boolean;
  children?: React.ReactNode;
}

export interface CollapsibleContentProps extends Omit<ViewProps, "children" | "style"> {
  style?: StyleProp<ViewStyle>;
  testID?: string;
  children?: React.ReactNode;
}

interface CollapsibleContextValue {
  open: boolean;
  toggle: () => void;
  contentId: string;
  duration: number;
  animated: boolean;
  keepMounted: boolean;
}

const CollapsibleContext = createContext<CollapsibleContextValue | null>(null);

function useCollapsible(part: string): CollapsibleContextValue {
  const context = useContext(CollapsibleContext);
  if (!context) throw new Error(`[ui/Collapsible] ${part} must be rendered inside <Collapsible>.`);
  return context;
}

type AnimatedViewType = React.ComponentType<{ style?: unknown; children?: React.ReactNode } & Record<string, unknown>>;
function animatedView(): AnimatedViewType | undefined {
  return (ReactNative as unknown as { Animated?: { View?: AnimatedViewType } }).Animated?.View;
}

function CollapsibleRoot({ open: openProp, defaultOpen = false, onOpenChange, duration = DEFAULT_DURATION, animated = true, keepMounted = false, style, children, ...rest }: CollapsibleProps) {
  const contentId = useId();
  const [open, setOpen] = useControllableState<boolean>({ value: openProp, defaultValue: defaultOpen, onChange: onOpenChange });
  const toggle = useCallback(() => setOpen((current) => !current), [setOpen]);
  const value = useMemo<CollapsibleContextValue>(
    () => ({ open, toggle, contentId, duration, animated, keepMounted }),
    [open, toggle, contentId, duration, animated, keepMounted]
  );
  const styles = useVariants(collapsibleVariants);
  return (
    <CollapsibleContext.Provider value={value}>
      <View {...rest} style={[styles.root, style]}>
        {children}
      </View>
    </CollapsibleContext.Provider>
  );
}

/** The control that toggles the region. It reports `accessibilityState.expanded`; use `asChild` to render your own pressable. */
function CollapsibleTrigger({ asChild = false, onPress, children, ...rest }: CollapsibleTriggerProps) {
  const { open, toggle, contentId } = useCollapsible("Collapsible.Trigger");
  const handlePress: NonNullable<PressableProps["onPress"]> = (event) => {
    onPress?.(event);
    toggle();
  };
  const accessibility = {
    accessibilityRole: "button" as const,
    accessibilityState: { ...rest.accessibilityState, expanded: open },
    "aria-expanded": open,
    "aria-controls": contentId,
  };
  if (asChild) {
    return (
      <Slot {...(rest as ViewProps)} {...accessibility} onPress={handlePress}>
        {children as React.ReactElement}
      </Slot>
    );
  }
  return (
    <Pressable {...rest} {...accessibility} onPress={handlePress}>
      {children}
    </Pressable>
  );
}

type Status = "closed" | "opening" | "open" | "closing";

/**
 * The collapsible region. The content is measured through `onLayout` and the region's height is animated with the motion
 * engine (no LayoutAnimation). Closed content is unmounted unless `keepMounted`, and is hidden from screen readers.
 */
function CollapsibleContent({ style, children, ...rest }: CollapsibleContentProps) {
  const { open, contentId, duration, animated, keepMounted } = useCollapsible("Collapsible.Content");
  const { theme } = useTheme();
  const run = useAnimate(theme.motion);
  const reduceMotion = useMotionPreference();
  const instant = !animated || reduceMotion;
  const height = useAnimatedValue(0);
  const [status, setStatus] = useState<Status>(open ? "open" : "closed");
  const [contentHeight, setContentHeight] = useState<number | null>(null);
  const handle = useRef<MotionHandle | null>(null);
  const statusRef = useRef(status);
  const heightRef = useRef<number | null>(null);
  const started = useRef<Status | null>(null);
  const target = useRef(open);

  const move = (next: Status) => {
    statusRef.current = next;
    if (next === "open" || next === "closed") started.current = null;
    setStatus(next);
  };

  // A change of `open` starts a transition (or jumps, when instant).
  useEffect(() => {
    if (target.current === open) return;
    target.current = open;
    handle.current?.stop();
    handle.current = null;
    started.current = null;
    if (instant) {
      move(open ? "open" : "closed");
      return;
    }
    // Leaving the resting open state: the animated height starts from the measured height.
    if (!open && statusRef.current === "open" && heightRef.current !== null) height.setValue(heightRef.current);
    if (open && statusRef.current === "closed") height.setValue(0);
    move(open ? "opening" : "closing");
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open]);

  // Runs the animation of the current transition; opening waits until the content has been measured.
  useEffect(() => {
    if (status !== "opening" && status !== "closing") return;
    if (started.current === status) return;
    if (status === "closing" && heightRef.current === null) {
      move("closed");
      return;
    }
    if (status === "opening" && contentHeight === null) return;
    started.current = status;
    const to = status === "opening" ? (contentHeight as number) : 0;
    const next = run(height, to, { duration, property: "height" });
    handle.current = next;
    next.start((result) => {
      if (handle.current !== next) return;
      handle.current = null;
      if (result.finished) move(status === "opening" ? "open" : "closed");
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [status, contentHeight]);

  useEffect(() => () => handle.current?.stop(), []);

  const onLayout = (event: LayoutChangeEvent) => {
    const measured = event.nativeEvent.layout.height;
    heightRef.current = measured;
    setContentHeight(measured);
  };

  const styles = useVariants(collapsibleVariants, undefined, { closed: status === "closed", animating: status === "opening" || status === "closing" });
  const AnimatedView = animatedView();
  const hidden = !open;
  const Region = (AnimatedView ?? View) as AnimatedViewType;
  const regionStyle = status === "opening" || status === "closing" ? [styles.region, { height }] : styles.region;

  if (status === "closed" && !keepMounted) return null;

  return (
    <Region
      nativeID={contentId}
      pointerEvents={hidden ? "none" : "auto"}
      accessibilityElementsHidden={hidden}
      importantForAccessibility={hidden ? "no-hide-descendants" : "auto"}
      aria-hidden={hidden}
      style={regionStyle}
    >
      <View {...rest} onLayout={onLayout} style={[{ flexShrink: 0 }, style]}>
        {children}
      </View>
    </Region>
  );
}

/**
 * Disclosure region: `<Collapsible.Trigger>` toggles `<Collapsible.Content>`, whose height animates open and closed.
 * Controlled with `open` and `onOpenChange`, or uncontrolled with `defaultOpen`.
 */
export const Collapsible = Object.assign(CollapsibleRoot, {
  Trigger: CollapsibleTrigger,
  Content: CollapsibleContent,
});
