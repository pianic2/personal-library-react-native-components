// ui/components/feedback/ProgressBar.tsx

import React from "react";
import { View, type DimensionValue } from "react-native";
import { useTheme } from "../../theme/useTheme";

type Variant = "primary" | "info" | "success" | "warning" | "error";

export interface ProgressBarProps {
  progress?: number; // 0–100
  color?: Variant;
}

export function ProgressBar({ progress, color }: ProgressBarProps) {
  const { theme, colors } = useTheme();

  const normalizedProgress =
    progress === undefined || !Number.isFinite(progress)
      ? 30
      : Math.min(Math.max(progress, 0), 100);
  const width: DimensionValue = `${normalizedProgress}%`;

  return (
    <View
      style={{
        height: 8,
        backgroundColor: colors.border,
        borderRadius: theme.radius.full,
        overflow: "hidden",
      }}
    >
      <View
        style={{
          width,
          height: "100%",
          backgroundColor: color ? colors[color] : colors.primary,
        }}
      />
    </View>
  );
}
