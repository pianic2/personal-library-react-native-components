import React from "react";
import * as ReactNative from "react-native";
import { resolvePlatformOS } from "./host.js";

type AvoidingView = React.ComponentType<{
  behavior?: "padding" | "height" | "position";
  keyboardVerticalOffset?: number;
  enabled?: boolean;
  style?: unknown;
  children?: React.ReactNode;
}>;

export interface KeyboardAvoidingContainerProps {
  children?: React.ReactNode;
  /** Vertical offset (for example a navigation header height) passed as `keyboardVerticalOffset`. Default 0. */
  offset?: number;
  /** Overrides the platform default: `padding` on iOS, `height` on Android. */
  behavior?: "padding" | "height" | "position";
  /** Turns avoidance off without unmounting the children. Default true. */
  enabled?: boolean;
  style?: unknown;
  testID?: string;
  /** Overrides `Platform.OS` (tests, previews). */
  platform?: string;
  /** Overrides react-native's `KeyboardAvoidingView` (tests, custom hosts). */
  component?: AvoidingView;
}

function defaultComponent(): AvoidingView {
  const rn = ReactNative as unknown as { KeyboardAvoidingView?: AvoidingView; View: AvoidingView };
  return rn.KeyboardAvoidingView ?? rn.View;
}

/** The platform-correct `behavior`: `padding` on iOS, `height` on Android, none elsewhere. */
export function defaultAvoidingBehavior(platform: string): "padding" | "height" | undefined {
  if (platform === "ios") return "padding";
  if (platform === "android") return "height";
  return undefined;
}

/**
 * Primitive wrapping react-native's `KeyboardAvoidingView` with platform-correct behaviour. Fills the available
 * space (`flex: 1`) and paints nothing, so it inherits the surrounding theme surface. On web (no
 * `KeyboardAvoidingView`) it renders a plain `View`. It adds no accessibility role.
 */
export function KeyboardAvoidingContainer({
  children,
  offset = 0,
  behavior,
  enabled = true,
  style,
  testID,
  platform,
  component,
}: KeyboardAvoidingContainerProps) {
  const Avoiding = component ?? defaultComponent();
  const resolved = behavior ?? defaultAvoidingBehavior(platform ?? resolvePlatformOS());
  return (
    <Avoiding
      behavior={resolved}
      keyboardVerticalOffset={offset}
      enabled={enabled}
      style={[{ flex: 1 }, style]}
      {...(testID === undefined ? {} : { testID })}
    >
      {children}
    </Avoiding>
  );
}
