import React from "react";
import { View, StyleSheet, ViewStyle } from "react-native";
import { useTheme } from "../../theme/useTheme";

type SpaceKey = keyof ReturnType<typeof useTheme>["theme"]["space"];

export interface DividerProps {
  thickness?: number;   // spessore
  spacing?: SpaceKey;
  style?: ViewStyle | ViewStyle[];
}

export function Divider({
  thickness = 1,
  spacing = "none",
  style,
}: DividerProps) {
  const { colors } = useTheme();

  return (
    <View
      style={[
        {
          height: thickness,
          backgroundColor: colors.divider, // 20% opacity
          marginVertical: useTheme().theme.space[spacing],
          width: "100%",
        },
        style,
      ]}
    />
  );
}
