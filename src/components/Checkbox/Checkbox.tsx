// ui/components/form/Checkbox.tsx

import React from "react";
import { Pressable, View } from "react-native";
import { useTheme } from "../../theme/useTheme";
import { Text } from "../Text/Text";

export interface CheckboxProps {
  checked: boolean;
  onChange: (v: boolean) => void;
  label?: string;
  disabled?: boolean;
  checkIcon?: React.ReactNode;
}

export function Checkbox({
  checked,
  onChange,
  label,
  disabled = false,
  checkIcon,
}: CheckboxProps) {
  const { theme, colors } = useTheme();

  return (
    <Pressable
      onPress={() => !disabled && onChange(!checked)}
      style={{
        flexDirection: "row",
        alignItems: "center",
        opacity: disabled ? 0.5 : 1,
      }}
    >
      <View
        style={{
          width: 22,
          height: 22,
          borderWidth: 2,
          borderRadius: theme.radius.sm,
          borderColor: colors.border,
          backgroundColor: checked
            ? colors.primary
            : "transparent",
          alignItems: "center",
          justifyContent: "center",
        }}
      >
        {checked &&
          (checkIcon ?? (
            <Text style={{ color: colors.textInverted, lineHeight: 18 }}>
              ✓
            </Text>
          ))}
      </View>

      {label && (
        <Text style={{ marginLeft: theme.space.sm }}>
          {label}
        </Text>
      )}
    </Pressable>
  );
}
