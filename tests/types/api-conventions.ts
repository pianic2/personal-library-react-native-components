// Type-level helpers for the API conventions of ADR 0014, with negative cases.
// Compiled by `npm run typecheck:contracts`; the runtime check is scripts/check-api-conventions.mjs.
import type { StyleProp, ViewStyle } from "react-native";
import type { ButtonProps, CardProps, HeadingProps, InputProps, ProgressBarProps } from "../../src";

type Equal<A, B> = (<T>() => T extends A ? 1 : 2) extends <T>() => T extends B ? 1 : 2 ? true : false;
type Expect<T extends true> = T;

export type Size = "xs" | "sm" | "md" | "lg";
export type DisplaySize = Size | "xl" | "xxl" | "xxxl";
export type Tone = "primary" | "neutral" | "success" | "warning" | "danger" | "info";

export interface ControlledProps<V> {
  value?: V;
  defaultValue?: V;
  onValueChange?: (value: V) => void;
}

export interface OpenStateProps {
  open?: boolean;
  defaultOpen?: boolean;
  onOpenChange?: (open: boolean) => void;
}

export interface ValidationProps {
  invalid?: boolean;
  error?: string;
}

export interface PassthroughProps {
  style?: StyleProp<ViewStyle>;
  testID?: string;
}

// Positive cases: conforming shapes compile.
export const controlled: ControlledProps<boolean> = { value: true, onValueChange: () => {} };
export const openState: OpenStateProps = { defaultOpen: false, onOpenChange: () => {} };
export const validation: ValidationProps = { invalid: true, error: "Required" };
export const sizeOk: { size: Size } = { size: "lg" };
export const displaySizeOk: { size: DisplaySize } = { size: "xl" };
export const toneOk: { tone: Tone } = { tone: "danger" };

// Negative cases: each line must fail to compile.
// @ts-expect-error `error` holds the message; the boolean state is `invalid`
export const errorBoolean: ValidationProps = { error: true };
// @ts-expect-error `xl` is only allowed on display (typography) components
export const sizeXl: { size: Size } = { size: "xl" };
// @ts-expect-error colour names are not part of `tone`
export const toneColour: { tone: Tone } = { tone: "purple" };
// @ts-expect-error `visible` is not an open-state prop
export const visible: OpenStateProps = { visible: true };
// @ts-expect-error the controlled event is `onValueChange`, not `onChange`
export const onChangeEvent: ControlledProps<string> = { onChange: () => {} };

// Conforming members of the current API (the rest is listed in scripts/api-conventions.baseline.json).
export type _CardPassthrough = Expect<Equal<CardProps["style"] extends PassthroughProps["style"] | undefined ? true : false, true>>;
export type _HeadingDisplaySize = Expect<Equal<NonNullable<HeadingProps["size"]> extends DisplaySize ? true : false, true>>;
export type _InputSize = Expect<Equal<NonNullable<InputProps["size"]> extends Size ? true : false, true>>;
// Known violations, kept visible here until the baseline entries are removed:
// @ts-expect-error `ButtonProps.variant` still carries colour names (baseline: ButtonProps variant-colour)
export type _ButtonVariantIsStructure = Expect<Equal<NonNullable<ButtonProps["variant"]> extends "solid" | "outline" | "ghost" ? true : false, true>>;
// @ts-expect-error `ProgressBarProps.color` still exists (baseline: ProgressBarProps color-prop)
export type _ProgressBarNoColor = Expect<Equal<"color" extends keyof ProgressBarProps ? true : false, false>>;
