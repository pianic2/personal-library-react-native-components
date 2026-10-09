import type { ComponentProps } from "react";
import type { TextProps as RNTextProps } from "react-native";
import type {
  BProps,
  BadgeProps,
  ColumnProps,
  InputProps,
  PasswordInputProps,
  TextProps,
  TextareaProps,
  Theme,
} from "../../src/index";
import type { Column, Stack } from "../../src/index";
import type { Equal, Expect, HasKeys } from "./props-contracts";

// Stack is an alias of Column and must keep the same props.
export type StackIsColumn = Expect<Equal<ComponentProps<typeof Stack>, ComponentProps<typeof Column>>>;

// B aliases Text; Badge extends the React Native text props (not the library Text props).
export type TextFamily = [
  Expect<Equal<BProps, TextProps>>,
  Expect<HasKeys<BadgeProps, keyof RNTextProps>>,
];

// Text size and weight follow the theme scale rather than free strings.
type FontSizeKey = keyof Theme["typography"]["fontSize"];
type FontWeightKey = keyof Theme["typography"]["fontWeight"];
export type TextScale = [
  Expect<Equal<NonNullable<TextProps["size"]>, FontSizeKey>>,
  Expect<Equal<NonNullable<TextProps["weight"]>, FontWeightKey>>,
];

// Textarea derives from Input and removes multiline controls it owns.
export type TextareaFromInput = [
  Expect<HasKeys<TextareaProps, Exclude<keyof InputProps, "multiline" | "textAlignVertical">>>,
  Expect<Equal<"multiline" extends keyof TextareaProps ? true : false, false>>,
  Expect<Equal<"textAlignVertical" extends keyof TextareaProps ? true : false, false>>,
];

// PasswordInput owns the secure entry and right icon; the visibility API replaces them.
export type PasswordFromInput = [
  Expect<Equal<"rightIcon" extends keyof PasswordInputProps ? true : false, false>>,
  Expect<Equal<"secureTextEntry" extends keyof PasswordInputProps ? true : false, false>>,
  Expect<HasKeys<PasswordInputProps, "passwordVisible" | "onPasswordVisibilityChange">>,
  // Everything else is inherited from Input: same keys, same requiredness.
  Expect<HasKeys<PasswordInputProps, Exclude<keyof InputProps, "rightIcon" | "secureTextEntry">>>,
  Expect<
    Equal<
      Omit<PasswordInputProps, "passwordVisible" | "defaultPasswordVisible" | "onPasswordVisibilityChange" | "showPasswordLabel" | "hidePasswordLabel">,
      Omit<InputProps, "rightIcon" | "secureTextEntry">
    >
  >,
];
