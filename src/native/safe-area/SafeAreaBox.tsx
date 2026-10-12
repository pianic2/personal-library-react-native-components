import React from "react";
import * as ReactNative from "react-native";
import { currentPlatformOS, safeAreaEnvStyle } from "./fallback.js";
import { useSafeAreaState } from "./SafeAreaInsetsProvider.js";
import type { Edge } from "./types.js";

const ALL: readonly Edge[] = ["top", "right", "bottom", "left"];

export interface SafeAreaBoxProps {
  children?: React.ReactNode;
  /** Edges that receive padding. Default: all four. */
  edges?: readonly Edge[];
  style?: unknown;
  testID?: string;
}

type HostView = React.ComponentType<Record<string, unknown>>;

/**
 * SafeAreaView-like primitive: pads the chosen `edges` by the current insets. With no provider it uses the
 * fallback insets, and on web the CSS `env(safe-area-inset-*)` values. Adds no accessibility role.
 */
export function SafeAreaBox({ children, edges = ALL, style, testID }: SafeAreaBoxProps) {
  const View = (ReactNative as unknown as { View: HostView }).View;
  const { insets, status } = useSafeAreaState();
  const padding: Record<string, string | number> =
    status === "noop" && currentPlatformOS() === "web"
      ? safeAreaEnvStyle(edges)
      : Object.fromEntries(edges.map((edge) => [`padding${edge[0]!.toUpperCase()}${edge.slice(1)}`, insets[edge]]));
  return (
    <View style={[padding, style]} {...(testID === undefined ? {} : { testID })}>
      {children}
    </View>
  );
}
