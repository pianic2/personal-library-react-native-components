import React from "react";
import type { RefObject } from "react";
import { Text, type TextProps } from "../Text/Text.js";
import { useTheme } from "../../theme/useTheme.js";

/** A control that can receive focus, for example the ref of a `TextInput`. */
export type FocusTarget = { focus(): void };

export interface LabelProps extends Omit<TextProps, "children" | "size" | "variant" | "onPress"> {
  children?: React.ReactNode;
  /** Shows a `*` in the error colour and adds ", required" to the accessibility label. Wins over `optional`. */
  required?: boolean;
  /** Appends a muted "(optional)". */
  optional?: boolean;
  /** Mutes the label and ignores presses. */
  disabled?: boolean;
  size?: "sm" | "md";
  /** Called on press; with `htmlFor` the referenced control is focused first. */
  onPress?: () => void;
  /** The control this label belongs to: pressing the label focuses it. */
  htmlFor?: RefObject<FocusTarget | null>;
  /** Id that controls can reference with `accessibilityLabelledBy`. */
  nativeID?: string;
}

/** The text of the children when they are plain strings or numbers, for the accessibility label. */
function textOf(children: React.ReactNode): string {
  return React.Children.toArray(children)
    .map((child) => (typeof child === "string" || typeof child === "number" ? String(child) : ""))
    .join("");
}

/**
 * A label for form controls and custom controls. `required` adds a marker and a ", required" suffix to the
 * accessibility label (an explicit `accessibilityLabel` is used as the base), `optional` adds a muted "(optional)",
 * `disabled` mutes it. Give it a `nativeID` so a control can reference it with `accessibilityLabelledBy`.
 *
 * Pressing the label calls `onPress` and focuses the control in `htmlFor`; this is a pointer convenience, the control
 * itself stays the accessible target.
 */
export function Label({
  children,
  required = false,
  optional = false,
  disabled = false,
  size = "md",
  onPress,
  htmlFor,
  nativeID,
  accessibilityLabel,
  accessibilityState,
  ...rest
}: LabelProps) {
  const { theme } = useTheme();
  const interactive = !disabled && (onPress !== undefined || htmlFor !== undefined);
  const base = accessibilityLabel ?? textOf(children);
  const spoken = required ? `${base}, required` : base;

  return (
    <Text
      {...rest}
      nativeID={nativeID}
      size={size}
      weight="medium"
      align="left"
      variant={disabled ? "muted" : "default"}
      accessibilityLabel={required || accessibilityLabel !== undefined ? spoken : undefined}
      accessibilityState={disabled ? { ...accessibilityState, disabled: true } : accessibilityState}
      onPress={
        interactive
          ? () => {
              htmlFor?.current?.focus();
              onPress?.();
            }
          : undefined
      }
    >
      {children}
      {required ? (
        <Text size={size} weight="medium" variant="danger" accessibilityElementsHidden importantForAccessibility="no-hide-descendants">
          {" *"}
        </Text>
      ) : optional ? (
        <Text size={size} variant="muted" style={{ marginLeft: theme.space.xs }}>
          {" (optional)"}
        </Text>
      ) : null}
    </Text>
  );
}
