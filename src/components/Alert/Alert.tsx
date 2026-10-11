// ui/components/feedback/Alert.tsx

import React from "react";
import { Pressable, View } from "react-native";
import { Text } from "../Text/Text.js";
import { Button } from "../Button/index.js";
import { useTheme } from "../../theme/useTheme.js";
import { readableOn } from "./contrast.js";

type Variant = "primary" | "info" | "success" | "warning" | "error";

export interface AlertProps {
  title?: string;
  variant?: Variant;
  message?: string;
  actionLabel?: string;
  onAction?: () => void;
  /** Shows a close button that calls this; the Alert does not hide itself, the caller decides. */
  onDismiss?: () => void;
  /** Accessibility label of the close button. Defaults to "Dismiss". */
  dismissLabel?: string;
}

export function Alert({
  title,
  variant = "info",
  message,
  actionLabel,
  onAction,
  onDismiss,
  dismissLabel = "Dismiss",
}: AlertProps) {
  const { theme, colors } = useTheme();

  const bgMap: Record<Variant, string> = {
    primary: colors.primary,
    info: colors.info,
    success: colors.success,
    warning: colors.warning,
    error: colors.error,
  };

  const background = bgMap[variant];
  // Text and close button use whichever text token reads better on this variant's background (WCAG contrast).
  const textColor = readableOn(background, [colors.textInverted, colors.textPrimary]);

  return (
    <View
      accessibilityRole="alert"
      accessibilityLiveRegion={variant === "error" ? "assertive" : "polite"}
      style={{
        backgroundColor: background,
        borderRadius: theme.radius.md,
        padding: theme.space.md,
        gap: theme.space.xs,
      }}
    >
      <View style={{ flexDirection: "row", alignItems: "flex-start", gap: theme.space.sm }}>
        <View style={{ flex: 1, gap: theme.space.xs }}>
          {title && (
            <Text weight="bold" style={{ color: textColor }} align="left">
              {title}
            </Text>
          )}

          {message && (
            <Text style={{ color: textColor }} align="left">
              {message}
            </Text>
          )}
        </View>

        {onDismiss && (
          <Pressable
            accessibilityRole="button"
            accessibilityLabel={dismissLabel}
            onPress={onDismiss}
            hitSlop={8}
            style={{ minWidth: 44, minHeight: 44, alignItems: "center", justifyContent: "center", marginTop: -theme.space.sm, marginRight: -theme.space.sm }}
          >
            <Text style={{ color: textColor }} accessibilityElementsHidden importantForAccessibility="no-hide-descendants">
              ✕
            </Text>
          </Pressable>
        )}
      </View>

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
