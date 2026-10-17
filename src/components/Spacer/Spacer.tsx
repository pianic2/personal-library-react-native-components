import React from "react";
import { View } from "react-native";
import { useTheme } from "../../theme/useTheme.js";

type SpaceKey = keyof ReturnType<typeof useTheme>["theme"]["space"];

export interface SpacerProps {
  /** A `theme.space` key or a number of points. Default `"md"`. Ignored when `flex` is set. */
  size?: SpaceKey | number;
  /** `vertical` sets the height, `horizontal` sets the width. The axis is not inferred from the parent. Default `vertical`. */
  axis?: "vertical" | "horizontal";
  /** Fills the free space of the parent (`flex: 1`), pushing the siblings apart. */
  flex?: boolean;
  testID?: string;
}

export function Spacer({ size = "md", axis = "vertical", flex = false, testID }: SpacerProps) {
  const { theme } = useTheme();
  const points = typeof size === "number" ? size : theme.space[size];

  return (
    <View
      testID={testID}
      accessibilityElementsHidden
      importantForAccessibility="no-hide-descendants"
      style={flex ? { flex: 1 } : axis === "horizontal" ? { width: points } : { height: points }}
    />
  );
}
