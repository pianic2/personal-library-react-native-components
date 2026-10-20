// src/components/Chip/Chip.tsx
// A compact, selectable and removable token for filters, multi-select values and tags. Composes Touchable (E4-03).

import React from "react";
import { View, type GestureResponderEvent, type StyleProp, type ViewStyle } from "react-native";
import { Text } from "../Text/Text.js";
import { Touchable } from "../Touchable/index.js";
import { defineVariants } from "../../theme/variants.js";
import { useVariants } from "../../theme/useVariants.js";
import { useTheme } from "../../theme/useTheme.js";

export type ChipVariant = "filled" | "outline" | "soft";
export type ChipSize = "sm" | "md";
export type ChipTone = "primary" | "neutral" | "success" | "warning" | "danger" | "info";

const TOUCH_TARGET = 44;
const HEIGHT = { sm: 32, md: 40 } as const;
const REMOVE_BOX = { sm: 20, md: 24 } as const;
const VARIANTS: readonly ChipVariant[] = ["filled", "outline", "soft"];
const TONES: readonly ChipTone[] = ["primary", "neutral", "success", "warning", "danger", "info"];

// Styling comes from the variants API (E2-06) and semantic tokens only. `look` is the colour treatment: a selectable chip
// that is not selected shows the quiet `idle` look, otherwise the tone colours it.
const chipVariants = defineVariants(
  (t) => {
    const main: Record<ChipTone, string> = {
      primary: t.semantic.action.primary,
      neutral: t.semantic.text.secondary,
      success: t.semantic.feedback.success,
      warning: t.semantic.feedback.warning,
      danger: t.semantic.feedback.error,
      info: t.semantic.feedback.info,
    };
    const looks: Record<string, Record<string, object>> = { idle: { root: { backgroundColor: t.semantic.surface.sunken, borderColor: t.semantic.border.default }, label: { color: t.semantic.text.primary } } };
    const compound = [] as Array<{ when: { variant: ChipVariant; look: string }; style: Record<string, object> }>;
    for (const variant of VARIANTS) {
      compound.push({
        when: { variant, look: "idle" },
        style: variant === "outline" ? { root: { backgroundColor: "transparent" } } : {},
      });
      for (const tone of TONES) {
        const c = main[tone];
        const style =
          variant === "filled"
            ? { root: { backgroundColor: c, borderColor: c }, label: { color: t.semantic.text.inverted }, remove: { color: t.semantic.text.inverted } }
            : variant === "outline"
              ? { root: { backgroundColor: "transparent", borderColor: c }, label: { color: tone === "neutral" ? t.semantic.text.primary : c }, remove: { color: tone === "neutral" ? t.semantic.text.primary : c } }
              : { root: { backgroundColor: t.semantic.surface.sunken, borderColor: t.semantic.surface.sunken }, label: { color: tone === "neutral" ? t.semantic.text.primary : c }, remove: { color: tone === "neutral" ? t.semantic.text.primary : c } };
        compound.push({ when: { variant, look: tone }, style });
      }
    }
    return {
      slots: ["root", "main", "label", "remove"],
      base: {
        root: { flexDirection: "row", alignItems: "center", alignSelf: "flex-start", borderWidth: t.borderWidth.thin, borderRadius: t.radius.full, overflow: "hidden" },
        main: { flexDirection: "row", alignItems: "center", gap: t.space.xs, minHeight: 0, minWidth: 0 },
        label: {},
        remove: { color: t.semantic.text.primary },
      },
      variants: {
        variant: { filled: {}, outline: {}, soft: {} },
        size: {
          sm: { root: { minHeight: HEIGHT.sm }, main: { paddingHorizontal: t.space.sm } },
          md: { root: { minHeight: HEIGHT.md }, main: { paddingHorizontal: t.space.md } },
        },
        look: { idle: looks.idle as never, primary: {}, neutral: {}, success: {}, warning: {}, danger: {}, info: {} },
      },
      compoundVariants: compound as never,
      defaultVariants: { variant: "filled", size: "md", look: "primary" },
    };
  },
  { name: "chip" }
);

