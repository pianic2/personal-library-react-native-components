// ui/components/form/Switch.tsx

import React from "react";
import { Pressable, View } from "react-native";
import { useTheme } from "../../theme/useTheme";
import { Text } from "../Text/Text";

export interface SwitchProps {
  value: boolean;
  onChange: (v: boolean) => void;
  label?: string;
  disabled?: boolean;
}

export function Switch({
  value,
  onChange,
  label,
  disabled = false,
}: SwitchProps) {
  const { theme, colors } = useTheme();

  return (
    <Pressable
      onPress={() => !disabled && onChange(!value)}
      style={{
        flexDirection: "row",
        alignItems: "center",
        opacity: disabled ? 0.5 : 1,
      }}
    >
      <View
        style={{
          width: 44,
          height: 24,
          borderRadius: 24,
          backgroundColor: value
            ? colors.primary
            : colors.border,
          padding: 2,
        }}
      >
        <View
          style={{
            width: 20,
            height: 20,
            borderRadius: 20,
            backgroundColor: colors.surface,
            marginLeft: value ? 20 : 0,
          }}
        />
      </View>

      {label && (
        <Text style={{ marginLeft: theme.space.sm }}>
          {label}
        </Text>
      )}
    </Pressable>
  );
}
