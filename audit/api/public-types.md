# PLRNUI-4 - Public Props and Types Policy

Rule: props for public components must be exportable. This file lists currently exported props/types and candidate props/types that should become public if the related module is public.

Current-state note for PLRNUI-22: `CardProps`, `ProgressBarProps`, `CodeInlineProps`, `TextareaProps`, `PasswordInputProps`, `BottomBarProps`, `LinkProps`, `LinkRouterAdapter`, `NavBarProps`, `TopBarProps`, `SideBarProps`, `SideBarVariant` and `NavItem` are explicit source types and are exported from the root API through `src/index.ts`.

## Props/types matrix

| Type | Component/module | Current export status | Proposed public? | Reason | Human review |
| --- | --- | --- | --- | --- | --- |
| `ButtonProps` | `Button` | Not exported | Yes | Props for proposed public root component. | HUMAN REVIEW REQUIRED |
| `BoxProps` | `Box` | Not exported | Yes | Props for proposed public layout primitive. | HUMAN REVIEW REQUIRED |
| `ColumnProps` | `Column` / `Stack` | Not exported | Yes | Props for proposed public layout primitive. | HUMAN REVIEW REQUIRED |
| `RowProps` | `Row` | Not exported | Yes | Props for proposed public layout primitive. | HUMAN REVIEW REQUIRED |
| `DividerProps` | `Divider` | Not exported | Yes | Props for proposed public layout primitive. | HUMAN REVIEW REQUIRED |
| `PProps` | `P`, `B`, `Small` | Not exported; local alias only | Yes for `P`, `B`, `Small` | Typography shorthands need wrapper typing. | HUMAN REVIEW REQUIRED |
| `CodeInlineProps` | `CodeInline` | Exported from root | Yes, beta after PLRNUI-21 | PLRNUI-21 fixed size/lineHeight handling and keeps the props type explicit. | HUMAN REVIEW REQUIRED |
| `TextProps` | `Text` | Not exported as component props; imported RN name conflicts | Yes, under explicit name such as `LibraryTextProps` or approved `TextProps` | Core typography props should be public; naming must avoid confusion with React Native `TextProps`. | HUMAN REVIEW REQUIRED |
| `HeadingProps` | `Heading` | Not exported | Yes | Props for proposed public typography component. | HUMAN REVIEW REQUIRED |
| `QuoteProps` | `Quote` | Inline only | Yes | Public component should not expose only inline anonymous props. | HUMAN REVIEW REQUIRED |
| `TextGroupProps` | `TextGroup` | Not exported | Yes | Props for proposed public typography component. | HUMAN REVIEW REQUIRED |
| `PageProps` | `Page` | Exported from source, not from barrel | No for root; maybe experimental | Page is app-layout-like and should not become stable root by accident. | HUMAN REVIEW REQUIRED |
| `CodeProps` | `Code` | Not exported | Maybe | `Code` is experimental until timer/clipboard behavior is hardened. | HUMAN REVIEW REQUIRED |
| `SpinnerProps` | `Spinner` | Not exported | Yes | Props for proposed public feedback component. | HUMAN REVIEW REQUIRED |
| `AlertProps` | `Alert` | Not exported | Yes | Props for proposed public feedback component. | HUMAN REVIEW REQUIRED |
| `ToastProviderProps` | `ToastProvider` | Not exported | No for stable root; maybe experimental | Toast API is not stable and provider uses web-specific implementation details. | HUMAN REVIEW REQUIRED |
| `HoverableProps` | `ToastProvider` internals | Not exported | No | Internal implementation helper. |  |
| `ProgressBarProps` | `ProgressBar` | Exported from root | Yes, beta after PLRNUI-21 | PLRNUI-21 fixed clamped width behavior and keeps the props type explicit. | HUMAN REVIEW REQUIRED |
| `ModalProps` | `Modal` | Not exported | Maybe experimental | Overlay API needs platform behavior decision. | HUMAN REVIEW REQUIRED |
| `BottomSheetProps` | `BottomSheet` | Not exported | Maybe experimental | Overlay API needs gesture/keyboard/snap contract decision. | HUMAN REVIEW REQUIRED |
| `TooltipProps` | `Tooltip` | Not exported | Maybe experimental | Native behavior is not equivalent to web. | HUMAN REVIEW REQUIRED |
| `PopoverProps` | `Popover` | Not exported | Maybe experimental | Native behavior is not equivalent to web. | HUMAN REVIEW REQUIRED |
| `BadgeProps` | `Badge` | Not exported | Yes | Props for proposed public surface component. | HUMAN REVIEW REQUIRED |
| `CardProps` | `Card` | Exported from root | Yes, beta after PLRNUI-21 | PLRNUI-21 removed the hook usage bug and keeps the props type explicit. | HUMAN REVIEW REQUIRED |
| `HeroProps` | `Hero` | Not exported | Maybe experimental | App-layout behavior is not clearly stable library API. | HUMAN REVIEW REQUIRED |
| `InputProps` | `Input` | Not exported | Yes | Props for proposed public form primitive. | HUMAN REVIEW REQUIRED |
| `PasswordInputProps` | `PasswordInput` | Exported from root | Yes, beta after PLRNUI-21 | PLRNUI-21 replaced the alias with an explicit props interface and visibility-toggle contract. | HUMAN REVIEW REQUIRED |
| `SwitchProps` | `Switch` | Not exported | Yes | Props for proposed public form component. | HUMAN REVIEW REQUIRED |
| `CheckboxProps` | `Checkbox` | Not exported | Yes | Props for proposed public form component. | HUMAN REVIEW REQUIRED |
| `RadioGroupProps` | `RadioGroup` | Not exported | Yes | Props for proposed public form component. | HUMAN REVIEW REQUIRED |
| `RadioGroupOption` | `RadioGroup` option shape | Inline object array | Yes | Public radio group needs reusable option type. | HUMAN REVIEW REQUIRED |
| `SelectProps` | `Select` | Not exported | Maybe experimental | Select needs accessibility/platform review before stable API. | HUMAN REVIEW REQUIRED |
| `SelectOption` | `Select` option shape | Inline object array | Maybe experimental | Required if `Select` is exported as public/experimental. | HUMAN REVIEW REQUIRED |
| `FormFieldProps` | `FormField` | Not exported | Yes | Props for proposed public form composition primitive. | HUMAN REVIEW REQUIRED |
| `TextareaProps` | `Textarea` | Exported from root | Yes, beta after PLRNUI-21 | PLRNUI-21 replaced the alias with an explicit props interface and forced multiline behavior. | HUMAN REVIEW REQUIRED |
| `NavItem` | Navigation | Exported through root | Yes | Consumer configuration type for navigation. |  |
| `NavContextValue` | Navigation context | Local source type, not root-exported by PLRNUI-22 | No | Exposes provider internals. | HUMAN REVIEW REQUIRED |
| `LinkProps` | `Link` | Exported through root | Yes | Props for public navigation component. |  |
| `LinkRouterAdapter` | `Link` | Exported through root | Yes | Router-agnostic adapter contract for consumer-owned navigation. |  |
| `NavBarProps` | `NavBar` | Exported through root | Yes | Props for public navigation component. |  |
| `BottomBarProps` | `BottomBar` | Exported through root | Maybe experimental | Props for bottom navigation; app-shell layout remains experimental. | HUMAN REVIEW REQUIRED |
| `TopBarProps` | `TopBar` | Exported through root | Maybe experimental | Depends on whether `TopBar` remains root public or later moves behind an experimental policy. | HUMAN REVIEW REQUIRED |
| `SideBarVariant` | `SideBar` | Exported through root | Maybe experimental | Platform-specific sidebar contract. | HUMAN REVIEW REQUIRED |
| `SideBarProps` | `SideBar` | Exported through root | Maybe experimental | Platform-specific sidebar contract. | HUMAN REVIEW REQUIRED |
| `Breakpoint` | `useBreakpoint` | Exported through root | Yes | Return type for public hook. |  |
| `SafeAreaInsets` | `withSafeAreaPadding` | Exported through root | Maybe | Only public if safe-area utility remains public. | HUMAN REVIEW REQUIRED |
| `TokenStorage` | Storage | Exported through root | No | Storage is not core UI API and implementation exports are incomplete. | HUMAN REVIEW REQUIRED |
| `TokenPair` | Tokens | Exported through root | Yes | Token API helper type. | HUMAN REVIEW REQUIRED |
| `TokensSnapshot` | Tokens | Exported through root | Yes | Token API snapshot type. | HUMAN REVIEW REQUIRED |
| `GlassMaterialTokens` | Theme materials | Exported through root | Maybe experimental | Useful for theme packs, but exposes experimental glass internals. | HUMAN REVIEW REQUIRED |
| `Theme` | Theme | Exported through root | Yes | Required for consumer overrides and custom themes. |  |
| `ThemeMode` | Theme | Exported through root | Yes | Required for provider and mode controls. |  |
| `ThemeContextValue` | Theme provider context | Not exported | No | Internal provider implementation details. |  |
| `ThemeProviderProps` | `ThemeProvider` | Not exported | Yes | Props for public provider should be exportable. | HUMAN REVIEW REQUIRED |
| `ThemeMeta` | Liquidglass theme pack | Exported through root | Maybe experimental | Theme-pack metadata, not stable core API. | HUMAN REVIEW REQUIRED |

## Policy proposal

- Public root components must export named props types.
- Experimental components may export props types only from an experimental subpath.
- Internal helper/context types should not be exported from root.
- Avoid `any` props in public API candidates.
- Avoid anonymous inline public props for public components.
- Theme and token types can be public when they are needed for consumer overrides or custom theme creation.

## Human review required

- Approve final naming for props types where names conflict with React Native types, especially `TextProps`.
- Decide whether experimental props types are exported from root, subpaths, or not at all.
- Decide whether provider context value types are intentionally public or internal.
