// ui/components/surfaces/Badge.tsx

import React from "react";
import { Platform, View, TextProps } from "react-native";
import { Text } from "../Text/Text.js";
import { useTheme } from "../../theme/useTheme.js";
import { contrastRatio } from "../../theme/contrast.js";

type Variant = "primary" | "success" | "warning" | "danger" | "info";

export interface BadgeProps extends TextProps {
  children: React.ReactNode;
  size?: keyof ReturnType<typeof useTheme>["theme"]["typography"]["fontSize"];
  variant?: Variant;
}

/** The text colour with the higher WCAG contrast on `background`; `preferred` when a colour cannot be measured. */
function readableText(background: string, preferred: string, alternative: string): string {
  try {
    return contrastRatio(alternative, background) > contrastRatio(preferred, background) ? alternative : preferred;
  } catch {
    return preferred;
  }
}

/** True for a bare number or a string of digits: a badge that shows only a count. */
function isCountOnly(children: React.ReactNode): boolean {
  return typeof children === "number" || (typeof children === "string" && /^\s*\d+\s*$/.test(children));
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

  // Per variant, the token with the higher contrast on the background (4.5:1 or better for all five, light and dark).
  const textColor = readableText(
    backgroundMap[variant],
    variant === "primary" ? colors.textInverted : colors.textPrimary,
    variant === "primary" ? colors.textPrimary : colors.textInverted,
  );

  // A count-only badge ("3") is announced with a label; `accessibilityLabel` overrides the default (the count).
  const label = rest.accessibilityLabel ?? (isCountOnly(children) ? String(children).trim() : undefined);

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
        accessibilityLabel={label}
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
          accessibilityLabel={label}
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
