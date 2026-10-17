import React, { createContext, useCallback, useContext, useEffect, useId, useMemo, useState } from "react";
import { Platform, View, type StyleProp, type ViewProps, type ViewStyle } from "react-native";
import { useVariants } from "../../theme/useVariants.js";
import { Label, type LabelProps } from "../Label/Label.js";
import { Small, type SmallProps } from "../Small/Small.js";
import { fieldVariants } from "./field.variants.js";

export type FieldStatus = "default" | "error" | "success" | "warning";

export interface FieldProps extends Omit<ViewProps, "children" | "style"> {
  /** Field name; it prefixes the generated ids, which stay unique per instance. */
  name?: string;
  /** Visual and semantic status. An `error` status, or a displayed `Field.Error`, marks the control invalid. Default `"default"`. */
  status?: FieldStatus;
  /** Shows the required marker on the label. */
  required?: boolean;
  /** Mutes the label and marks the control disabled. */
  disabled?: boolean;
  style?: StyleProp<ViewStyle>;
  testID?: string;
  children?: React.ReactNode;
}

/** What `useField()` returns: the ids of the parts and the resolved state. */
export interface FieldContextValue {
  /** Id for the control (`nativeID`). */
  nativeID: string;
  labelId: string;
  hintId: string;
  errorId: string;
  /** The `status` prop, or `"error"` while a `Field.Error` message is displayed. */
  status: FieldStatus;
  required: boolean;
  disabled: boolean;
}

/** The props a control spreads to be labelled, described and flagged by its Field. */
export interface FieldControlAttributes {
  nativeID?: string;
  accessibilityLabelledBy?: string;
  /** Space-separated ids of the hint and error that are displayed. */
  accessibilityDescribedBy?: string;
  /** Web `aria-describedby`, same value as `accessibilityDescribedBy`. */
  "aria-describedby"?: string;
  accessibilityState?: { disabled?: boolean };
  "aria-invalid"?: boolean;
  /** Native fallback: the error message, or the hint when there is no error (plain string children only). */
  accessibilityHint?: string;
}

type Kind = "hint" | "error";
type Registered = Record<Kind, { text: string | undefined } | null>;

interface InternalContext extends FieldContextValue {
  /** Registers a displayed hint or error with its text; returns the unregister function. */
  register: (kind: Kind, text: string | undefined) => () => void;
  registered: Registered;
}

const FieldContext = createContext<InternalContext | null>(null);

function useInternal(part: string): InternalContext {
  const context = useContext(FieldContext);
  if (!context) throw new Error(`[ui/Field] ${part} must be rendered inside <Field>.`);
  return context;
}

/** The ids and state of the enclosing Field. Throws outside a Field. */
export function useField(): FieldContextValue {
  const { nativeID, labelId, hintId, errorId, status, required, disabled } = useInternal("useField()");
  return useMemo(() => ({ nativeID, labelId, hintId, errorId, status, required, disabled }), [nativeID, labelId, hintId, errorId, status, required, disabled]);
}

/**
 * The props a control spreads (`<Input {...useFieldControlProps()} />`) to be linked to its Field: the label through
 * `accessibilityLabelledBy`, the displayed hint and error through `accessibilityDescribedBy` / `aria-describedby`,
 * `aria-invalid` for the error status and `accessibilityState.disabled`. Outside a Field it returns an empty object.
 */
export function useFieldControlProps(): FieldControlAttributes {
  const context = useContext(FieldContext);
  return useMemo(() => {
    if (!context) return {};
    const { nativeID, labelId, hintId, errorId, status, disabled, registered } = context;
    const describedBy = [registered.hint ? hintId : undefined, registered.error ? errorId : undefined].filter(Boolean).join(" ") || undefined;
    return {
      nativeID,
      accessibilityLabelledBy: labelId,
      accessibilityDescribedBy: describedBy,
      "aria-describedby": describedBy,
      accessibilityState: disabled ? { disabled: true } : undefined,
      "aria-invalid": status === "error" ? true : undefined,
      accessibilityHint: registered.error?.text ?? registered.hint?.text,
    };
  }, [context]);
}

