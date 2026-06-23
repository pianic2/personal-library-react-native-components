// ui/components/form/Input.tsx

import React, { useState } from "react";
import {
  View,
  TextInput,
  TextInputProps,
} from "react-native";
import { P } from "../P/P";
import { Small } from "../Small/Small";
import { useTheme } from "../../theme/useTheme";
import { Box } from "../Box/Box";
import { Row } from "../Row/Row";

export interface InputProps extends TextInputProps {
  label: string;
  size?: "xs" | "sm" | "md" | "lg";
  error?: boolean;
  helperText?: string;
  editable?: boolean;
  leftIcon?: React.ReactNode;
  rightIcon?: React.ReactNode;
}

export function Input({
  size = "md",
  error = false,
  helperText = "",
  editable = true,
  leftIcon: LeftIcon,
  rightIcon: RightIcon,
  style,
  ...rest
}: InputProps) {
  const { theme, colors } = useTheme();
  const [focused, setFocused] = useState(false);

  const borderColor = error
    ? colors.error
    : focused
      ? colors.primary
      : colors.border;

  return (
    <>
      <P style={{ marginBottom: theme.space.xs }} weight="medium" size={size}>
        <Box style={{ 
          height: 10, 
          width: 10, 
          backgroundColor: colors.primary, 
          borderRadius: 5, 
        }}></Box>{" "}
        {rest.label}
      </P>
      <Row
        style={{
          borderWidth: 1,
          borderColor,
          borderRadius: theme.radius.md,
          backgroundColor: editable
            ? colors.surface
            : colors.disabledBg,
          paddingHorizontal: theme.space[size],
          minHeight: theme.size.height[size],
          paddingVertical: 0,

        }}
        align="flex-start"
        gap={size}
      >
        {LeftIcon && (
          <Box style={{ flexDirection: "row", alignItems: "center", height: theme.size.height[size] - 2 }}>
            {LeftIcon}
          </Box>
        )}

        {/* fare in modo che quando seFocused(True) allora il Textinput non si evidenzi  */}
        <TextInput
          {...rest}
          editable={editable}
          placeholderTextColor={colors.textMuted}
          onFocus={() => setFocused(true)}
          onBlur={() => setFocused(false)}
          style={[
            {
              flex: 1,
              color: colors.textPrimary,
              height: theme.size.height[size] - 2,
              paddingVertical: theme.space["md"] - 2.5
            },
            style,
          ]}
        />
        {RightIcon && (
          <Box style={{ flexDirection: "row", alignItems: "center", height: theme.size.height[size] - 2 }}>
            {RightIcon}
          </Box>
        )}
      </Row>

      {helperText && (
        <Small
          style={{
            marginTop: theme.space.xs,
            color: error ? colors.error : colors.textMuted,
          }}
        >
          {helperText}
        </Small>
      )}
    </>
  );
}
