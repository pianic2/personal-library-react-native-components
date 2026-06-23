# PLRNUI-4 - Public API Export Matrix

## Scope

Audit read-only based on historical `index.ts`, internal barrel exports, `package.json`, ADR 0002, ADR 0003, ADR 0006 and Risk Assessment 0002.

Current-state note for PLRNUI-23: this PLRNUI-4 matrix remains historical API governance evidence for a broader source tree. In the current checkout, `package.json` declares `@personal-library/react-native-components`, `main` / `module` / `types` point to `dist/index.js` and `dist/index.d.ts`, and `src/index.ts` exports `PACKAGE_NAME` plus component, theme, hook, utility and token APIs. PLRNUI-22 adds root exports for approved navigation components and public navigation types through local component barrels; PLRNUI-23 adds root API visibility for `Modal`, `BottomSheet`, `Tooltip`, `Popover` and `Select` through local component barrels. The root `NavContext` subset is `NavProvider`, `useNav`, `useNavigate` and `NavItem`, while helper hooks remain local/internal. It does not add package subpath exports or promote anything to `stable`.

## Package export map

| Entry | Current value | Assessment | Human review |
| --- | --- | --- | --- |
| `package.json:name` | `@personal-library/react-native-components` | Canonical package identity is applied in the current checkout. |  |
| `package.json:main` | `./dist/index.js` | Points to real TypeScript build output. |  |
| `package.json:module` | `./dist/index.js` | Points to real TypeScript build output. |  |
| `package.json:types` | `./dist/index.d.ts` | Points to real declaration output. |  |
| `package.json:exports["."]` | `import: ./dist/index.js`; `types: ./dist/index.d.ts` | Root only; no supported functional subpath exports currently declared. |  |
| `package.json:exports["./package.json"]` | `./package.json` | Package metadata is intentionally exposed. |  |

## Export matrix

