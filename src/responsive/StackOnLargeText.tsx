import React from "react";
import { View, type ViewProps } from "react-native";
import { useTheme } from "../theme/useTheme.js";
import { useIsLargeText } from "./useIsLargeText.js";

type SpaceKey = keyof ReturnType<typeof useTheme>["theme"]["space"];

export interface StackOnLargeTextProps extends ViewProps {
  /** Font scale from which the children stack. Default 1.3. */
  threshold?: number;
  /** Space between the children (a `theme.space` key). Default `"md"`. */
  gap?: SpaceKey;
  /** Cross-axis alignment while in a row. In a column the children stretch, so a text can use the full width. Default `"center"`. */
  align?: "flex-start" | "center" | "flex-end" | "stretch";
  children?: React.ReactNode;
}

/**
 * A row that becomes a column when the system font scale is large, so labels and values that fit side by side at normal
 * size do not clip or squeeze at large text sizes.
 */
export function StackOnLargeText({ threshold, gap = "md", align = "center", style, children, ...rest }: StackOnLargeTextProps) {
  const { theme } = useTheme();
  const large = useIsLargeText(threshold);
  return (
    <View
      {...rest}
      style={[{ flexDirection: large ? "column" : "row", alignItems: large ? "stretch" : align, gap: theme.space[gap] }, style]}
    >
      {children}
    </View>
  );
}
