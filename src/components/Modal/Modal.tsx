import React, { useEffect, useId, useRef, useState } from "react";
import * as ReactNative from "react-native";
import { Modal as RNModal, Platform, Pressable, View } from "react-native";
import { Presence } from "../../motion/Presence.js";
import { useTheme } from "../../theme/useTheme.js";
import { Box } from "../Box/index.js";
import { Heading } from "../Heading/index.js";
import { getModalAccessibilityHost } from "./host.js";

export type ModalAnimationType = "fade" | "slide" | "none";

export interface ModalInsets {
  top?: number;
  bottom?: number;
  left?: number;
  right?: number;
}

export interface ModalProps {
  visible: boolean;
  /** Called once per dismissal: backdrop press, Android back button, or the Escape key on web (through `onRequestClose`). Ignored while the dialog is closing. */
  onClose: () => void;

  children: React.ReactNode;

  size?: "sm" | "md" | "lg";
  dismissOnBackdrop?: boolean;

  /** Optional visible title; it also labels the dialog (`aria-labelledby`) and is announced when the dialog opens. */
  title?: string;
  /** Accessible name of the dialog. Defaults to `title`. Announced when the dialog opens. */
  accessibilityLabel?: string;
  /** `nativeID` of an element inside `children` that describes the dialog (`aria-describedby`; web only, native ignores it). */
  accessibilityDescribedBy?: string;
  /** Accessible name of the backdrop dismiss button. Default `"Close dialog"`. Only used when `dismissOnBackdrop` is true. */
  dismissLabel?: string;

  /** `"fade"` (default), `"slide"` (the dialog slides up) or `"none"`. Reduced motion replaces any of them by an instant change. */
  animationType?: ModalAnimationType;
  /** Moves the dialog up so a focused input stays visible. Default `false`. */
  avoidKeyboard?: boolean;
  /** Safe-area insets added to the overlay padding (for example from `react-native-safe-area-context`). Default all zero. */
  insets?: ModalInsets;

  /** Ref of the element that takes the screen-reader focus when the dialog opens (where React Native allows it). */
  initialFocusRef?: React.RefObject<unknown>;
  /** Ref of the element that takes the screen-reader focus again once the dialog has closed (typically the trigger). Not restored when the Modal itself unmounts while open. */
  restoreFocusRef?: React.RefObject<unknown>;
}

const WIDTH = { sm: 360, md: 480, lg: 640 } as const;

const FILL = { position: "absolute", top: 0, right: 0, bottom: 0, left: 0 } as const;

type AvoidingView = React.ComponentType<{ behavior?: "padding" | "height"; style?: unknown; pointerEvents?: "box-none"; children?: React.ReactNode }>;

function keyboardAvoidingView(): AvoidingView | undefined {
  return (ReactNative as unknown as { KeyboardAvoidingView?: AvoidingView }).KeyboardAvoidingView;
}

export function Modal({
  visible,
  onClose,
  children,
  size = "md",
  dismissOnBackdrop = true,
  title,
  accessibilityLabel,
  accessibilityDescribedBy,
  dismissLabel = "Close dialog",
  animationType = "fade",
  avoidKeyboard = false,
  insets,
  initialFocusRef,
  restoreFocusRef,
}: ModalProps) {
  const { theme, colors } = useTheme();
  const titleId = useId();
  const label = accessibilityLabel ?? title;
  const animated = animationType !== "none";

  // The native modal stays open while the exit animation runs; `Presence` reports the end. Without animation `visible` rules,
  // and a stale `shown` is cleared so that switching `animationType` later cannot reopen an invisible modal.
  const [shown, setShown] = useState(visible);
  if (visible && !shown) setShown(true);
  if (!visible && !animated && shown) setShown(false);

  // One dismissal per open dialog: a second Escape or back press during the exit animation is ignored.
  const close = () => {
    if (visible) onClose();
  };

  // Screen reader: announce and focus when the dialog opens, restore the focus when it closes.
  const wasVisible = useRef(false);
  useEffect(() => {
    const host = getModalAccessibilityHost();
    if (visible && !wasVisible.current) {
      if (label) host.announce(label);
      host.focus(initialFocusRef?.current);
    } else if (!visible && wasVisible.current && !animated) {
      // Animated exits restore the focus once the native modal is gone (`onExited`).
      host.focus(restoreFocusRef?.current);
    }
    wasVisible.current = visible;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [visible]);

  const Avoiding = avoidKeyboard ? keyboardAvoidingView() : undefined;
  const Frame = (Avoiding ?? View) as AvoidingView;
  const frameProps = Avoiding ? { behavior: Platform.OS === "ios" ? ("padding" as const) : ("height" as const) } : {};

  const box = (
    <Box
      role="dialog"
      aria-modal
      accessibilityViewIsModal
      accessibilityLabel={label}
      aria-labelledby={title ? titleId : undefined}
      aria-describedby={accessibilityDescribedBy}
      bg="surface"
      radius="lg"
      padding="lg"
      style={animated ? undefined : { width: "100%", maxWidth: WIDTH[size] }}
    >
      {title ? (
        <Heading level={3} nativeID={titleId}>
          {title}
        </Heading>
      ) : null}
      {children}
    </Box>
  );

  // The animation wrapper is only as large as the dialog: a full-screen wrapper would swallow the backdrop presses.
  const dialog = (
    <Frame
      {...frameProps}
      pointerEvents="box-none"
      style={{
        flex: 1,
        alignItems: "center",
        justifyContent: "center",
        padding: theme.space.lg,
        paddingTop: theme.space.lg + (insets?.top ?? 0),
        paddingBottom: theme.space.lg + (insets?.bottom ?? 0),
        paddingLeft: theme.space.lg + (insets?.left ?? 0),
        paddingRight: theme.space.lg + (insets?.right ?? 0),
      }}
    >
      {animated ? (
        <Presence
          visible={visible}
          preset={animationType === "slide" ? "slide-up" : "fade"}
          appear
          style={{ width: "100%", maxWidth: WIDTH[size] }}
          onExited={() => {
            setShown(false);
            getModalAccessibilityHost().focus(restoreFocusRef?.current);
          }}
        >
          {box}
        </Presence>
      ) : (
        box
      )}
    </Frame>
  );

  const backdrop = dismissOnBackdrop ? (
    <Pressable
      onPress={close}
      accessibilityRole="button"
      accessibilityLabel={dismissLabel}
      style={[FILL, { backgroundColor: colors.backdrop }]}
    />
  ) : (
    <View style={[FILL, { backgroundColor: colors.backdrop }]} />
  );

  return (
    <RNModal visible={animated ? shown : visible} transparent animationType="none" onRequestClose={close}>
      <View style={{ flex: 1 }}>
        {animated ? (
          <Presence visible={visible} preset="fade" appear style={FILL}>
            {backdrop}
          </Presence>
        ) : (
          backdrop
        )}
        {dialog}
      </View>
    </RNModal>
  );
}