function textOf(children: React.ReactNode): string | undefined {
  const text = React.Children.toArray(children)
    .map((child) => (typeof child === "string" || typeof child === "number" ? String(child) : ""))
    .join("");
  return text === "" ? undefined : text;
}

function FieldRoot({ name, status = "default", required = false, disabled = false, style, children, ...rest }: FieldProps) {
  const reactId = useId();
  const base = name ? `${name}-${reactId}` : `field-${reactId}`;
  const [registered, setRegistered] = useState<Registered>({ hint: null, error: null });

  const register = useCallback((kind: Kind, text: string | undefined) => {
    setRegistered((current) => (current[kind] && current[kind]?.text === text ? current : { ...current, [kind]: { text } }));
    return () => setRegistered((current) => (current[kind] ? { ...current, [kind]: null } : current));
  }, []);

  const effective: FieldStatus = registered.error ? "error" : status;
  const value = useMemo<InternalContext>(
    () => ({ nativeID: `${base}-control`, labelId: `${base}-label`, hintId: `${base}-hint`, errorId: `${base}-error`, status: effective, required, disabled, register, registered }),
    [base, effective, required, disabled, register, registered]
  );
  const styles = useVariants(fieldVariants, { status: effective });

  return (
    <FieldContext.Provider value={value}>
      <View {...rest} style={[styles.root, style]}>
        {children}
      </View>
    </FieldContext.Provider>
  );
}

export type FieldLabelProps = Omit<LabelProps, "nativeID" | "required" | "disabled">;

/** The label; it takes the id, `required` and `disabled` from the Field. */
function FieldLabel(props: FieldLabelProps) {
  const { labelId, required, disabled } = useInternal("Field.Label");
  return <Label {...props} nativeID={labelId} required={required} disabled={disabled} />;
}

export type FieldControlWrapperProps = Omit<ViewProps, "children"> & { children?: React.ReactNode };

/** Layout wrapper of the control. The control itself opts in with `useFieldControlProps()`; nothing is cloned. */
function FieldControl({ style, children, ...rest }: FieldControlWrapperProps) {
  useInternal("Field.Control");
  const styles = useVariants(fieldVariants);
  return (
    <View {...rest} style={[styles.control, style]}>
      {children}
    </View>
  );
}

export type FieldHintProps = Omit<SmallProps, "nativeID">;

/** Helper text. While an error message is displayed the hint is hidden but stays part of the control's description. */
function FieldHint({ children, style, ...rest }: FieldHintProps) {
  const { hintId, status, register, registered } = useInternal("Field.Hint");
  const present = children !== undefined && children !== null && children !== false && children !== "";
  const text = textOf(children);
  useEffect(() => (present ? register("hint", text) : undefined), [present, text, register]);
  const styles = useVariants(fieldVariants, { status }, { errorShown: registered.error !== null });
  if (!present) return null;
  return (
    <Small {...rest} nativeID={hintId} style={[styles.hint, style]}>
      {children}
    </Small>
  );
}

export type FieldErrorProps = Omit<SmallProps, "nativeID" | "accessibilityLiveRegion">;

/** Error message in a polite live region (role alert on web). Renders nothing, and is not described, when `children` is falsy. */
function FieldError({ children, style, ...rest }: FieldErrorProps) {
  const { errorId, status, register } = useInternal("Field.Error");
  const present = Boolean(children);
  const text = textOf(children);
  useEffect(() => (present ? register("error", text) : undefined), [present, text, register]);
  const styles = useVariants(fieldVariants, { status });
  if (!present) return null;
  const web = Platform.OS === "web" ? ({ role: "alert" } as object) : undefined;
  return (
    <Small {...rest} {...web} nativeID={errorId} style={[styles.error, style]}>
      {children}
    </Small>
  );
}

/**
 * Compound form field: `Field.Label`, `Field.Control`, `Field.Hint` and `Field.Error` share ids and state through the
 * Field, and the control opts in with `useFieldControlProps()`.
 */
export const Field = Object.assign(FieldRoot, {
  Label: FieldLabel,
  Control: FieldControl,
  Hint: FieldHint,
  Error: FieldError,
});
