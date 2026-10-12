import React from "react";
import * as ReactNative from "react-native";
import { dismissKeyboard } from "./host.js";
import type { KeyboardHost } from "./types.js";

export interface DismissKeyboardViewProps {
  children?: React.ReactNode;
  style?: unknown;
  testID?: string;
  /** Turns tap-to-dismiss off. Default true. */
  enabled?: boolean;
  /** Overrides react-native's `Keyboard` (tests, custom hosts). */
  host?: KeyboardHost;
}

type HostView = React.ComponentType<Record<string, unknown>>;

/**
 * Wrapper that dismisses the keyboard when the user presses outside its children. It is a non-focusable, non-accessible
 * `Pressable`: a child that handles its own press (a button, an input) claims the responder, so the wrapper's
 * `onPress` only fires for presses that land on empty space. Put `keyboardShouldPersistTaps="handled"` on a wrapping
 * `ScrollView` so taps on its children are not swallowed. It adds no accessibility role.
 */
export function DismissKeyboardView({ children, style, testID, enabled = true, host }: DismissKeyboardViewProps) {
  const Pressable = (ReactNative as unknown as { Pressable: HostView }).Pressable;
  const onPress = React.useCallback(() => dismissKeyboard(host), [host]);
  return (
    <Pressable
      accessible={false}
      focusable={false}
      disabled={!enabled}
      onPress={onPress}
      style={[{ flex: 1 }, style]}
      {...(testID === undefined ? {} : { testID })}
    >
      {children}
    </Pressable>
  );
}
