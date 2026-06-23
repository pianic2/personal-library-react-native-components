import React, { useId } from "react";
import { View, StyleSheet, ViewStyle } from "react-native";
import { useTheme } from "../../theme/useTheme";
import { P } from "../P/P";
import { Small } from "../Small/Small";
import { B } from "../B/B";


type FormStatus = "default" | "error" | "success" | "warning";

export interface FormFieldProps {
  label?: string;
  helperText?: string;
  errorText?: string;
  required?: boolean;

  // styling / semantica extra
  variant?: string; // es: "outline", "filled", "unstyled"
  colorScheme?: string; // es: "primary", "secondary", "danger"
  status?: FormStatus;

  style?: ViewStyle | ViewStyle[];
  id?: string;

  // campo di input (Input, Select, ecc.)
  children: React.ReactElement;
}

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
  const { colors } = useTheme();
  const reactId = useId();
  const baseId = id || `field-${reactId}`;

  const hasError = Boolean(errorText) || status === "error";
  const finalStatus: FormStatus = hasError ? "error" : status;

  const helperId = helperText ? `${baseId}-helper` : undefined;
  const errorId = errorText ? `${baseId}-error` : undefined;
  const describedById =
    [helperId, errorId].filter(Boolean).join(" ") || undefined;

  // Verifica se il child supporta alcune prop specifiche
  const isValidElement = React.isValidElement(children);
  const propsObj: Record<string, unknown> =
    isValidElement && children.props && typeof children.props === "object"
      ? (children.props as Record<string, unknown>)
      : {};

  const supportsErrorProp =
    isValidElement &&
    typeof propsObj === "object" &&
    propsObj !== null &&
    "error" in propsObj;

  const supportsStatusProp =
    isValidElement &&
    typeof propsObj === "object" &&
    propsObj !== null &&
    "status" in propsObj;

  const supportsVariantProp =
    isValidElement &&
    typeof propsObj === "object" &&
    propsObj !== null &&
    "variant" in propsObj;

  const supportsColorSchemeProp =
    isValidElement &&
    typeof propsObj === "object" &&
    propsObj !== null &&
    "colorScheme" in propsObj;

  const supportsAriaInvalidProp =
    isValidElement &&
    typeof propsObj === "object" &&
    propsObj !== null &&
    ("aria-invalid" in propsObj || "ariaInvalid" in propsObj);

  const supportsAriaDescribedByProp =
    isValidElement &&
    typeof propsObj === "object" &&
    propsObj !== null &&
    ("aria-describedby" in propsObj || "ariaDescribedBy" in propsObj);

  // Costruiamo il set di extra props da passare al campo
  const extraChildProps: Record<string, any> = {};

  if (supportsErrorProp) {
    extraChildProps.error = propsObj.error ?? hasError;
  }

  if (supportsStatusProp) {
    extraChildProps.status = propsObj.status ?? finalStatus;
  }

  if (supportsVariantProp && variant) {
    extraChildProps.variant = propsObj.variant ?? variant;
  }

  if (supportsColorSchemeProp && colorScheme) {
    extraChildProps.colorScheme = propsObj.colorScheme ?? colorScheme;
  }

  if (supportsAriaInvalidProp && hasError) {
    // per web (react-native-web) / accessibilità
    extraChildProps["aria-invalid"] =
      propsObj["aria-invalid"] ?? propsObj["ariaInvalid"] ?? true;
  }

  if (supportsAriaDescribedByProp && describedById) {
    extraChildProps["aria-describedby"] =
      propsObj["aria-describedby"] ??
      propsObj["ariaDescribedBy"] ??
      describedById;
  }

  const childWithProps = isValidElement
    ? React.cloneElement(children, extraChildProps)
    : children;

  return (
    <View style={[styles.container, style]}>
      {/* LABEL */}
      {label && (
        <P style={[styles.label, { color: colors.textPrimary }]}>
          <B>{label}</B>
          {required && (
            <Small style={{ color: colors.error }}> *</Small>
          )}
        </P>
      )}

      {/* CAMPO */}
      {childWithProps}

      {/* HELPER / ERROR */}
      {hasError && errorText ? (
        <Small
          // per linking con aria-describedby
          nativeID={errorId}
          style={[styles.error, { color: colors.error }]}
        >
          {errorText}
        </Small>
      ) : helperText ? (
        <Small
          nativeID={helperId}
          style={[styles.helper, { color: colors.textPrimary + "99" }]}
        >
          {helperText}
        </Small>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    width: "100%",
    marginBottom: 16,
  },
  label: {
    marginBottom: 6,
  },
  helper: {
    marginTop: 4,
  },
  error: {
    marginTop: 4,
  },
});
