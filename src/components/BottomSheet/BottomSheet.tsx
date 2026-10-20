// ui/components/overlay/BottomSheet.tsx

import React, { useCallback, useEffect, useMemo, useRef, useState } from "react";
import * as ReactNative from "react-native";
import { Pressable, View, useWindowDimensions, type StyleProp, type ViewStyle } from "react-native";
import { useControllableState } from "../../hooks/useControllableState.js";
import { useAnimate } from "../../motion/animate.js";
import type { MotionHandle } from "../../motion/engine.js";
import { useAnimatedValue } from "../../motion/useAnimatedValue.js";
import { useTheme } from "../../theme/useTheme.js";
import { Box } from "../Box/index.js";
import { Portal } from "../Portal/index.js";
import { createPanResponderDriver, type GestureDriver, type PanResponderLike } from "./gesture.js";
import { resolveSnap, resolveSnapHeights, type SnapPoint } from "./snap.js";

/** The two original snaps: `"collapsed"` is 35% of the window, `"expanded"` 70%. */
export type Snap = "collapsed" | "expanded";

export interface BottomSheetProps {
  /** Whether the sheet is open (controlled). */
  open?: boolean;
  /** @deprecated Use `open`. Alias kept through 1.x (ADR 0014); `open` wins when both are given. */
  visible?: boolean;
  /** Initial state when `open` is not given. Default `false`. */
  defaultOpen?: boolean;
  /** Called with `false` once per dismissal: Back (Android), Escape (web), backdrop press or a drag past the threshold. */
  onOpenChange?: (open: boolean) => void;
  /** @deprecated Alias of `onOpenChange(false)`, called together with it. */
  onClose?: () => void;

  /** Heights the sheet snaps to: pixels, `"50%"` of the window or `"content"`. Ascending. Default `["35%", "70%"]`. */
  snapPoints?: readonly SnapPoint[];
  /** Index of the current snap point (controlled). */
  snapIndex?: number;
  /** Initial snap point when `snapIndex` is not given. Default: the one of `snap`, else the last. */
  defaultSnapIndex?: number;
  /** Called when a drag ends on another snap point, or when the user changes it. */
  onSnapIndexChange?: (index: number) => void;
  /** Original two-snap API, kept: without `snapPoints` it picks the first (`"collapsed"`) or second (`"expanded"`, default) of `["35%", "70%"]`. Given, it controls the snap like `snapIndex`. */
  snap?: Snap;

  header?: React.ReactNode;
  children: React.ReactNode;

  /** Whether a press outside the sheet closes it. Default `true`. */
  dismissOnBackdrop?: boolean;
  /** Accessible name of the backdrop dismiss button. Default `"Close sheet"`. */
  dismissLabel?: string;
  /** Accessible name of the sheet dialog. */
  accessibilityLabel?: string;
  /** Label of the drag handle. Default `"Drag handle"`. */
  handleLabel?: string;
  /** Label of the screen-reader action on the handle that closes the sheet. Default `"Close sheet"`. */
  closeActionLabel?: string;
  /** Replaces the PanResponder drag (for example an adapter over react-native-gesture-handler). */
  gestureDriver?: GestureDriver;

  style?: StyleProp<ViewStyle>;
  testID?: string;
}

const DEFAULT_POINTS: readonly SnapPoint[] = ["35%", "70%"];
const FILL = { position: "absolute", top: 0, right: 0, bottom: 0, left: 0 } as const;
const HANDLE = { width: 48, height: 5 } as const;

type AnimatedViewType = React.ComponentType<{ style?: unknown; children?: React.ReactNode; testID?: string; pointerEvents?: "box-none" }>;

function animatedView(): AnimatedViewType | undefined {
  return (ReactNative as unknown as { Animated?: { View?: AnimatedViewType } }).Animated?.View;
}

function defaultDriver(): GestureDriver | undefined {
  const pan = (ReactNative as unknown as { PanResponder?: PanResponderLike }).PanResponder;
  return pan && typeof pan.create === "function" ? createPanResponderDriver(pan) : undefined;
}

const clamp = (n: number, min: number, max: number) => Math.min(Math.max(n, min), max);

