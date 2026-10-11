import type { ComponentProps } from "react";
import type {
  AlertProps,
  BProps,
  Breakpoint,
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
  LinkRouterAdapter,
  NavItem,
  RadioGroupOption,
  SideBarVariant,
  Theme,
  ThemeAppShellProps,
  ThemeMode,
  ThemeProviderProps,
  ThemeStorageAdapter,
  ThemeTokens,
  TokenPair,
  TopBarProps,
} from "../../src/index";
import type {
  BottomSheet,
  Modal,
  NavProvider,
  Popover,
  Select,
  ThemeAppShell,
  ThemeProvider,
  Tooltip,
  createThemeTokens,
  isAndroid,
  isIOS,
  isWeb,
  useBreakpoint,
} from "../../src/index";

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
  Expect<Equal<RequiredKeys<AlertProps>, never>>,
  Expect<Equal<RequiredKeys<BottomBarProps>, never>>,
  Expect<Equal<RequiredKeys<CardProps>, never>>,
  Expect<Equal<RequiredKeys<DividerProps>, never>>,
  Expect<Equal<RequiredKeys<ProgressBarProps>, never>>,
  Expect<Equal<RequiredKeys<SideBarProps>, never>>,
  Expect<Equal<RequiredKeys<SpinnerProps>, never>>,
  Expect<Equal<RequiredKeys<TextGroupProps>, "children">>,
  Expect<Equal<RequiredKeys<TextareaProps>, "label">>,
  Expect<Equal<RequiredKeys<TopBarProps>, never>>,
  Expect<Equal<RequiredKeys<TextProps>, never>>,
  Expect<Equal<RequiredKeys<BoxProps>, never>>,
  Expect<Equal<RequiredKeys<PasswordInputProps>, "label">>,
];

// Components whose props interface is not exported are pinned through their component signature.
export type UnnamedPropsContracts = [
  Expect<Equal<keyof ComponentProps<typeof Select>, "options" | "value" | "onChange" | "placeholder" | "error">>,
  Expect<Equal<RequiredKeys<ComponentProps<typeof Select>>, "options" | "onChange">>,
  Expect<
    Equal<keyof ComponentProps<typeof Modal>, "visible" | "onClose" | "children" | "size" | "dismissOnBackdrop">
  >,
  Expect<Equal<RequiredKeys<ComponentProps<typeof Modal>>, "visible" | "onClose" | "children">>,
  Expect<
    Equal<keyof ComponentProps<typeof Popover>, "renderTrigger" | "children" | "placement" | "gap">
  >,
  Expect<Equal<RequiredKeys<ComponentProps<typeof Popover>>, "renderTrigger" | "children">>,
  Expect<Equal<keyof ComponentProps<typeof Tooltip>, "content" | "placement" | "delay" | "children">>,
  Expect<Equal<RequiredKeys<ComponentProps<typeof Tooltip>>, "content" | "children">>,
  Expect<
    Equal<keyof ComponentProps<typeof BottomSheet>, "visible" | "onClose" | "snap" | "header" | "children">
  >,
  Expect<Equal<RequiredKeys<ComponentProps<typeof BottomSheet>>, "visible" | "onClose" | "children">>,
];

// Theme and provider contracts.
export type ThemeContracts = [
  Expect<
    Equal<
      keyof Theme,
      | "colors"
      | "mode"
      | "spacing"
      | "space"
      | "radius"
      | "typography"
      | "shadows"
      | "zIndex"
      | "size"
      | "semantic"
      | "textStyles"
      | "elevation"
      | "motion"
      | "density"
      | "breakpoints"
      | "borderWidth"
      | "opacity"
      | "preset"
      | "components"
      | "materials"
      | "globalStyles"
      | "screens"
    >
  >,
  Expect<Equal<RequiredKeys<Theme>, "colors" | "spacing" | "space" | "radius" | "typography" | "shadows" | "zIndex" | "size" | "semantic" | "textStyles" | "elevation" | "motion" | "density" | "breakpoints" | "borderWidth" | "opacity" | "preset" | "components">>,
  Expect<Equal<RequiredKeys<Theme["components"]>, "button" | "input">>,
  Expect<
    Equal<
      keyof ThemeProviderProps,
      "initialMode" | "children" | "themeOverrides" | "storage" | "storageKey" | "persistTheme"
    >
  >,
  Expect<Equal<RequiredKeys<ThemeProviderProps>, "children">>,
  Expect<
    Equal<
      keyof ThemeAppShellProps,
      "children" | "scroll" | "style" | "contentContainerStyle" | "showsVerticalScrollIndicator"
    >
  >,
  Expect<Equal<RequiredKeys<ThemeAppShellProps>, "children">>,
  Expect<Equal<ThemeMode, "light" | "dark">>,
  Expect<Equal<keyof ThemeStorageAdapter, "getItem" | "setItem" | "removeItem">>,
  Expect<Equal<keyof ComponentProps<typeof ThemeAppShell>, keyof ThemeAppShellProps>>,
  Expect<Equal<keyof ComponentProps<typeof ThemeProvider>, keyof ThemeProviderProps>>,
];

// Token types.
export type TokenContracts = [
  Expect<Equal<keyof TokenPair, "access" | "refresh">>,
  Expect<Equal<TokenPair["access"], string>>,
  Expect<HasKeys<ThemeTokens, "typography">>,
  Expect<Equal<ReturnType<typeof createThemeTokens>, ThemeTokens>>,
];

// Remaining root type exports.
export type RootTypeExports = [
  Expect<Equal<keyof RadioGroupOption, "label" | "value">>,
  Expect<Equal<SideBarVariant, "fixed" | "embedded">>,
  Expect<Equal<keyof LinkRouterAdapter, "navigate">>,
  Expect<HasKeys<NavItem, "label" | "href">>,
  Expect<Equal<RequiredKeys<NavItem>, "label" | "href">>,
  Expect<HasKeys<ComponentProps<typeof NavProvider>, "items" | "logo" | "pathname" | "navigate" | "children">>,
  Expect<Equal<RequiredKeys<ComponentProps<typeof NavProvider>>, "items" | "pathname" | "navigate" | "children">>,
];

// Aliases of Text keep following Text.
export type TextAliasContracts = [
  Expect<Equal<BProps, TextProps>>,
  Expect<Equal<PProps, TextProps>>,
  Expect<Equal<SmallProps, TextProps>>,
  Expect<Equal<CodeInlineProps, TextProps>>,
];

// Hooks and platform flags.
export type HookAndUtilContracts = [
  Expect<Equal<Breakpoint, "base" | "sm" | "md" | "lg" | "xl">>,
  Expect<Equal<ReturnType<typeof useBreakpoint>, Breakpoint>>,
  Expect<Equal<typeof isWeb, boolean>>,
  Expect<Equal<typeof isIOS, boolean>>,
  Expect<Equal<typeof isAndroid, boolean>>,
];
