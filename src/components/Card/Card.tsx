import React from "react";
import {
  View,
  StyleSheet,
  ViewStyle,
  StyleProp,
  Platform,
} from "react-native";
import { useTheme } from "../../theme/useTheme";
import { Shadow } from "../../tokens/shadows.base";

export interface CardProps {
  children?: React.ReactNode;
  style?: StyleProp<ViewStyle>;
  bgColor?: string;
  radius?: number;
  margin?: keyof ReturnType<typeof useTheme>["theme"]["space"];
  padding?: keyof ReturnType<typeof useTheme>["theme"]["space"];
  variant?: "default" | "elevated" | "outline";
  shadow?: Shadow;
}

export function Card({
  children,
  style,
  bgColor,
  radius = 14,
  margin = "none",
  padding = "md",
  variant = "default",
  shadow,
}: CardProps) {
  const { theme, colors } = useTheme();

  const resolvedShadow: Shadow =
    shadow ??
    (variant === "outline"
      ? "none"
      : variant === "elevated"
      ? "md"
      : "sm");

  const cardBackground =
    bgColor ||
    (variant === "outline" ? "transparent" : colors.surface);

  return (
    <View
      style={[
        styles.base,
        {
          backgroundColor: cardBackground,
          borderRadius: radius,
          margin: theme.space[margin],
          padding: theme.space[padding],
        },

        variant === "outline" && {
          borderWidth: 1,
          borderColor: colors.border,
        },

        applyShadow(resolvedShadow),

        style,
      ]}
    >
      {children}
    </View>
  );
}

/**
 * Applica shadow token in modo cross-platform
 */
function applyShadow(shadow: Shadow): ViewStyle {
  const { theme } = useTheme();
  const s = theme.shadows[shadow];

  if (Platform.OS === "web") {
    if (shadow === "none") {
      return { boxShadow: "none" } as ViewStyle;
    }

    return {
      boxShadow: `${s.shadowOffset.width}px ${s.shadowOffset.height}px ${s.shadowRadius}px rgba(0, 0, 0, ${s.shadowOpacity})`,
    } as ViewStyle;
  }

  if (Platform.OS === "android") {
    return {
      elevation: s.elevation,
    };
  }

  // iOS / Web
  return {
    shadowColor: s.shadowColor,
    shadowOffset: s.shadowOffset,
    shadowOpacity: s.shadowOpacity,
    shadowRadius: s.shadowRadius,
  };
}

const styles = StyleSheet.create({
  base: {
    width: "100%",
  },
});
