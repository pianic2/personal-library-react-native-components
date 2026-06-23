// ui/components/feedback/Spinner.tsx

import React from "react";
import { ActivityIndicator, View } from "react-native";
import { useTheme } from "../../theme/useTheme";

type Size = "sm" | "md" | "lg";

export interface SpinnerProps {
  size?: Size;
}

export function Spinner({ size = "md" }: SpinnerProps) {
  const { theme, colors } = useTheme();

  const map: Record<Size, number> = {
    sm: 16,
    md: 24,
    lg: 32,
  };

  return (
    <View>
      <ActivityIndicator
        size={map[size]}
        color={colors.primary}
      />
    </View>
  );
}
