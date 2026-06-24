// ui/components/buttons/Button.tsx

import React, { ComponentType } from "react";
import { Pressable, Text } from "react-native";
import { useTheme } from "../../theme/useTheme";

type Variant = "primary" | "secondary" | "ghost" | "danger" | "info";
type Size = "xs" | "sm" | "md" | "lg";

export interface ButtonProps {
  icon?: ComponentType<{ size?: number; color?: string }>;
  label?: string;
  onPress?: () => void;
  variant?: Variant;
  size?: Size;
  disabled?: boolean;
}

export function Button({
  icon: Icon,
  label,
  onPress,
  variant = "primary",
  size = "md",
  disabled = false,
}: ButtonProps) {
  const { theme, colors } = useTheme();
  const buttonTokens = theme.components.button;
  const isTokenSize = size !== "xs";
  const height = isTokenSize ? buttonTokens.height[size] : theme.size.height.xs;
  const paddingHorizontal = isTokenSize
    ? buttonTokens.paddingX[size]
    : theme.space.sm;
  const iconSize = isTokenSize ? buttonTokens.iconSize[size] : 12;
  const borderRadius = buttonTokens.radius;
  const gap = buttonTokens.gap;
  const borderWidth = buttonTokens.borderWidth;
  const disabledOpacity = buttonTokens.opacity.disabled;
  const pressedOpacity = buttonTokens.opacity.pressed;

  const backgroundColor =
    variant === "primary"
      ? colors.primary
      : variant === "secondary"
      ? colors.secondary
      : variant === "danger"
      ? colors.error
      : "transparent"

  const contentColor =
    variant === "ghost"
      ? colors.textPrimary
      : colors.textInverted;

  const borderColor =
    variant === "primary"
      ? colors.primary
      : variant === "secondary"
      ? colors.secondary
      : variant === "danger"
      ? colors.error
      : colors.textInverted;


  if (__DEV__ && !Icon && !label) {
    console.warn(
      "[ui/Button] Button rendered without `icon` and `label`. It will appear empty."
    );
  }

  return (
    <Pressable
      disabled={disabled}
      onPress={onPress}
      style={({ pressed }) => ({
        minHeight: height,
        paddingHorizontal,
        paddingVertical: theme.space[size],
        borderWidth,
        borderColor: borderColor,
        borderRadius,
        flexDirection: "row",
        alignItems: "center",
        justifyContent: "center",
        gap,
        backgroundColor: pressed
          ? colors.surface
          : backgroundColor,
        opacity: disabled ? disabledOpacity : pressed ? pressedOpacity : 1,
      })}
    >
      {Icon && <Icon size={iconSize} color={contentColor} />}

      {label && (
        <Text
          style={{
            color: contentColor,
            fontSize: theme.typography.fontSize[size],
            fontWeight: "600",
          }}
        >
          {label}
        </Text>
      )}
    </Pressable>
  );
}
