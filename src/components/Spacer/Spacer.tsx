import React from "react";
import { View } from "react-native";
import type { StyleProp, ViewStyle } from "react-native";
import { useTheme } from "../../theme/useTheme.js";

export type SpacerSize = "xs" | "sm" | "md" | "lg";

export interface SpacerProps {
  /** A `theme.space` key (ADR 0014 sizes). Default `"md"`. Ignored when `flex` is set. */
  size?: SpacerSize;
  /** `vertical` sets the height, `horizontal` sets the width. The axis is not inferred from the parent. Default `vertical`. */
  axis?: "vertical" | "horizontal";
  /** Fills the free space of the parent (`flex: 1`), pushing the siblings apart. */
  flex?: boolean;
  /** Extra style, applied after the size. */
  style?: StyleProp<ViewStyle>;
  testID?: string;
}

export function Spacer({ size = "md", axis = "vertical", flex = false, style, testID }: SpacerProps) {
  const { theme } = useTheme();
  const points = theme.space[size];

  return (
    <View
      testID={testID}
      accessibilityElementsHidden
      importantForAccessibility="no-hide-descendants"
      style={[flex ? { flex: 1 } : axis === "horizontal" ? { width: points } : { height: points }, style]}
    />
  );
}
