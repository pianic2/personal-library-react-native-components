// ui/components/form/Checkbox.tsx

import React from "react";
import { Pressable, View } from "react-native";
import { useTheme } from "../../theme/useTheme.js";
import { Text } from "../Text/Text.js";

export interface CheckboxProps {
  checked: boolean;
  onChange: (v: boolean) => void;
  label?: string;
  disabled?: boolean;
  checkIcon?: React.ReactNode;
  /** Neither fully checked nor unchecked (a parent of a partly selected group). Reported as `checked: "mixed"`; pressing still calls `onChange(!checked)`. */
  indeterminate?: boolean;
  /** Draws the box in the error colour. Pair it with visible text; assistive technology gets no extra state from it. */
  invalid?: boolean;
}

// Typed constants instead of inline numbers: touch target, box, glyph and the disabled opacity.
const TOUCH_TARGET = 44;
const BOX = 22;
const BOX_BORDER = 2;
const GLYPH_LINE_HEIGHT = 18;
const DISABLED_OPACITY = 0.5;

export function Checkbox({ checked, onChange, label, disabled = false, checkIcon, indeterminate = false, invalid = false }: CheckboxProps) {
  const { theme, colors } = useTheme();
  const filled = checked || indeterminate;
  return (
    <Pressable
      accessibilityRole="checkbox"
      accessibilityLabel={label}
      accessibilityState={{ checked: indeterminate ? "mixed" : checked, disabled }}
      disabled={disabled}
      onPress={() => onChange(!checked)}
      style={{ flexDirection: "row", alignItems: "center", minWidth: TOUCH_TARGET, minHeight: TOUCH_TARGET, opacity: disabled ? DISABLED_OPACITY : 1 }}
    >
      <View
        style={{
          width: BOX,
          height: BOX,
          borderWidth: BOX_BORDER,
          borderRadius: theme.radius.sm,
          borderColor: invalid ? colors.error : colors.border,
          backgroundColor: filled ? (invalid ? colors.error : colors.primary) : "transparent",
          alignItems: "center",
          justifyContent: "center",
        }}
      >
        {indeterminate ? (
          <Text style={{ color: colors.textInverted, lineHeight: GLYPH_LINE_HEIGHT }}>–</Text>
        ) : (
          checked && (checkIcon ?? <Text style={{ color: colors.textInverted, lineHeight: GLYPH_LINE_HEIGHT }}>✓</Text>)
        )}
      </View>
      {label && <Text style={{ marginLeft: theme.space.sm }}>{label}</Text>}
    </Pressable>
  );
}