export function BottomSheet({
  open: openProp,
  visible,
  defaultOpen = false,
  onOpenChange,
  onClose,
  snapPoints,
  snapIndex,
  defaultSnapIndex,
  onSnapIndexChange,
  snap,
  header,
  children,
  dismissOnBackdrop = true,
  dismissLabel = "Close sheet",
  accessibilityLabel,
  handleLabel = "Drag handle",
  closeActionLabel = "Close sheet",
  gestureDriver,
  style,
  testID,
}: BottomSheetProps) {
  const { theme, colors } = useTheme();
  const animate = useAnimate(theme.motion);
  const windowHeight = useWindowDimensions().height;

  // `visible` is the deprecated alias of `open` (ADR 0014).
  const open = openProp ?? visible;
  const [isOpen, setOpen] = useControllableState<boolean>({
    value: open,
    defaultValue: defaultOpen,
    onChange: (next) => {
      onOpenChange?.(next);
      if (!next) onClose?.();
    },
  });
  const requestClose = useCallback(() => setOpen(false), [setOpen]);

  const points = snapPoints ?? DEFAULT_POINTS;
  const [contentHeight, setContentHeight] = useState<number | undefined>(undefined);
  const resolved = resolveSnapHeights(points, windowHeight, contentHeight);
  // Until "content" is measured the sheet uses the default expanded height instead of collapsing to nothing.
  const heights = resolved.length > 0 ? resolved : [windowHeight * 0.7];
  const maxHeight = heights[heights.length - 1]!;

  // Without `snapPoints` the original two snaps apply and an explicit `snap` drives the index (as it always did).
  const legacyIndex = snap === "collapsed" ? 0 : 1;
  const snapIsControlled = snapIndex !== undefined || (!snapPoints && snap !== undefined);
  const [rawIndex, setIndex] = useControllableState<number>({
    value: snapIndex ?? (!snapPoints && snap !== undefined ? legacyIndex : undefined),
    defaultValue: defaultSnapIndex ?? (snapPoints ? heights.length - 1 : legacyIndex),
    ...(onSnapIndexChange ? { onChange: onSnapIndexChange } : {}),
  });
  const index = clamp(rawIndex, 0, heights.length - 1);
  const offsetFor = (i: number) => maxHeight - heights[i]!;

  const translateY = useAnimatedValue(offsetFor(index));
  const offsetRef = useRef(offsetFor(index));
  const motionRef = useRef<MotionHandle | null>(null);
  const animateTo = (target: number) => {
    motionRef.current?.stop();
    offsetRef.current = target;
    const handle = animate(translateY, target, { duration: "base" });
    motionRef.current = handle;
    handle.start();
  };

  useEffect(() => {
    const target = maxHeight - heights[index]!;
    if (target !== offsetRef.current) animateTo(target);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [index, maxHeight, heights.join(",")]);

  const dragBase = useRef(0);
  const latest = useRef({ index, heights, maxHeight, snapIsControlled });
  latest.current = { index, heights, maxHeight, snapIsControlled };
  const callbacks = {
    onStart() {
      motionRef.current?.stop();
      dragBase.current = offsetRef.current;
    },
    onMove(dy: number) {
      const offset = clamp(dragBase.current + dy, 0, latest.current.maxHeight);
      offsetRef.current = offset;
      translateY.setValue(offset);
    },
    onEnd(dy: number, vy: number) {
      const { index: current, heights: hs, maxHeight: max, snapIsControlled } = latest.current;
      const offset = clamp(dragBase.current + dy, 0, max);
      const decision = resolveSnap({ heights: hs, currentHeight: max - offset, velocity: vy });
      if (decision.type === "dismiss") {
        // If the owner keeps the sheet open the sheet returns to its snap point.
        animateTo(max - hs[current]!);
        requestClose();
        return;
      }
      setIndex(decision.index);
      // Controlled: stay at the current snap until the owner passes the new index (the effect then animates).
      animateTo(max - hs[snapIsControlled ? current : decision.index]!);
    },
  };
  const callbacksRef = useRef(callbacks);
  callbacksRef.current = callbacks;

  const driver = gestureDriver ?? defaultDriver();
  const handlers = useMemo(
    () =>
      driver?.createHandlers({
        onStart: () => callbacksRef.current.onStart(),
        onMove: (dy) => callbacksRef.current.onMove(dy),
        onEnd: (dy, vy) => callbacksRef.current.onEnd(dy, vy),
      }),
    [driver],
  );

  if (!isOpen) return null;

  const AnimatedView = animatedView();
  const Sheet = (AnimatedView ?? View) as AnimatedViewType;
  const sheetStyle = {
    width: "100%",
    height: maxHeight,
    transform: [{ translateY: AnimatedView ? (translateY as unknown as number) : offsetFor(index) }],
  } as const;
  const wantsContent = points.includes("content");

  return (
    <Portal dismissable onDismiss={requestClose} layer="modal" accessibilityViewIsModal lockScroll>
      <View pointerEvents="box-none" style={[FILL, { justifyContent: "flex-end" }]}>
        {dismissOnBackdrop ? (
          <Pressable
            onPress={requestClose}
            accessibilityRole="button"
            accessibilityLabel={dismissLabel}
            style={[FILL, { backgroundColor: colors.backdrop }]}
          />
        ) : (
          <View style={[FILL, { backgroundColor: colors.backdrop }]} />
        )}
        <Sheet style={sheetStyle} testID={testID}>
          <Box
            role="dialog"
            aria-modal
            accessibilityViewIsModal
            accessibilityLabel={accessibilityLabel}
            bg="surface"
            radius="lg"
            shadow="lg"
            padding="md"
            style={[{ height: "100%", borderTopLeftRadius: theme.radius.xl, borderTopRightRadius: theme.radius.xl }, style]}
          >
            <View
              onLayout={
                wantsContent
                  ? (e) => {
                      const h = e.nativeEvent.layout.height + theme.space.md * 2;
                      setContentHeight((prev) => (prev === h ? prev : h));
                    }
                  : undefined
              }
            >
              <View
                {...(handlers ?? {})}
                accessible
                accessibilityRole="adjustable"
                accessibilityLabel={handleLabel}
                accessibilityActions={[{ name: "dismiss", label: closeActionLabel }]}
                onAccessibilityAction={(e: { nativeEvent: { actionName: string } }) => {
                  if (e.nativeEvent.actionName === "dismiss") requestClose();
                }}
                hitSlop={{ top: theme.space.md, bottom: theme.space.md }}
                style={{
                  alignSelf: "center",
                  width: HANDLE.width,
                  height: HANDLE.height,
                  borderRadius: theme.radius.sm,
                  backgroundColor: colors.divider,
                  marginBottom: theme.space.md,
                }}
              />
              {header ? <View style={{ marginBottom: theme.space.sm }}>{header}</View> : null}
              {children}
            </View>
          </Box>
        </Sheet>
      </View>
    </Portal>
  );
}
