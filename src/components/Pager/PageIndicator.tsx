import React from "react";
import { View } from "react-native";
import type { StyleProp, ViewStyle } from "react-native";
import { useVariants } from "../../theme/useVariants.js";
import { pageIndicatorVariants } from "./pager.variants.js";

export interface PageIndicatorProps {
  /** Number of pages (dots). */
  count: number;
  /** Current page, zero-based. */
  index: number;
  /** Dot diameter, a key of the spacing scale. Default `"sm"`. */
  size?: "xs" | "sm" | "md" | "lg";
  /** Replaces the default label "Page X of Y". */
  accessibilityLabel?: string;
  style?: StyleProp<ViewStyle>;
  testID?: string;
}

/** A row of dots, one per page, with the current one highlighted. Announced as one element: "Page X of Y". */
export function PageIndicator({ count, index, size = "sm", accessibilityLabel, style, testID }: PageIndicatorProps) {
  const total = Math.max(Math.floor(count) || 0, 0);
  const current = total === 0 ? 0 : Math.min(Math.max(Math.round(index) || 0, 0), total - 1);
  const idle = useVariants(pageIndicatorVariants, { size });
  const active = useVariants(pageIndicatorVariants, { size }, { active: true });
  const label = accessibilityLabel ?? `Page ${current + 1} of ${total}`;

  return (
    <View
      testID={testID}
      accessible
      accessibilityRole="progressbar"
      accessibilityLabel={label}
      accessibilityValue={{ min: 1, max: Math.max(total, 1), now: current + 1 }}
      style={[idle.root, style]}
    >
      {Array.from({ length: total }, (_, i) => (
        <View
          key={i}
          testID={testID ? `${testID}-dot-${i}` : undefined}
          accessibilityElementsHidden
          importantForAccessibility="no-hide-descendants"
          style={i === current ? active.dot : idle.dot}
        />
      ))}
    </View>
  );
}
