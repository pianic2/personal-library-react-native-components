import type { ComponentProps } from "react";
import type {
  AlertProps,
  BProps,
  BadgeProps,
  BottomBarProps,
  BoxProps,
  ButtonProps,
  CardProps,
  CheckboxProps,
  CodeInlineProps,
  ColumnProps,
  DividerProps,
  FormFieldProps,
  HeadingProps,
  InputProps,
  LinkProps,
  NavBarProps,
  PProps,
  PasswordInputProps,
  ProgressBarProps,
  QuoteProps,
  RadioGroupProps,
  RowProps,
  SideBarProps,
  SmallProps,
  SpinnerProps,
  SwitchProps,
  TextGroupProps,
  TextProps,
  TextareaProps,
  Theme,
  ThemeProviderProps,
  TopBarProps,
} from "../../src/index";
import type { BottomSheet, Modal, Popover, Select, Tooltip } from "../../src/index";

/** Compile-time assertion helpers. A failing Expect<...> breaks `npm run typecheck:contracts`. */
export type Equal<A, B> =
  (<T>() => T extends A ? 1 : 2) extends <T>() => T extends B ? 1 : 2 ? true : false;
export type Expect<T extends true> = T;
export type Not<T extends boolean> = T extends true ? false : true;
/** True when every key in K exists on T (a renamed or removed prop turns this into false). */
export type HasKeys<T, K extends PropertyKey> = [K] extends [keyof T] ? true : false;
/** The keys of T that callers must provide. */
export type RequiredKeys<T> = {
  [K in keyof T]-?: object extends Pick<T, K> ? never : K;
}[keyof T];

// Standalone prop interfaces: the full key set is pinned, so adding, removing or renaming a prop fails here.
export type AlertKeys = Expect<Equal<keyof AlertProps, "title" | "variant" | "message" | "actionLabel" | "onAction">>;
export type BottomBarKeys = Expect<Equal<keyof BottomBarProps, "maxItems">>;
export type ButtonKeys = Expect<
  Equal<keyof ButtonProps, "icon" | "label" | "onPress" | "variant" | "size" | "disabled">
>;
export type CardKeys = Expect<
  Equal<
    keyof CardProps,
    "children" | "style" | "bgColor" | "radius" | "margin" | "padding" | "variant" | "shadow"
  >
>;
export type CheckboxKeys = Expect<
  Equal<keyof CheckboxProps, "checked" | "onChange" | "label" | "disabled" | "checkIcon">
>;
export type DividerKeys = Expect<Equal<keyof DividerProps, "thickness" | "spacing" | "style">>;
export type FormFieldKeys = Expect<
  Equal<
    keyof FormFieldProps,
    | "label"
    | "helperText"
    | "errorText"
    | "required"
    | "variant"
    | "colorScheme"
    | "status"
    | "style"
    | "id"
    | "children"
  >
>;
export type LinkKeys = Expect<
  Equal<
    keyof LinkProps,
    | "href"
    | "children"
    | "variant"
    | "size"
    | "underline"
    | "containerStyle"
    | "style"
    | "activeStyle"
    | "activeContainerStyle"
    | "exact"
    | "onPress"
    | "routerAdapter"
  >
>;
export type NavBarKeys = Expect<
  Equal<
    keyof NavBarProps,
    | "items"
    | "logo"
    | "pathname"
    | "navigate"
    | "layout"
    | "bottomMaxItems"
    | "sidebarWidth"
    | "sidebarVariant"
  >
>;
export type ProgressBarKeys = Expect<Equal<keyof ProgressBarProps, "progress" | "color">>;
export type QuoteKeys = Expect<Equal<keyof QuoteProps, "children">>;
export type RadioGroupKeys = Expect<Equal<keyof RadioGroupProps, "value" | "onChange" | "options">>;
export type SideBarKeys = Expect<Equal<keyof SideBarProps, "width" | "variant">>;
export type SpinnerKeys = Expect<Equal<keyof SpinnerProps, "size">>;
export type SwitchKeys = Expect<Equal<keyof SwitchProps, "value" | "onChange" | "label" | "disabled">>;
export type TopBarKeys = Expect<
  Equal<keyof TopBarProps, "title" | "leftSlot" | "centerSlot" | "rightSlot">
