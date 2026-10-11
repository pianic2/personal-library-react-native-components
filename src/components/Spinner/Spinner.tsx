// ui/components/feedback/Spinner.tsx

import React from "react";
import { ActivityIndicator, Platform, View } from "react-native";
import { useTheme } from "../../theme/useTheme.js";

type Size = "sm" | "md" | "lg";

export interface SpinnerProps {
  size?: Size;
  /** Announced by assistive technology while the spinner is shown. Default `"Loading"`. */
  accessibilityLabel?: string;
}

// Numeric sizes (Android, web) and the two sizes iOS accepts: it ignores numbers.
const ANDROID_SIZE: Record<Size, number> = { sm: 16, md: 24, lg: 32 };
const IOS_SIZE: Record<Size, "small" | "large"> = { sm: "small", md: "small", lg: "large" };
const DEFAULT_LABEL = "Loading";

export function Spinner({ size = "md", accessibilityLabel = DEFAULT_LABEL }: SpinnerProps) {
  const { colors } = useTheme();

  return (
    <View accessible accessibilityRole="progressbar" accessibilityLabel={accessibilityLabel} accessibilityState={{ busy: true }}>
      <ActivityIndicator size={Platform.OS === "ios" ? IOS_SIZE[size] : ANDROID_SIZE[size]} color={colors.primary} />
    </View>
  );
}
