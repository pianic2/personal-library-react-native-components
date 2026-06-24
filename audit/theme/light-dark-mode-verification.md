# Light/Dark Mode Verification - PLRNUI-6

## Status Legend

- `verified`: code path demonstrably selects different light/dark tokens.
- `partial`: some code exists, but the consumer-visible path is incomplete.
- `declared-not-wired`: mode exists but does not change relevant tokens.
- `missing`: no evidence found.
- `blocked`: cannot be verified without runtime execution or external consumer.

## Verification Matrix

| Surface | Status | Evidence | Notes |
| --- | --- | --- | --- |
| Base token palettes | verified | `tokens/colors.base.ts` defines both `lightColors` and `darkColors`, plus `resolveColors(mode)`. | Primitive/semantic color data exists. |
| Token snapshot API | verified with legacy naming | `tokens/snapshot.ts` creates `lightSnapshot` and `darkSnapshot`; `getAuraTokens(mode)` returns `darkSnapshot` for `"dark"`. | Functionality exists, but public names are AURA legacy. |
| Base theme factory | verified | `theme/defaultTheme.tsx` takes `mode`, resolves semantic colors through `resolveColors(mode)`, and assigns both `colors` and `globalStyles.app.backgroundColor` from the selected palette. | PLRNUI-27 wires the default base theme dark path. |
| Default theme constant | verified light-only | `defaultTheme` has `mode: 'light'` and `colors: lightColors`. | Expected for default constant, but not sufficient for dark mode. |
| ThemeProvider mode state | verified for color selection | `theme/ThemeProvider.tsx` initializes mode, exposes `toggleTheme` and `setMode`, and recomputes `createTheme(themeOverrides, createBaseTheme(mode))`; `tests/theme/base-theme-dark-mode.test.tsx` verifies consumer-visible colors change after `toggleTheme()`. | PLRNUI-27 verifies the provider-to-consumer light/dark color path. |
| ThemeProvider persistence | partial | `theme/themeStorage.ts` stores `"light"` or `"dark"` under `UI_THEME_MODE`. | Persistence works by code inspection, but key is legacy/generic and not runtime-tested here. |
| ThemeProvider app background | verified | Provider renders background from `theme.colors.background`; PLRNUI-27 also makes `createBaseTheme("dark").globalStyles.app.backgroundColor` equal `darkColors.background`. | Base provider background now follows the selected semantic background. |
| Component color consumption | partial / unblocked for base colors | Components consume `useTheme().colors`, for example Button, Input, Card, Modal, Tooltip. | Component-specific tokenization remains separate, but the supplied base theme now changes semantic colors for dark mode. |
| `liquidglass` theme factory | verified | `themes/liquidglass/index.ts` selects liquidglass `darkColors` for dark mode and exports `liquidglassDarkTheme`. | Verified for direct use of `createLiquidglassTheme("dark")` or explicit `liquidglassDarkTheme`, not for default provider. |
| `themeOverrides` dark workaround | partial | `ThemeProvider` accepts `themeOverrides`, and `createTheme` merges overrides into base theme. | A consumer could pass dark colors manually, but this is not equivalent to built-in light/dark contract. |
| Runtime verification | verified by test | `tests/theme/base-theme-dark-mode.test.tsx` verifies `createBaseTheme("light")`, `createBaseTheme("dark")`, dark `globalStyles.app.backgroundColor`, and ThemeProvider consumer-visible color changes after `toggleTheme()`. | This is automated renderer/static behavior evidence, not a device screenshot. |

## Component Impact

| Component group | Expected behavior if theme.colors changes | Current light/dark classification | Evidence |
| --- | --- | --- | --- |
| Button | Uses semantic colors for background, border, text | partial | `components/Button.tsx` uses `colors.primary`, `colors.secondary`, `colors.error`, `colors.textPrimary`, `colors.textInverted`, `colors.surface`. |
| Form Input | Uses semantic colors for border, surface, disabled, text, placeholder, helper | partial | `components/form/Input.tsx` uses `colors.error`, `colors.primary`, `colors.border`, `colors.surface`, `colors.disabledBg`, `colors.textMuted`, `colors.textPrimary`. |
| Card | Uses semantic surface/border and theme shadows | partial | `components/surfaces/Card.tsx` uses `colors.surface`, `colors.border`, and theme shadows. |
| Overlay | Uses semantic backdrop/surface/text | partial | `components/overlay/Modal.tsx`, `BottomSheet.tsx`, `Tooltip.tsx` consume `colors.backdrop`, `colors.surface`, `colors.textPrimary`, `colors.textInverted`. |
| Navigation | Uses semantic surface/border/text/primary | partial | `components/navigation/TopBar.tsx`, `BottomBar.tsx`, `SideBar.web.tsx` consume theme colors. |

The component layer is not the primary dark-mode blocker. The provider/base theme path is.

## Conclusion

Default light/dark mode for the base theme is now wired by PLRNUI-27. `createBaseTheme("dark")` selects dark semantic colors, the app background follows `colors.background`, and ThemeProvider consumer-visible colors change after `toggleTheme()` based on automated test evidence.