>;

// Props that extend React Native props: the component-specific keys must remain present.
export type BadgeHas = Expect<HasKeys<BadgeProps, "children" | "size" | "variant">>;
export type BoxHas = Expect<
  HasKeys<BoxProps, "padding" | "margin" | "bg" | "radius" | "border" | "shadow" | "style">
>;
export type ColumnHas = Expect<HasKeys<ColumnProps, "gap" | "flex" | "align" | "justify" | "children">>;
export type HeadingHas = Expect<HasKeys<HeadingProps, "level" | "children">>;
export type InputHas = Expect<
  HasKeys<InputProps, "label" | "size" | "error" | "helperText" | "editable" | "leftIcon" | "rightIcon">
>;
export type PasswordInputHas = Expect<
  HasKeys<
    PasswordInputProps,
    | "passwordVisible"
    | "defaultPasswordVisible"
    | "onPasswordVisibilityChange"
    | "showPasswordLabel"
    | "hidePasswordLabel"
    | "label"
  >
>;
export type RowHas = Expect<HasKeys<RowProps, "gap" | "align" | "justify" | "wrap" | "children" | "flex">>;
export type TextHas = Expect<HasKeys<TextProps, "variant" | "size" | "weight" | "align" | "truncate">>;
export type TextGroupHas = Expect<HasKeys<TextGroupProps, "spacing" | "children">>;
export type TextareaHas = Expect<HasKeys<TextareaProps, "label" | "helperText" | "error">>;

// Required props: callers must keep supplying exactly these.
export type RequiredContracts = [
  Expect<Equal<RequiredKeys<ButtonProps>, never>>,
  Expect<Equal<RequiredKeys<CheckboxProps>, "checked" | "onChange">>,
  Expect<Equal<RequiredKeys<SwitchProps>, "value" | "onChange">>,
  Expect<Equal<RequiredKeys<RadioGroupProps>, "onChange" | "options">>,
  Expect<Equal<RequiredKeys<LinkProps>, "href" | "children">>,
  Expect<Equal<RequiredKeys<NavBarProps>, "pathname" | "navigate">>,
  Expect<Equal<RequiredKeys<FormFieldProps>, "children">>,
  Expect<Equal<RequiredKeys<QuoteProps>, "children">>,
  Expect<Equal<RequiredKeys<HeadingProps>, "children">>,
  Expect<Equal<RequiredKeys<ColumnProps>, "children">>,
  Expect<Equal<RequiredKeys<RowProps>, "children">>,
  Expect<Equal<RequiredKeys<BadgeProps>, "children">>,
  Expect<Equal<RequiredKeys<InputProps>, "label">>,
];

// Components without a named props export are still pinned through their component signature.
export type UnnamedPropsStayObjects = [
  Expect<Not<Equal<ComponentProps<typeof BottomSheet>, never>>>,
  Expect<Not<Equal<ComponentProps<typeof Modal>, never>>>,
  Expect<Not<Equal<ComponentProps<typeof Popover>, never>>>,
  Expect<Not<Equal<ComponentProps<typeof Select>, never>>>,
  Expect<Not<Equal<ComponentProps<typeof Tooltip>, never>>>,
];

// Theme and provider contracts.
export type ThemeContracts = [
  Expect<HasKeys<Theme, "space" | "radius" | "typography" | "colors">>,
  Expect<HasKeys<ThemeProviderProps, "children">>,
];

// Aliases of Text keep following Text.
export type TextAliasContracts = [
  Expect<Equal<BProps, TextProps>>,
  Expect<Equal<PProps, TextProps>>,
  Expect<Equal<SmallProps, TextProps>>,
  Expect<Equal<CodeInlineProps, TextProps>>,
];
