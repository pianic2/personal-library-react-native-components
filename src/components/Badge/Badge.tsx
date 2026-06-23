// ui/components/surfaces/Badge.tsx

import React from "react";
import { Platform, View, TextProps } from "react-native";
import { Text } from "../Text/Text";
import { useTheme } from "../../theme/useTheme";

type Variant = "primary" | "success" | "warning" | "danger" | "info";

export interface BadgeProps extends TextProps {
  children: React.ReactNode;
  size?: keyof ReturnType<typeof useTheme>["theme"]["typography"]["fontSize"];
  variant?: Variant;
}


export function Badge({
  children,
  size = "md",
  variant = "primary",
  style,
  ...rest
}: BadgeProps) {
  const { theme, colors } = useTheme();

  const backgroundMap: Record<Variant, string> = {
    primary: colors.primary,
    success: colors.success,
    warning: colors.warning,
    danger: colors.error,
    info: colors.info,
  };

  const textColor =
    variant === "primary"
      ? colors.textInverted
      : colors.textPrimary;

  const badgeStyle = {
    backgroundColor: backgroundMap[variant],
    borderRadius: theme.radius.full,
    paddingHorizontal: theme.space.md,
    paddingVertical: theme.space.sm / 2,
    fontSize: theme.typography.fontSize[size],
  };

  // ===============================
  // WEB: Text inline nativo
  // ===============================
  if (Platform.OS === "web") {
    return (
      <Text
        {...rest}
        weight="bold"
        style={[
          badgeStyle,
          {
            color: textColor,
            marginRight: theme.space.sm,
            alignItems: "center",
          },
          style,
        ]}
      >
        {children}
      </Text>
    );
  }

  // ===============================
  // NATIVE: View + Text (borderRadius safe)
  // ===============================
  return (
    <View
      style={{
        alignSelf: "center",
        transform: [{ translateY: 1 }], // baseline optical fix
      }}
    >
      <View style={badgeStyle}>
        <Text
          {...rest}
          weight="bold"
          style={[
            {
              color: textColor,
              textAlignVertical: "center",
            },
            style,
          ]}
        >
          {children}
        </Text>
      </View>
    </View>
  );
}
