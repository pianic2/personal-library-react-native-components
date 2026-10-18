import React, { useEffect, useRef, useState } from "react";
import { Pressable, View, useWindowDimensions, type StyleProp, type ViewStyle } from "react-native";
import { useInsets } from "../../native/safe-area/index.js";
import { useTheme } from "../../theme/useTheme.js";
import { Box } from "../Box/index.js";
import { getModalAccessibilityHost } from "../Modal/host.js";
import { Portal, useOverlayAnchor, type AnchorHandle } from "../Portal/index.js";
import { computePopoverPlacement, type PopoverPlacement } from "./placement.js";

export type { PopoverPlacement } from "./placement.js";

export interface PopoverProps {
  /**
   * Renders the trigger. Call `toggle` from the trigger's own press handler: Popover does not wrap the trigger in a
   * pressable. The element it returns receives `accessibilityState.expanded` (and `aria-expanded`) reflecting `open`.
   */
  renderTrigger: (args: { open: boolean; toggle: () => void }) => React.ReactNode;
  /** The popover content, rendered through the nearest OverlayHost. */
  children: React.ReactNode;
  /** The preferred side. It flips to the opposite side when the content does not fit. Default `"top"`. */
  placement?: PopoverPlacement;
  /** Distance between the trigger and the content (a `theme.space` key). Default `"xs"`. */
  gap?: keyof ReturnType<typeof useTheme>["theme"]["space"];
  /** Controlled open state. When set, the popover is open exactly when this is true; change it from `onOpenChange`. */
  open?: boolean;
  /** Initial open state when uncontrolled. Default `false`. */
  defaultOpen?: boolean;
  /** Called with the next open state when the trigger toggles it or the popover is dismissed (backdrop, Escape, Back, dismiss action). */
  onOpenChange?: (open: boolean) => void;
  /** Style of the root element that wraps the trigger. */
  style?: StyleProp<ViewStyle>;
  /** Test id of the root element; the content gets `<testID>-content`. */
  testID?: string;
}

const FILL = { position: "absolute", top: 0, right: 0, bottom: 0, left: 0 } as const;
const CLOSE_LABEL = "Close";

/**
 * A panel anchored to a trigger, on iOS, Android and web. The content is rendered by the nearest `OverlayHost` through
 * `Portal`, positioned from the trigger's `measureInWindow` rectangle, flipped and shifted to stay inside the window and
 * the safe area. A press outside, Escape (web) and Android Back close it; screen readers get a "dismiss" action and the
 * focus returns to the trigger. Assumes the host fills the window (the usual app root).
 */
export function Popover({ renderTrigger, children, placement = "top", gap = "xs", open: openProp, defaultOpen = false, onOpenChange, style, testID }: PopoverProps) {
  const { theme, colors } = useTheme();
  const insets = useInsets();
  const windowSize = useWindowDimensions();
  const [innerOpen, setInnerOpen] = useState(defaultOpen);
  const controlled = openProp !== undefined;
  const open = controlled ? openProp : innerOpen;
  const [measured, setMeasured] = useState(false);
  const [size, setSize] = useState<{ width: number; height: number } | null>(null);
  const anchorRef = useRef<View>(null);
  const anchor = useOverlayAnchor(anchorRef as React.RefObject<AnchorHandle | null>);

  const setOpen = (next: boolean) => {
    if (next === open) return;
    if (!controlled) setInnerOpen(next);
    onOpenChange?.(next);
  };
  const toggle = () => setOpen(!open);
  const close = () => setOpen(false);

  // Measure the trigger every time the popover opens (and when the window changes size).
  const { measure } = anchor;
  useEffect(() => {
    if (!open) {
      setMeasured(false);
      setSize(null);
      return undefined;
    }
    let live = true;
    void measure().then(() => {
      if (live) setMeasured(true);
    });
    return () => {
      live = false;
    };
  }, [open, measure, windowSize.width, windowSize.height]);

  // Give the screen-reader focus back to the trigger once the popover has closed.
  const wasOpen = useRef(false);
  useEffect(() => {
    if (wasOpen.current && !open) getModalAccessibilityHost().focus(anchorRef.current);
    wasOpen.current = open;
  }, [open]);

  const trigger = renderTrigger({ open, toggle });
  const expandedTrigger = React.isValidElement<{ accessibilityState?: Record<string, unknown> }>(trigger)
    ? React.cloneElement(trigger as React.ReactElement<Record<string, unknown>>, {
        accessibilityState: { ...(trigger.props.accessibilityState ?? {}), expanded: open },
        "aria-expanded": open,
      })
    : trigger;

  const ready = measured && size !== null;
  const position = size
    ? computePopoverPlacement({
        anchor: anchor.rect ?? { x: 0, y: 0, width: 0, height: 0 },
        content: size,
        window: windowSize,
        insets,
        placement,
        gap: theme.space[gap],
        margin: theme.space.sm,
      })
    : { x: 0, y: 0 };

  return (
    <>
      <View ref={anchorRef} collapsable={false} testID={testID} style={[{ alignSelf: "flex-start" }, style]}>
        {expandedTrigger}
      </View>
      {open ? (
        <Portal dismissable onDismiss={close}>
          <Pressable testID="popover-backdrop" accessible={false} importantForAccessibility="no" onPress={close} style={FILL} />
          <Box
            role="dialog"
            testID={testID === undefined ? undefined : `${testID}-content`}
            accessibilityActions={[{ name: "dismiss", label: CLOSE_LABEL }]}
            onAccessibilityAction={(event) => {
              if (event.nativeEvent.actionName === "dismiss") close();
            }}
            onLayout={(event) => {
              const { width, height } = event.nativeEvent.layout;
              setSize((current) => (current && current.width === width && current.height === height ? current : { width, height }));
            }}
            bg="surface"
            radius="md"
            shadow="md"
            padding="sm"
            style={{
              position: "absolute",
              left: position.x,
              top: position.y,
              opacity: ready ? 1 : 0,
              borderWidth: 1,
              borderColor: colors.border,
              minWidth: 180,
              maxWidth: Math.max(0, windowSize.width - 2 * theme.space.sm),
            }}
          >
            {children}
          </Box>
        </Portal>
      ) : null}
    </>
  );
}
