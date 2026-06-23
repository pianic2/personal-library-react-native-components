// ui/components/feedback/Alert.tsx

import React from "react";
import { View } from "react-native";
import { Text } from "../Text/Text";
import { Button } from "../Button";
import { useTheme } from "../../theme/useTheme";

type Variant = "primary" | "info" | "success" | "warning" | "error";

export interface AlertProps {
  title?: string;
  variant?: Variant;
  message?: string;
  actionLabel?: string;
  onAction?: () => void;
}

export function Alert({
  title,
  variant = "info",
  message,
  actionLabel,
  onAction,
}: AlertProps) {
  const { theme, colors } = useTheme();

  const bgMap: Record<Variant, string> = {
    primary: colors.primary,
    info: colors.info,
    success: colors.success,
    warning: colors.warning,
    error: colors.error,
  };

  return (
    <View
      style={{
        backgroundColor: bgMap[variant],
        borderRadius: theme.radius.md,
        padding: theme.space.md,
        gap: theme.space.xs,
      }}
    >
      {title && (
        <Text weight="bold" style={{ color: colors.textInverted }} align="left">
          {title}
        </Text>
      )}

      {message && (
      <Text style={{ color: colors.textInverted }} align="left">
        {message}
      </Text>
      )}


      {actionLabel && onAction && (
        <Button
          size="sm"
          variant="ghost"
          onPress={onAction}
          label={actionLabel}
        />
      )}
    </View>
  );
}
