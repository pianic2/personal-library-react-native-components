import React, { useId } from "react";
import { View, ViewStyle } from "react-native";
import { useTheme } from "../../theme/useTheme.js";
import { P } from "../P/P.js";
import { Small } from "../Small/Small.js";
import { B } from "../B/B.js";
import { Input } from "../Input/Input.js";
import { PasswordInput } from "../PasswordInput/PasswordInput.js";
import { Select } from "../Select/Select.js";
import { Textarea } from "../Textarea/Textarea.js";

type FormStatus = "default" | "error" | "success" | "warning";

/** Field styles a child control can opt into (forwarded only to a child that has the prop). */
export type FormFieldVariant = "outline" | "filled" | "unstyled";
/** Colour schemes a child control can opt into (forwarded only to a child that has the prop). */
export type FormFieldColorScheme = "primary" | "secondary" | "danger";

export interface FormFieldProps {
  label?: string;
  helperText?: string;
  errorText?: string;
  required?: boolean;

  // styling / semantica extra
  variant?: FormFieldVariant;
  colorScheme?: FormFieldColorScheme;
  status?: FormStatus;

  style?: ViewStyle | ViewStyle[];
  id?: string;

  // campo di input (Input, Select, ecc.)
  children: React.ReactElement;
}

/** Controls of this library that take `error`: they get it from the FormField even when the caller did not pass the prop. */
const ERROR_AWARE_CONTROLS: ReadonlySet<unknown> = new Set([Input, PasswordInput, Select, Textarea]);

export function FormField({
  label,
  helperText,
  errorText,
  required = false,
  variant,
  colorScheme,
  status = "default",
  style,
  id,
  children,
}: FormFieldProps) {
  const { theme, colors } = useTheme();
  const reactId = useId();
  const baseId = id || `field-${reactId}`;

  const hasError = Boolean(errorText) || status === "error";
  const finalStatus: FormStatus = hasError ? "error" : status;

  // Only the text that is rendered can be referenced: the error replaces the helper text.
  const showError = hasError && Boolean(errorText);
  const helperId = helperText && !showError ? `${baseId}-helper` : undefined;
  const errorId = showError ? `${baseId}-error` : undefined;
  const describedById = [helperId, errorId].filter(Boolean).join(" ") || undefined;

  const isElement = React.isValidElement(children);
  const childProps: Record<string, unknown> = isElement && children.props && typeof children.props === "object" ? (children.props as Record<string, unknown>) : {};
  const has = (...keys: string[]) => keys.some((key) => key in childProps);

  // The child's own value always wins; the FormField only fills in what the child leaves out.
  const extraChildProps: Record<string, unknown> = {};
  if (has("error") || ERROR_AWARE_CONTROLS.has(isElement ? children.type : undefined)) extraChildProps.error = childProps.error ?? hasError;
  if (has("status")) extraChildProps.status = childProps.status ?? finalStatus;
  if (has("variant") && variant) extraChildProps.variant = childProps.variant ?? variant;
  if (has("colorScheme") && colorScheme) extraChildProps.colorScheme = childProps.colorScheme ?? colorScheme;
  if (has("aria-invalid", "ariaInvalid") && hasError) extraChildProps["aria-invalid"] = childProps["aria-invalid"] ?? childProps.ariaInvalid ?? true;
  if (has("aria-describedby", "ariaDescribedBy") && describedById) extraChildProps["aria-describedby"] = childProps["aria-describedby"] ?? childProps.ariaDescribedBy ?? describedById;
  // The error is read out with the control, not only as a separate text.
  if (errorText && childProps.accessibilityHint === undefined) extraChildProps.accessibilityHint = errorText;

  const childWithProps = isElement ? React.cloneElement(children, extraChildProps) : children;

  return (
    <View style={[{ width: "100%", marginBottom: theme.spacing[16] }, style]}>
      {/* LABEL */}
      {label && (
        <P style={{ marginBottom: theme.space.sm, color: colors.textPrimary }}>
          <B>{label}</B>
          {required && <Small style={{ color: colors.error }}> *</Small>}
        </P>
      )}

      {/* CAMPO */}
      {childWithProps}

      {/* HELPER / ERROR */}
      {showError ? (
        // polite live region: the message is announced when it appears; nativeID links it with aria-describedby
        <Small nativeID={errorId} accessibilityLiveRegion="polite" style={{ marginTop: theme.space.xs, color: colors.error }}>
          {errorText}
        </Small>
      ) : helperText ? (
        <Small nativeID={helperId} style={{ marginTop: theme.space.xs, color: colors.textMuted }}>
          {helperText}
        </Small>
      ) : null}
    </View>
  );
}
