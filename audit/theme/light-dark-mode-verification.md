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
| Base theme factory | declared-not-wired | `theme/defaultTheme.tsx` takes `mode`, stores `mode`, but always sets `colors: lightColors` and `globalStyles.app.backgroundColor: lightColors.background`. | This is the main blocker for default ThemeProvider dark mode. |
| Default theme constant | verified light-only | `defaultTheme` has `mode: 'light'` and `colors: lightColors`. | Expected for default constant, but not sufficient for dark mode. |
| ThemeProvider mode state | partial | `theme/ThemeProvider.tsx` initializes mode, reads stored mode, exposes `toggleTheme` and `setMode`, and recomputes `createTheme(themeOverrides, createBaseTheme(mode))`. | State changes occur, but base colors do not change because `createBaseTheme` is light-only. |
| ThemeProvider persistence | partial | `theme/themeStorage.ts` stores `"light"` or `"dark"` under `UI_THEME_MODE`. | Persistence works by code inspection, but key is legacy/generic and not runtime-tested here. |
| ThemeProvider app background | declared-not-wired | Provider renders background from `theme.colors.background`; base theme background remains `lightColors.background` for dark mode. | Visual dark background will not apply in base provider without overrides. |
| Component color consumption | partial | Components consume `useTheme().colors`, for example Button, Input, Card, Modal, Tooltip. | Components will follow dark colors only if the supplied theme actually contains dark colors. |
| `liquidglass` theme factory | verified | `themes/liquidglass/index.ts` selects liquidglass `darkColors` for dark mode and exports `liquidglassDarkTheme`. | Verified for direct use of `createLiquidglassTheme("dark")` or explicit `liquidglassDarkTheme`, not for default provider. |
| `themeOverrides` dark workaround | partial | `ThemeProvider` accepts `themeOverrides`, and `createTheme` merges overrides into base theme. | A consumer could pass dark colors manually, but this is not equivalent to built-in light/dark contract. |
| Runtime visual verification | blocked | No runtime test or screenshot was executed for this read-only audit. | The static evidence is enough to classify default dark as declared-not-wired. |

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

Default light/dark mode for the base theme is `declared-not-wired`. The repository contains enough dark token data to implement it, and `liquidglass` proves a separate mode-aware theme factory exists, but ADR 0004 cannot be accepted as verified for the default theme/provider until the base theme selects dark semantic colors when `mode === "dark"`.

