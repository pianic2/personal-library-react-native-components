# PLRNUI-4 - Root API Proposal

Target import:

```ts
import { ... } from "@personal-library/react-native-components";
```

This is a proposal only. No source exports or package metadata were changed.

## Components

Recommended root API should stay small and include only components that are documented, reusable, and intended for consumer code:

```ts
Button
Box
Column
Stack
Row
Divider
P
B
Small
Quote
Text
TextGroup
Heading
Spinner
Alert
Badge
Input
Switch
Checkbox
RadioGroup
FormField
NavProvider
Link
NavBar
```

HUMAN REVIEW REQUIRED:

- `Stack`: PLRNUI-26 keeps it root-reachable as a public-candidate layout primitive alias for `Column`; stable naming still requires final owner approval.
- `TopBar`, `BottomBar`, `SideBar`: navigation components are documented but platform and behavior stability are not yet clear.
- `Select`: useful form component, but modal/select behavior and accessibility need stabilization.
- `Code`, `Page`, `Hero`: documented but may be too app-specific or incomplete for stable root API.

## Props/types

Root should export props for every root-public component:

```ts
ButtonProps
BoxProps
ColumnProps
RowProps
DividerProps
PProps
BProps
SmallProps
QuoteProps
TextProps
TextGroupProps
HeadingProps
SpinnerProps
AlertProps
BadgeProps
InputProps
SwitchProps
CheckboxProps
RadioGroupProps
RadioGroupOption
FormFieldProps
NavItem
LinkProps
NavBarProps
```

Current gap: many props interfaces are not exported from their modules or barrels. This document does not propose changing code in PLRNUI-4.

## Providers

Recommended root provider exports:

```ts
ThemeProvider
NavProvider
```

HUMAN REVIEW REQUIRED:

- Decide whether `ToastProvider` is root API, experimental subpath API, or excluded until platform behavior is stable.
- Decide whether `ThemeProvider` should keep safe-area and scroll wrappers as part of its public contract.

## Hooks

Recommended root hook exports:

```ts
useTheme
useBreakpoint
useNav
```

Possible root hook exports after explicit approval:

```ts
useNavigate
useDebounce
useToggle
```

Explicitly exclude from root stable API:

```ts
useThemeContext
useToastContext
useOptionalNav
useNavItems
useNavLogo
useNavPathname
useIsMounted
```

HUMAN REVIEW REQUIRED: decide whether generic hooks belong to this UI package public contract or should live under `hooks` only. PLRNUI-26 treats `useNavigate` as a root-reachable experimental navigation hook, while `useIsMounted` is an internal helper excluded from root.

## Tokens

Recommended root token/theme type exports:

```ts
Theme
ThemeMode
TokensSnapshot
TokenPair
createTheme
```

HUMAN REVIEW REQUIRED:

- `auraTokens` and `getAuraTokens` have legacy naming and are removed from the future API contract. Do not keep or introduce AURA compatibility aliases.
- `GlassMaterialTokens` currently exposes experimental liquid/glass theme internals.

## Token Export Naming

Canonical public token exports should use neutral theme-oriented names.

Stable target:

- `themeTokens`

Conditional target:

- `getThemeTokens`, only if a function accessor remains necessary.

Legacy AURA-branded exports are deprecated and removed from the future API contract:

- `auraTokens`
- `getAuraTokens`

No compatibility aliases should be introduced for AURA-branded token names.

## PLRNUI-26 Internal and Experimental Export Fencing

PLRNUI-26 keeps the package root as an explicit named export surface:

- no root `export *`;
- no `/experimental` or `/internal` package entrypoint;
- no stable promotion for any component;
- internal helpers are excluded from root;
- experimental overlays and navigation/app-shell APIs may remain root-exported before stable only when explicitly documented as experimental.

Root-fenced internal helpers:

```ts
cn
useIsMounted
```

Explicit experimental root exports retained pre-stable:

```ts
BottomSheet
Modal
Popover
Select
Tooltip
BottomBar
SideBar
useNavigate
```

`Stack` remains root-exported as a public-candidate layout primitive alias for `Column`.

`getAuraTokens` remains root-exported only as a legacy/deprecated compatibility export. It is not future stable naming; the future target remains neutral token naming such as `themeTokens` or `getThemeTokens` if an accessor remains required.

## Explicit exclusions

These should not be root stable API without a separate decision:

```ts
Card
CodeInline
ProgressBar
PasswordInput
Textarea
Modal
BottomSheet
Tooltip
Popover
ToastProvider
useToast
TokenStorage
getStoredTheme
setStoredTheme
cn
mergeStyles
isWeb
isIOS
isAndroid
isMobile
SafeAreaInsets
withSafeAreaPadding
createLiquidglassTheme
liquidglassTheme
liquidglassDarkTheme
ThemeMeta
liquidglassMeta
liquidglassLightColors
liquidglassDarkColors
resolveLiquidglassColors
liquidglassGlassTokens
```

## Human review required

- Confirm the exact root API size before changing any barrel export.
- Confirm whether documented but broken/partial components should stay root-public as `experimental` or be removed from root in a major release.
- Confirm token naming strategy for AURA legacy symbols.
- Confirm whether root should include only stable/beta UI primitives or also convenience hooks/utilities.
