// ui/components/feedback/Alert.tsx

import React from "react";
import { Pressable, View } from "react-native";
import { Text } from "../Text/Text.js";
import { Button } from "../Button/index.js";
import { useTheme } from "../../theme/useTheme.js";
import { readableOn } from "./contrast.js";

type Variant = "primary" | "info" | "success" | "warning" | "error";
type Appearance = "solid" | "soft" | "outline";

// Typed constants instead of inline numbers: the share of the variant colour in a soft tint, the outline width and the close button.
const SOFT_TINT_OPACITY = 0.12;
const OUTLINE_WIDTH = 1;
const TOUCH_TARGET = 44;
const HIT_SLOP = 8;

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
  /** `solid` (default) fills with the variant colour; `soft` tints the surface; `outline` draws a border on the page. */
  appearance?: Appearance;
  /** A leading icon. Decorative: it is hidden from assistive technology, the role and the text carry the meaning. */
  icon?: React.ReactNode;
  /** Extra actions, rendered after the `actionLabel` button; the caller supplies the controls. */
  actions?: React.ReactNode;
}

export function Alert({
  title,
  variant = "info",
  message,
  actionLabel,
  onAction,
  onDismiss,
  dismissLabel = "Dismiss",
  appearance = "solid",
  icon,
  actions,
}: AlertProps) {
  const { theme, colors } = useTheme();

  const bgMap: Record<Variant, string> = {
    primary: colors.primary,
    info: colors.info,
    success: colors.success,
    warning: colors.warning,
    error: colors.error,
  };

  const variantColor = bgMap[variant];
  // Solid: text and close button use whichever text token reads better on the variant colour (WCAG contrast).
  // Soft and outline sit on the surface / the page, where the primary text colour is the readable one.
  const textColor = appearance === "solid" ? readableOn(variantColor, [colors.textInverted, colors.textPrimary]) : colors.textPrimary;
  const containerStyle =
    appearance === "solid"
      ? { backgroundColor: variantColor }
      : appearance === "soft"
        ? { backgroundColor: colors.surface, overflow: "hidden" as const }
        : { borderWidth: OUTLINE_WIDTH, borderColor: variantColor };

  return (
    <View
      accessibilityRole="alert"
      accessibilityLiveRegion={variant === "error" ? "assertive" : "polite"}
      style={{
        ...containerStyle,
        borderRadius: theme.radius.md,
        padding: theme.space.md,
        gap: theme.space.xs,
      }}
    >
      {appearance === "soft" && (
        <View pointerEvents="none" style={{ position: "absolute", top: 0, right: 0, bottom: 0, left: 0, backgroundColor: variantColor, opacity: SOFT_TINT_OPACITY }} />
      )}
      <View style={{ flexDirection: "row", alignItems: "flex-start", gap: theme.space.sm }}>
        {icon && (
          <View accessibilityElementsHidden importantForAccessibility="no-hide-descendants">
            {icon}
          </View>
        )}
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
            hitSlop={HIT_SLOP}
            style={{ minWidth: TOUCH_TARGET, minHeight: TOUCH_TARGET, alignItems: "center", justifyContent: "center", marginTop: -theme.space.sm, marginRight: -theme.space.sm }}
          >
            <Text style={{ color: textColor }} accessibilityElementsHidden importantForAccessibility="no-hide-descendants">
              ✕
            </Text>
          </Pressable>
        )}
      </View>

      {((actionLabel && onAction) || actions) && (
        <View style={{ flexDirection: "row", flexWrap: "wrap", alignItems: "center", gap: theme.space.sm }}>
          {actionLabel && onAction && <Button size="sm" variant="ghost" onPress={onAction} label={actionLabel} />}
          {actions}
        </View>
      )}
    </View>
  );
}
