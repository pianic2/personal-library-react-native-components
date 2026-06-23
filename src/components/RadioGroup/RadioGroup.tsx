// ui/components/form/RadioGroup.tsx

import React from "react";
import { Pressable, View } from "react-native";
import { useTheme } from "../../theme/useTheme";
import { Text } from "../Text/Text";

interface Option {
  label: string;
  value: string;
}

export interface RadioGroupProps {
  value?: string;
  onChange: (v: string) => void;
  options: Option[];
}

export function RadioGroup({
  value,
  onChange,
  options,
}: RadioGroupProps) {
  const { theme, colors } = useTheme();

  return (
    <View>
      {options.map((opt) => {
        const selected = value === opt.value;

        return (
          <Pressable
            key={opt.value}
            onPress={() => onChange(opt.value)}
            style={{
              flexDirection: "row",
              alignItems: "center",
              marginVertical: theme.space.xs,
            }}
          >
            <View
              style={{
                width: 22,
                height: 22,
                borderRadius: 22,
                borderWidth: 2,
                borderColor: colors.primary,
                alignItems: "center",
                justifyContent: "center",
              }}
            >
              {selected && (
                <View
                  style={{
                    width: 12,
                    height: 12,
                    borderRadius: 12,
                    backgroundColor: colors.primary,
                  }}
                />
              )}
            </View>

            <Text style={{ marginLeft: theme.space.sm }}>
              {opt.label}
            </Text>
          </Pressable>
        );
      })}
    </View>
  );
}
