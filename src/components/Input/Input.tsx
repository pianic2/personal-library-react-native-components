// ui/components/form/Input.tsx

import React, { useState } from "react";
import { TextInput, View, type StyleProp, type TextInputProps, type ViewStyle } from "react-native";
import { P } from "../P/P.js";
import { Small } from "../Small/Small.js";
import { useTheme } from "../../theme/useTheme.js";
import { Box } from "../Box/Box.js";
import { Row } from "../Row/Row.js";

export interface InputProps extends TextInputProps {
  /** Visible label. Optional (for example inside FormField, which renders the label itself); without it give an `accessibilityLabel`. */
  label?: string;
  size?: "xs" | "sm" | "md" | "lg";
  error?: boolean;
  helperText?: string;
  editable?: boolean;
  leftIcon?: React.ReactNode;
  rightIcon?: React.ReactNode;
  /** Style of the wrapper View around the label, the field and the helper text. */
  containerStyle?: StyleProp<ViewStyle>;
}

export function Input({ label, containerStyle, size = "md", error = false, helperText = "", editable = true, leftIcon: LeftIcon, rightIcon: RightIcon, style, ...rest }: InputProps) {
  const { theme, colors } = useTheme();
  const inputTokens = theme.components.input;
  const [focused, setFocused] = useState(false);
  const borderColor = error ? colors.error : focused ? colors.primary : colors.border;
  const accessibilityLabel = rest.accessibilityLabel ?? label;
  const accessibilityHint = rest.accessibilityHint ?? (helperText || undefined);

  if (__DEV__ && !label && !rest.accessibilityLabel) console.warn("[ui/Input] Input rendered without `label` and `accessibilityLabel`. Assistive technology cannot name it.");

  return (
    <View style={containerStyle}>
      {label ? <P style={{ marginBottom: theme.space.xs }} weight="medium" size={size}>{label}</P> : null}
      <Row style={{ borderWidth: 1, borderColor, borderRadius: inputTokens.radius, backgroundColor: editable ? colors.surface : colors.disabledBg, paddingHorizontal: inputTokens.paddingX[size], minHeight: Math.max(44, inputTokens.height[size]), paddingVertical: inputTokens.paddingY[size] }} align="flex-start" gap={size}>
        {LeftIcon && <Box style={{ flexDirection: "row", alignItems: "center", height: inputTokens.iconBoxHeight[size] }}>{LeftIcon}</Box>}
        <TextInput {...rest} accessibilityLabel={accessibilityLabel} accessibilityHint={accessibilityHint} accessibilityState={{ disabled: !editable }} editable={editable} placeholderTextColor={colors.textMuted} onFocus={() => setFocused(true)} onBlur={() => setFocused(false)} style={[{ flex: 1, color: colors.textPrimary, minHeight: 44, height: inputTokens.iconBoxHeight[size], paddingVertical: inputTokens.paddingY[size] }, style]} />
        {RightIcon && <Box style={{ flexDirection: "row", alignItems: "center", height: inputTokens.iconBoxHeight[size] }}>{RightIcon}</Box>}
      </Row>
      {helperText && <Small style={{ marginTop: theme.space.xs, color: error ? colors.error : colors.textMuted }}>{helperText}</Small>}
    </View>
  );
}
