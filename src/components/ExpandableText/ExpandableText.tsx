// src/components/ExpandableText/ExpandableText.tsx
// Text clamped to a number of lines with a "read more / show less" toggle that appears only when the text is truncated.

import React, { useState } from "react";
import { Pressable, View, type NativeSyntheticEvent, type StyleProp, type TextLayoutEventData, type ViewStyle } from "react-native";
import { Text } from "../Text/Text.js";
import { defineVariants } from "../../theme/variants.js";
import { useVariants } from "../../theme/useVariants.js";
import { useTheme } from "../../theme/useTheme.js";
import { useControllableState } from "../../hooks/useControllableState.js";

export type ExpandableTextSize = "sm" | "md" | "lg";

// Styling comes from the variants API (E2-06) and semantic tokens only.
const expandableTextVariants = defineVariants(
  (t) => ({
    slots: ["root", "measure", "toggle"],
    base: {
      root: { alignSelf: "stretch" },
      measure: { position: "absolute", left: 0, right: 0, top: 0, opacity: 0 },
      toggle: { color: t.semantic.action.primary },
    },
    variants: {
      size: { sm: {}, md: {}, lg: {} },
    },
    defaultVariants: { size: "md" },
  }),
  { name: "expandable-text" }
);

export interface ExpandableTextProps {
  /** The text. Only a string is supported: truncation is detected from its laid-out lines. */
  children: string;
  /** Lines shown while collapsed. Default 3. */
  numberOfLines?: number;
  /** Controlled expanded state. */
  expanded?: boolean;
  /** Initial expanded state when uncontrolled. Default false. */
  defaultExpanded?: boolean;
  /** Called with the next expanded value when the toggle is pressed. */
  onExpandedChange?: (expanded: boolean) => void;
  /** Toggle label while collapsed. Default "Read more". */
  moreLabel?: string;
  /** Toggle label while expanded. Default "Show less". */
  lessLabel?: string;
  /** Text size token for the body and the toggle. Default `md`. */
  size?: ExpandableTextSize;
  style?: StyleProp<ViewStyle>;
  testID?: string;
}

export function ExpandableText({
  children,
  numberOfLines = 3,
  expanded,
  defaultExpanded = false,
  onExpandedChange,
  moreLabel = "Read more",
  lessLabel = "Show less",
  size = "md",
  style,
  testID,
}: ExpandableTextProps) {
  const { theme } = useTheme();
  const styles = useVariants(expandableTextVariants, { size });
  const [isExpanded, setExpanded] = useControllableState<boolean>({ value: expanded, defaultValue: defaultExpanded, onChange: onExpandedChange });
  // Truncation is measured on an invisible copy without a line limit: the visible text reports fewer lines than it has on some platforms.
  const [truncatable, setTruncatable] = useState(false);

  const onMeasure = (event: NativeSyntheticEvent<TextLayoutEventData>) => {
    setTruncatable(event.nativeEvent.lines.length > numberOfLines);
  };
  const showToggle = truncatable || isExpanded;

  return (
    <View testID={testID} style={[styles.root, style]}>
      <Text size={size} align="left" numberOfLines={isExpanded ? undefined : numberOfLines}>
        {children}
      </Text>
      <Text
        testID={testID ? `${testID}-measure` : undefined}
        size={size}
        align="left"
        pointerEvents="none"
        accessibilityElementsHidden
        importantForAccessibility="no-hide-descendants"
        aria-hidden
        onTextLayout={onMeasure}
        style={styles.measure}
      >
        {children}
      </Text>
      {showToggle ? (
        <Pressable
          accessibilityRole="button"
          accessibilityLabel={isExpanded ? lessLabel : moreLabel}
          accessibilityState={{ expanded: isExpanded }}
          aria-expanded={isExpanded}
          // The visible toggle is one line high; the 44pt target is reached with hit slop (ADR 0014).
          hitSlop={{ top: 12, bottom: 12, left: 12, right: 12 }}
          onPress={() => setExpanded(!isExpanded)}
          style={{ alignSelf: "flex-start", marginTop: theme.space.xs }}
        >
          <Text size={size} weight="medium" style={styles.toggle}>
            {isExpanded ? lessLabel : moreLabel}
          </Text>
        </Pressable>
      ) : null}
    </View>
  );
}
