// ui/components/buttons/Button.tsx

import React, { ComponentType } from "react";
import { Pressable, Text, type StyleProp, type ViewStyle } from "react-native";
import { useTheme } from "../../theme/useTheme.js";
import { stateLayer } from "../../tokens/semantic.base.js";
import { mixColors, readableOn } from "./contrast.js";

type Variant = "primary" | "secondary" | "ghost" | "danger" | "info";
type Size = "xs" | "sm" | "md" | "lg";

export interface ButtonProps {
  icon?: ComponentType<{ size?: number; color?: string }>;
  label?: string;
  onPress?: () => void;
  variant?: Variant;
  size?: Size;
  disabled?: boolean;
  /** Extra style for the pressable, applied after the variant styles. */
  style?: StyleProp<ViewStyle>;
  testID?: string;
}

export function Button({ icon: Icon, label, onPress, variant = "primary", size = "md", disabled = false, style, testID }: ButtonProps) {
  const { theme, colors } = useTheme();
  const buttonTokens = theme.components.button;
  const isTokenSize = size !== "xs";
  const height = isTokenSize ? buttonTokens.height[size] : theme.size.height.xs;
  const paddingHorizontal = isTokenSize ? buttonTokens.paddingX[size] : theme.space.sm;
  const iconSize = isTokenSize ? buttonTokens.iconSize[size] : 12;
  const borderRadius = buttonTokens.radius;
  const gap = buttonTokens.gap;
  const borderWidth = buttonTokens.borderWidth;
  const disabledOpacity = buttonTokens.opacity.disabled;
  const pressedOpacity = buttonTokens.opacity.pressed;
  // Filled variants never swap to the surface colour while pressed: the pressed feedback is the state layer (12%) drawn
  // in the colour opposite to the label, which keeps the label contrast or raises it. The label switches to the theme's
  // primary text colour when the inverted one would not reach 4.5:1 on the background.
  const filled = { primary: colors.primary, secondary: colors.secondary, danger: colors.error, info: colors.info } as const;
  const isGhost = variant === "ghost";
  const backgroundColor = isGhost ? "transparent" : filled[variant];
  const contentColor = isGhost ? colors.textPrimary : readableOn(backgroundColor, colors.textInverted, colors.textPrimary);
  const borderColor = isGhost ? colors.border : backgroundColor;
  const layerColor = contentColor === colors.textInverted ? colors.textPrimary : colors.textInverted;
  const pressedBackground = isGhost ? colors.surface : (mixColors(backgroundColor, layerColor, stateLayer.pressed) ?? backgroundColor);

  if (__DEV__ && !Icon && !label) console.warn("[ui/Button] Button rendered without `icon` and `label`. It will appear empty.");

  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={label}
      accessibilityState={{ disabled }}
      disabled={disabled}
      onPress={onPress}
      {...(testID === undefined ? {} : { testID })}
      style={({ pressed }) => [
        {
          minHeight: Math.max(44, height),
          minWidth: 44,
          paddingHorizontal,
          paddingVertical: theme.space[size],
          borderWidth,
          borderColor,
          borderRadius,
          flexDirection: "row",
          alignItems: "center",
          justifyContent: "center",
          gap,
          backgroundColor: pressed ? pressedBackground : backgroundColor,
          opacity: disabled ? disabledOpacity : pressed ? pressedOpacity : 1,
        },
        style,
      ]}
    >
      {Icon && <Icon size={iconSize} color={contentColor} />}
      {label && <Text style={{ color: contentColor, fontSize: theme.typography.fontSize[size], fontWeight: theme.typography.fontWeight.semibold }}>{label}</Text>}
    </Pressable>
  );
}
