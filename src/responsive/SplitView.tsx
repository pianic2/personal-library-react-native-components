import React, { useContext } from "react";
import { Pressable, Text, View, type StyleProp, type ViewStyle } from "react-native";
import { useTheme } from "../theme/useTheme.js";
import { ResponsiveContext } from "./context.js";
import { classifySize, DEFAULT_SIZE_CLASS_THRESHOLDS } from "./useWindowSizeClass.js";
import { useContainerSize } from "./useContainerSize.js";

/** Default share of the width given to the primary pane, and its clamp in density-independent pixels. */
export const SPLIT_VIEW_DEFAULTS = { ratio: 0.35, minPrimary: 320, maxPrimary: 420 } as const;

export interface SplitViewProps {
  /** The master pane (a list, for example). Always first in reading order. */
  primary: React.ReactNode;
  /** The detail pane. */
  secondary: React.ReactNode;
  /** Compact width only: show the secondary pane instead of the primary one. Ignored when both fit side by side. Default `false`. */
  showSecondary?: boolean;
  /** Compact width only: when set while the secondary pane shows, a back button above it calls this. */
  onBack?: () => void;
  /** Accessible name of the back button. Default `"Back"`. */
  backLabel?: string;
  /** Share of the width given to the primary pane when side by side (0 to 1, exclusive of 0). Default 0.35. */
  ratio?: number;
  /** Smallest primary width in pixels. Default 320. */
  minPrimary?: number;
  /** Largest primary width in pixels; a value below `minPrimary` is raised to it. Default 420. */
  maxPrimary?: number;
  style?: StyleProp<ViewStyle>;
  testID?: string;
}

const positive = (n: unknown, fallback: number): number => (typeof n === "number" && Number.isFinite(n) && n > 0 ? n : fallback);

/** Width of the primary pane: `ratio` of `width`, clamped to `minPrimary`..`maxPrimary`, never wider than `width`. */
export function resolvePrimaryWidth(width: number, ratio?: number, minPrimary?: number, maxPrimary?: number): number {
  const min = positive(minPrimary, SPLIT_VIEW_DEFAULTS.minPrimary);
  const max = Math.max(min, positive(maxPrimary, SPLIT_VIEW_DEFAULTS.maxPrimary));
  const wanted = width * Math.min(1, positive(ratio, SPLIT_VIEW_DEFAULTS.ratio));
  return Math.min(width, Math.min(max, Math.max(min, wanted)));
}

/**
 * Master-detail layout. From the `medium` width class (600 by default) up, the panes sit side by side with a divider and
 * the primary pane has a clamped width. Below it only one pane shows: the primary, or the secondary when `showSecondary`
 * is set. The width is the one of the nearest `Container`, or of the window outside one.
 */
export function SplitView({
  primary,
  secondary,
  showSecondary = false,
  onBack,
  backLabel = "Back",
  ratio,
  minPrimary,
  maxPrimary,
  style,
  testID,
}: SplitViewProps) {
  const { theme } = useTheme();
  const { width } = useContainerSize();
  const { sizeClassThresholds } = useContext(ResponsiveContext);
  const medium = typeof sizeClassThresholds?.width?.medium === "number" ? sizeClassThresholds.width.medium : DEFAULT_SIZE_CLASS_THRESHOLDS.width.medium;
  const expanded = typeof sizeClassThresholds?.width?.expanded === "number" ? sizeClassThresholds.width.expanded : DEFAULT_SIZE_CLASS_THRESHOLDS.width.expanded;
  const sideBySide = classifySize(width, { medium, expanded }) !== "compact";

  if (!sideBySide) {
    return (
      <View testID={testID} style={[{ flex: 1 }, style]}>
        {showSecondary && onBack ? (
          <Pressable
            accessibilityRole="button"
            accessibilityLabel={backLabel}
            onPress={onBack}
            style={{ paddingHorizontal: theme.space.md, paddingVertical: theme.space.sm }}
          >
            <Text style={{ color: theme.colors.textPrimary }}>{backLabel}</Text>
          </Pressable>
        ) : null}
        <View role="region" style={{ flex: 1 }}>
          {showSecondary ? secondary : primary}
        </View>
      </View>
    );
  }

  return (
    <View testID={testID} style={[{ flex: 1, flexDirection: "row" }, style]}>
      <View role="region" style={{ width: resolvePrimaryWidth(width, ratio, minPrimary, maxPrimary) }}>
        {primary}
      </View>
      <View
        accessibilityElementsHidden
        importantForAccessibility="no-hide-descendants"
        style={{ width: theme.borderWidth.hairline, backgroundColor: theme.colors.border }}
      />
      <View role="region" style={{ flex: 1 }}>
        {secondary}
      </View>
    </View>
  );
}