| Symbol | Export path | Source file | Kind | Proposed status | Stability | Reason | Human review |
| --- | --- | --- | --- | --- | --- | --- | --- |
| `Button` | root | `components/Button.tsx` | component | public | beta | Core documented component, but variant and props hardening remain open. | HUMAN REVIEW REQUIRED |
| `NavItem` | root | `components/navigation/NavContext.tsx` | type | public | beta | Needed to configure documented navigation components. |  |
| `NavContextValue` | root | `components/navigation/NavContext.tsx` | type | internal | internal | Exposes provider implementation details beyond consumer configuration. | HUMAN REVIEW REQUIRED |
| `NavProvider` | root | `components/navigation/NavContext.tsx` | provider | public | beta | Router-agnostic navigation provider is useful for consumers. |  |
| `useNav` | root | `components/navigation/NavContext.tsx` | hook | public | beta | Consumer hook for navigation state when provider is public. | HUMAN REVIEW REQUIRED |
| `useNavItems` | root | `components/navigation/NavContext.tsx` | hook | internal | internal | Narrow helper for internal navigation rendering. | HUMAN REVIEW REQUIRED |
| `useNavLogo` | root | `components/navigation/NavContext.tsx` | hook | internal | internal | Narrow helper for internal navigation rendering. | HUMAN REVIEW REQUIRED |
| `useNavPathname` | root | `components/navigation/NavContext.tsx` | hook | internal | internal | Narrow helper for internal navigation rendering. | HUMAN REVIEW REQUIRED |
| `useNavigate` | root | `components/navigation/NavContext.tsx` | hook | internal | internal | Narrow helper for internal navigation rendering. | HUMAN REVIEW REQUIRED |
| `useOptionalNav` | root | `components/navigation/NavContext.tsx` | hook | internal-helper | internal | Optional context fallback is an implementation helper. | HUMAN REVIEW REQUIRED |
| `LinkProps` | root | `components/navigation/Link.tsx` | type | public | beta | Props type for public `Link`. |  |
| `LinkRouterAdapter` | root | `src/components/Link/Link.tsx` | type | public | beta | Router-agnostic per-link navigation adapter added by PLRNUI-22. |  |
| `Link` | root | `src/components/Link/Link.tsx` | component | public | beta | PLRNUI-22 adds router adapter support, guarded web fallback and safe native no-op; stable gate remains incomplete. | HUMAN REVIEW REQUIRED |
| `NavBarProps` | root | `components/navigation/NavBar.tsx` | type | public | beta | Props type for public `NavBar`. |  |
| `NavBar` | root | `src/components/NavBar/NavBar.tsx` | component | public | beta | PLRNUI-22 wires `bottomMaxItems` to `BottomBar` as a visible item limit. | HUMAN REVIEW REQUIRED |
| `TopBarProps` | root | `components/navigation/TopBar.tsx` | type | public | beta | Props type for public `TopBar`. |  |
| `TopBar` | root | `src/components/TopBar/TopBar.tsx` | component | public | beta | PLRNUI-22 removes placeholder fallback behavior; stable gate remains incomplete. | HUMAN REVIEW REQUIRED |
| `BottomBarProps` | root | `src/components/BottomBar/BottomBar.tsx` | type | public | beta | Props type for public `BottomBar`; `maxItems` is a visible item limit. |  |
| `BottomBar` | root | `src/components/BottomBar/BottomBar.tsx` | component | experimental | experimental | Visible item limit documented by PLRNUI-22; app-shell layout remains experimental. | HUMAN REVIEW REQUIRED |
| `SideBarVariant` | root | `components/navigation/SideBar.tsx` | type | experimental | experimental | Platform-sensitive sidebar contract. | HUMAN REVIEW REQUIRED |
| `SideBarProps` | root | `components/navigation/SideBar.tsx` | type | experimental | experimental | Platform-sensitive sidebar props. | HUMAN REVIEW REQUIRED |
| `SideBar` | root | `src/components/SideBar/SideBar.tsx` | component | experimental | experimental | PLRNUI-22 adds minimal native-safe vertical list; richer sidebar contract remains experimental. | HUMAN REVIEW REQUIRED |
| `Box` | root | `components/layout/Box.tsx` | component | public | beta | Foundational layout primitive. |  |
| `Column` | root | `components/layout/Column.tsx` | component | public | beta | Foundational layout primitive. |  |
| `Stack` | root | `components/layout/Column.tsx` | component | public | beta | Alias for `Column`; could be public if intentionally documented. | HUMAN REVIEW REQUIRED |
| `Row` | root | `components/layout/Row.tsx` | component | public | beta | Foundational layout primitive, with one known ineffective prop. | HUMAN REVIEW REQUIRED |
| `Divider` | root | `components/layout/Divider.tsx` | component | public | beta | Simple documented layout component. | HUMAN REVIEW REQUIRED |
| `P` | root | `components/typography/P.tsx` | component | public | beta | Documented typography shorthand. |  |
| `B` | root | `components/typography/B.tsx` | component | public | beta | Documented typography shorthand. |  |
| `Small` | root | `components/typography/Small.tsx` | component | public | beta | Documented typography shorthand. |  |
| `Code` | root | `components/typography/Code.tsx` | component | experimental | experimental | Clipboard/timer behavior needs hardening before stable API. | HUMAN REVIEW REQUIRED |
| `CodeInline` | root | `components/typography/CodeInline.tsx` | component | public | beta | PLRNUI-21 fixed size/lineHeight handling and added smoke coverage; stable gate remains incomplete. | HUMAN REVIEW REQUIRED |
| `Quote` | root | `components/typography/Quote.tsx` | component | public | beta | Simple documented typography component. |  |
| `Text` | root | `components/typography/Text.tsx` | component | public | beta | Core typography primitive. |  |
| `TextGroup` | root | `components/typography/TextGroup.tsx` | component | public | beta | Documented grouping primitive with minor implementation debt. | HUMAN REVIEW REQUIRED |
| `Heading` | root | `components/typography/Heading.tsx` | component | public | beta | Core typography component. |  |
| `Page` | root | `components/typography/Page.tsx` | component | experimental | experimental | App-level layout mixed into typography. | HUMAN REVIEW REQUIRED |
| `Spinner` | root | `components/feedback/Spinner.tsx` | component | public | beta | Simple documented feedback component. |  |
| `Alert` | root | `components/feedback/Alert.tsx` | component | public | beta | Documented feedback component with contrast/action review pending. | HUMAN REVIEW REQUIRED |
| `ToastProvider` | root | `components/feedback/ToastProvider.tsx` | provider | experimental | experimental | Uses web-specific markup and timer lifecycle needs review. | HUMAN REVIEW REQUIRED |
| `useToastContext` | root | `components/feedback/ToastProvider.tsx` | hook | internal | internal | Provider implementation hook; `useToast` should be consumer API. | HUMAN REVIEW REQUIRED |
| `useToast` | root | `components/feedback/useToast.tsx` | hook | experimental | experimental | Useful consumer hook but tied to experimental toast provider. | HUMAN REVIEW REQUIRED |
| `ProgressBar` | root | `components/feedback/ProgressBar.tsx` | component | public | beta | PLRNUI-21 fixed clamped fill width behavior and added smoke coverage; stable gate remains incomplete. | HUMAN REVIEW REQUIRED |
| `Modal` | root | `src/components/Modal/Modal.tsx` | component | experimental | experimental | PLRNUI-23 adds root visibility and smoke coverage; focus/accessibility/keyboard behavior remains unverified. | HUMAN REVIEW REQUIRED |
| `BottomSheet` | root | `src/components/BottomSheet/BottomSheet.tsx` | component | experimental | experimental | PLRNUI-23 adds root visibility and smoke coverage; gesture, keyboard, safe area and snap behavior remain incomplete. | HUMAN REVIEW REQUIRED |
| `Tooltip` | root | `src/components/Tooltip/Tooltip.tsx` | component | experimental | experimental | PLRNUI-23 documents web behavior and native children-only fallback. | HUMAN REVIEW REQUIRED |
| `Popover` | root | `src/components/Popover/Popover.tsx` | component | experimental | experimental | PLRNUI-23 documents web behavior and native trigger-only fallback. | HUMAN REVIEW REQUIRED |
| `Badge` | root | `components/surfaces/Badge.tsx` | component | public | beta | Documented visual component with color review pending. | HUMAN REVIEW REQUIRED |
| `Card` | root | `components/surfaces/Card.tsx` | component | public | beta | PLRNUI-21 removed the hook-rule blocker and added smoke coverage; stable gate remains incomplete. | HUMAN REVIEW REQUIRED |
| `Hero` | root | `components/surfaces/Hero.tsx` | component | experimental | experimental | Hardcoded screen height; not clearly reusable library API. | HUMAN REVIEW REQUIRED |
| `Input` | root | `components/form/Input.tsx` | component | public | beta | Important form primitive but props contract needs stabilization. | HUMAN REVIEW REQUIRED |
| `PasswordInput` | root | `components/form/PasswordInput.tsx` | component | public | beta | PLRNUI-21 added explicit props and accessible visibility toggle behavior; stable gate remains incomplete. | HUMAN REVIEW REQUIRED |
| `Switch` | root | `components/form/Switch.tsx` | component | public | beta | Basic form component with accessibility/animation gaps. | HUMAN REVIEW REQUIRED |
| `Checkbox` | root | `components/form/Checkbox.tsx` | component | public | beta | Basic form component with accessibility gaps. | HUMAN REVIEW REQUIRED |
| `RadioGroup` | root | `components/form/RadioGroup.tsx` | component | public | beta | Basic form component; option type should be exported if public. | HUMAN REVIEW REQUIRED |
| `Select` | root | `src/components/Select/Select.tsx` | component | experimental | experimental | PLRNUI-23 adds root visibility and smoke coverage; keyboard, focus and screen reader behavior remain unverified. | HUMAN REVIEW REQUIRED |
| `FormField` | root | `components/form/FormField.tsx` | component | public | beta | Useful composition primitive but clone-props behavior needs review. | HUMAN REVIEW REQUIRED |
| `Textarea` | root | `components/form/Textarea.tsx` | component | public | beta | PLRNUI-21 added explicit props, semantic spacing and forced multiline behavior; stable gate remains incomplete. | HUMAN REVIEW REQUIRED |
| `Breakpoint` | root | `hooks/useBreakpoint.ts` | type | public | beta | Useful with public `useBreakpoint`. |  |
| `useBreakpoint` | root | `hooks/useBreakpoint.ts` | hook | public | beta | Consumer layout hook. |  |
| `useDebounce` | root | `hooks/useDebounce.ts` | hook | public | beta | Generic consumer hook with clear contract. | HUMAN REVIEW REQUIRED |
| `useToggle` | root | `hooks/useToggle.ts` | hook | public | beta | Generic consumer hook with clear contract. | HUMAN REVIEW REQUIRED |
| `useIsMounted` | root | `hooks/useIsMounted.ts` | hook | internal-helper | internal | Usually implementation helper, not UI library API. | HUMAN REVIEW REQUIRED |
| `mergeStyles` | root | `utils/mergeStyles.ts` | utility | experimental | experimental | Potentially useful but not clearly core API. | HUMAN REVIEW REQUIRED |
| `cn` | root | `utils/cn.ts` | utility | internal-helper | internal | Class-name helper is not clearly useful for React Native consumers. | HUMAN REVIEW REQUIRED |
| `isWeb` | root | `utils/platform.ts` | utility | experimental | experimental | Platform convenience API may be public, but contract is not documented as stable. | HUMAN REVIEW REQUIRED |
| `isIOS` | root | `utils/platform.ts` | utility | experimental | experimental | Platform convenience API may be public, but contract is not documented as stable. | HUMAN REVIEW REQUIRED |
| `isAndroid` | root | `utils/platform.ts` | utility | experimental | experimental | Platform convenience API may be public, but contract is not documented as stable. | HUMAN REVIEW REQUIRED |
| `isMobile` | root | `utils/platform.ts` | utility | experimental | experimental | Platform convenience API may be public, but contract is not documented as stable. | HUMAN REVIEW REQUIRED |
| `SafeAreaInsets` | root | `utils/safeArea.ts` | type | experimental | experimental | Utility type tied to helper not yet established as public API. | HUMAN REVIEW REQUIRED |
| `withSafeAreaPadding` | root | `utils/safeArea.ts` | utility | experimental | experimental | Potentially useful helper, but should not be root stable without docs contract. | HUMAN REVIEW REQUIRED |
| `TokenStorage` | root | `storage/tokenStorage.ts` | type | internal | internal | Storage is not core UI API and implementation exports are incomplete. | HUMAN REVIEW REQUIRED |
| `TokenPair` | root | `tokens/types.ts` | type | public | beta | Token typing candidate for public token API. | HUMAN REVIEW REQUIRED |
| `auraTokens` | root | `tokens/snapshot.ts` | token | deprecated | deprecated | Legacy AURA naming conflicts with recommended package identity. | HUMAN REVIEW REQUIRED |
| `getAuraTokens` | root | `tokens/snapshot.ts` | utility | deprecated | deprecated | Legacy AURA naming conflicts with recommended package identity. | HUMAN REVIEW REQUIRED |
| `TokensSnapshot` | root | `tokens/snapshot.ts` | type | public | beta | Useful type for token snapshots; naming is neutral. | HUMAN REVIEW REQUIRED |
| `GlassMaterialTokens` | root | `theme/types.ts` | type | experimental | experimental | Theme extension for liquid/glass materials is not core stable yet. | HUMAN REVIEW REQUIRED |
| `Theme` | root | `theme/types.ts` | type | public | beta | Required to use and override theme contract. |  |
| `ThemeMode` | root | `theme/types.ts` | type | public | beta | Required for theme provider and mode controls. |  |
| `createTheme` | root | `theme/createTheme.ts` | utility | public | beta | Public customization helper. | HUMAN REVIEW REQUIRED |
| `ThemeProvider` | root | `theme/ThemeProvider.tsx` | provider | public | beta | Required for library usage, but wrapper behavior should be reviewed. | HUMAN REVIEW REQUIRED |
| `useThemeContext` | root | `theme/ThemeProvider.tsx` | hook | internal | internal | Low-level context hook; `useTheme` should be consumer API. | HUMAN REVIEW REQUIRED |
| `getStoredTheme` | root | `theme/themeStorage.ts` | utility | internal | internal | Persistence detail of provider. | HUMAN REVIEW REQUIRED |
| `setStoredTheme` | root | `theme/themeStorage.ts` | utility | internal | internal | Persistence detail of provider. | HUMAN REVIEW REQUIRED |
| `useTheme` | root | `theme/useTheme.ts` | hook | public | beta | Primary consumer theme hook. |  |
| `createLiquidglassTheme` | root | `themes/liquidglass/index.ts` | utility | experimental | experimental | Theme pack is explicitly experimental in prior audit. | HUMAN REVIEW REQUIRED |
| `liquidglassTheme` | root | `themes/liquidglass/index.ts` | token | experimental | experimental | Theme pack is explicitly experimental in prior audit. | HUMAN REVIEW REQUIRED |
| `liquidglassDarkTheme` | root | `themes/liquidglass/index.ts` | token | experimental | experimental | Theme pack is explicitly experimental in prior audit. | HUMAN REVIEW REQUIRED |
| `ThemeMeta` | root | `themes/liquidglass/meta.ts` | type | experimental | experimental | Theme-pack metadata contract not yet stable. | HUMAN REVIEW REQUIRED |
| `liquidglassMeta` | root | `themes/liquidglass/meta.ts` | config | experimental | experimental | Theme-pack metadata contract not yet stable. | HUMAN REVIEW REQUIRED |
| `liquidglassLightColors` | root | `themes/liquidglass/tokens/colors.base.ts` | token | experimental | experimental | Theme-pack token export, not core stable tokens. | HUMAN REVIEW REQUIRED |
| `liquidglassDarkColors` | root | `themes/liquidglass/tokens/colors.base.ts` | token | experimental | experimental | Theme-pack token export, not core stable tokens. | HUMAN REVIEW REQUIRED |
| `resolveLiquidglassColors` | root | `themes/liquidglass/tokens/colors.base.ts` | utility | experimental | experimental | Theme-pack utility, not core stable tokens. | HUMAN REVIEW REQUIRED |
| `liquidglassGlassTokens` | root | `themes/liquidglass/tokens/glass.ts` | token | experimental | experimental | Theme-pack token export, not core stable tokens. | HUMAN REVIEW REQUIRED |

## Summary

- Exports analyzed: 92.
- Proposed public: 40.
- Proposed experimental: 32.
- Proposed internal: 18.
- Proposed deprecated: 2.

## Human Review Required

- Confirm whether generic hooks/utilities belong in the root API or only in subpaths.
- Confirm whether `Stack` is a stable public alias or a deprecated/internal alias.
- Confirm whether navigation context helper hooks should be exported at all.
- Confirm whether storage and theme persistence are consumer APIs.
- Confirm naming migration from `@aura/ui`, `AURA`, `auraTokens`, and `getAuraTokens`.
- Confirm whether `liquidglass` is an experimental theme pack subpath or excluded from the stable package.
