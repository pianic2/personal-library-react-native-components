// ui/components/form/RadioGroup.tsx

import React from "react";
import { Pressable, View } from "react-native";
import { useTheme } from "../../theme/useTheme.js";
import { Text } from "../Text/Text.js";

export interface RadioGroupOption {
  label: string;
  value: string;
  /** Disables this option only. */
  disabled?: boolean;
}
export interface RadioGroupProps {
  value?: string;
  onChange: (v: string) => void;
  options: RadioGroupOption[];
  /** Disables every option. */
  disabled?: boolean;
  /** Names the group for assistive technology. */
  accessibilityLabel?: string;
}

// Typed constants instead of inline numbers: touch target, circle, dot and the disabled opacity.
const TOUCH_TARGET = 44;
const CIRCLE = 22;
const CIRCLE_BORDER = 2;
const DOT = 12;
const DISABLED_OPACITY = 0.5;

export function RadioGroup({ value, onChange, options, disabled: groupDisabled = false, accessibilityLabel }: RadioGroupProps) {
  const { theme, colors } = useTheme();
  return (
    <View accessibilityRole="radiogroup" accessibilityLabel={accessibilityLabel}>
      {options.map((opt) => {
        const selected = value === opt.value;
        const disabled = groupDisabled || opt.disabled === true;
        return (
          <Pressable
            key={opt.value}
            accessibilityRole="radio"
            accessibilityLabel={opt.label}
            // `disabled` is only reported when it is true, so the state of an enabled option stays { selected, checked }.
            accessibilityState={disabled ? { selected, checked: selected, disabled: true } : { selected, checked: selected }}
            disabled={disabled}
            onPress={() => onChange(opt.value)}
            style={{ flexDirection: "row", alignItems: "center", minWidth: TOUCH_TARGET, minHeight: TOUCH_TARGET, marginVertical: theme.space.xs, opacity: disabled ? DISABLED_OPACITY : 1 }}
          >
            <View style={{ width: CIRCLE, height: CIRCLE, borderRadius: CIRCLE, borderWidth: CIRCLE_BORDER, borderColor: colors.primary, alignItems: "center", justifyContent: "center" }}>
              {selected && <View style={{ width: DOT, height: DOT, borderRadius: DOT, backgroundColor: colors.primary }} />}
            </View>
            <Text style={{ marginLeft: theme.space.sm }}>{opt.label}</Text>
          </Pressable>
        );
      })}
    </View>
  );
}