export interface ChipProps {
  /** The visible text; it also names the chip and the remove control ("Remove <label>"). */
  label: string;
  /** Makes the chip selectable (role checkbox). Controlled: the Chip keeps no selection state. */
  selected?: boolean;
  /** Called with the next selected value when the chip is pressed. Makes the chip selectable. */
  onSelectedChange?: (selected: boolean) => void;
  /** Called when the chip is pressed, after `onSelectedChange`. Independent of `onRemove`. */
  onPress?: (event: GestureResponderEvent) => void;
  /** Shows the trailing remove control and is called when it is pressed. Never calls `onPress`. */
  onRemove?: () => void;
  /** Structure: `filled` (default), `outline` or `soft`. */
  variant?: ChipVariant;
  size?: ChipSize;
  /** Semantic colour. A selectable chip shows it only while selected. Default `primary`. */
  tone?: ChipTone;
  /** A leading icon. Decorative: it is hidden from assistive technology, the label carries the meaning. */
  leftIcon?: React.ReactNode;
  /** A leading avatar, rendered before `leftIcon`. Decorative like the icon. */
  avatar?: React.ReactNode;
  disabled?: boolean;
  style?: StyleProp<ViewStyle>;
  testID?: string;
}

export function Chip({
  label,
  selected,
  onSelectedChange,
  onPress,
  onRemove,
  variant = "filled",
  size = "md",
  tone = "primary",
  leftIcon,
  avatar,
  disabled = false,
  style,
  testID,
}: ChipProps) {
  const { theme } = useTheme();
  const selectable = selected !== undefined || onSelectedChange !== undefined;
  const isSelected = selected === true;
  const look = selectable && !isSelected ? "idle" : tone;
  const styles = useVariants(chipVariants, { variant, size, look });

  const press = (event: GestureResponderEvent) => {
    onSelectedChange?.(!isSelected);
    onPress?.(event);
  };
  const interactive = selectable || onPress !== undefined;
  const dim = disabled ? theme.components.button.opacity.disabled : 1;

  const decoration = (
    <>
      {avatar ? <View accessibilityElementsHidden importantForAccessibility="no-hide-descendants">{avatar}</View> : null}
      {leftIcon ? <View accessibilityElementsHidden importantForAccessibility="no-hide-descendants">{leftIcon}</View> : null}
      <Text size={size === "sm" ? "sm" : "md"} weight="medium" style={styles.label}>
        {label}
      </Text>
    </>
  );

  // Visible chip height is 32 or 40; the 44pt target is reached with hit slop (ADR 0014), never by enlarging the chip.
  const slop = (box: number) => Math.max(0, Math.ceil((TOUCH_TARGET - box) / 2));
  const mainStyle = [styles.main, { minHeight: HEIGHT[size] - 2 * theme.borderWidth.thin }, disabled ? { opacity: 1 } : null];
  const removeBox = REMOVE_BOX[size];

  return (
    <View testID={testID} style={[styles.root, { opacity: dim }, style]}>
      {interactive ? (
        <Touchable
          role={selectable ? "checkbox" : "button"}
          accessibilityLabel={label}
          selected={selectable ? isSelected : undefined}
          checked={selectable ? isSelected : undefined}
          disabled={disabled}
          onPress={press}
          hitSlop={{ top: slop(HEIGHT[size]), bottom: slop(HEIGHT[size]), left: 0, right: 0 }}
          style={mainStyle}
        >
          {decoration}
        </Touchable>
      ) : (
        <View style={styles.main}>{decoration}</View>
      )}
      {onRemove ? (
        <Touchable
          accessibilityLabel={`Remove ${label}`}
          disabled={disabled}
          onPress={() => onRemove()}
          hitSlop={slop(removeBox)}
          style={{ minHeight: 0, minWidth: 0, width: removeBox, height: removeBox, marginRight: theme.space.xs, borderRadius: theme.radius.full, alignItems: "center", justifyContent: "center", opacity: disabled ? 1 : undefined }}
        >
          <Text size="sm" weight="bold" style={styles.remove} accessibilityElementsHidden importantForAccessibility="no-hide-descendants">
            ✕
          </Text>
        </Touchable>
      ) : null}
    </View>
  );
}
