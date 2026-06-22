# ThemeProvider Responsibility Verification - PLRNUI-6

## Current Responsibilities

| Responsibility | Current status | Evidence | Assessment |
| --- | --- | --- | --- |
| Provide theme context | verified | `ThemeProvider` creates `ThemeContext` and provides `{ theme, mode, toggleTheme, setMode, ready }`. | In scope for ThemeProvider. |
| Expose consumer hook path | verified | `useTheme` delegates to `useThemeContext`; `theme/index.ts` exports `useTheme`. | In scope, but `useThemeContext` is currently root-reachable and classified internal in API audit. |
| Manage light/dark mode state | partial | `ThemeProvider` stores `mode`, exposes `toggleTheme`/`setMode`, and passes mode to `createBaseTheme(mode)`. | In scope, but color selection is not wired in base theme. |
| Persist mode | partial / target review needed | `ThemeProvider` calls `getStoredTheme` and `setStoredTheme`; `themeStorage.ts` uses `UI_THEME_MODE`. | Persistence may be acceptable as optional behavior, but API audit classifies storage helpers as internal and migration audit marks the key legacy/generic. |
| Merge overrides | partial | `ThemeProvider` accepts `themeOverrides?: Partial<Theme>`; `createTheme` deep-merges overrides. | In scope, but merge typing uses `any` and lacks test evidence in this audit. |
| Safe-area provider ownership | verified current, target separate/optional | `ThemeProvider` renders `SafeAreaProvider` and `SafeAreaView` by default; `withSafeArea` can disable wrapper. | ADR 0004 says safe area wrappers should be optional or separate; default-on app-shell ownership is a migration risk. |
| Scroll/layout wrapper ownership | verified current, target separate/optional | `ThemeProvider` renders `ScrollView` by default, or `View` when `withScroll={false}`. | ADR 0004 says scroll/app layout should be optional or separate; default-on scroll can surprise consumer layouts. |
| Global app/content/safeArea styles | verified current | `Theme` includes `globalStyles.app`, `content`, `scrollContent`, `safeArea`; provider applies them. | This is app-shell adjacent. Keep only if deliberately documented as provider policy, otherwise split. |

## Current Public API Risk

| API surface | Current source/export | Audit classification | Risk |
| --- | --- | --- | --- |
| `ThemeProvider` | `theme/ThemeProvider.tsx`, root exported via `index.ts` -> `theme/index.ts` | public/beta in `audit/api/export-matrix.md` | Public provider behavior may become breaking if safe-area/scroll defaults change. |
| `useTheme` | `theme/useTheme.ts`, root exported | public/beta in `audit/api/export-matrix.md` | Good consumer hook; depends on provider. |
| `useThemeContext` | `theme/ThemeProvider.tsx`, exported by `theme/index.ts` | internal in `audit/api/export-matrix.md` | Low-level context hook is root-reachable despite internal classification. |
| `getStoredTheme`, `setStoredTheme` | `theme/themeStorage.ts`, exported by `theme/index.ts` | internal in `audit/api/export-matrix.md` | Persistence implementation is root-reachable despite internal classification. |

## Target Responsibility Model

| Target responsibility | Recommended owner | Evidence basis |
| --- | --- | --- |
| Theme object creation from mode and overrides | ThemeProvider + `createTheme` | ADR 0004 requires ThemeProvider to provide theme and current mode. |
| Context and consumer hook | ThemeProvider + `useTheme` | API audit marks these as public/beta. |
| Mode toggle/setter | ThemeProvider | Current API already exposes `toggleTheme` and `setMode`; dark token selection must be fixed before claiming contract. |
| Persistence | Optional provider option or separate storage adapter | API audit says storage helpers are internal; migration audit marks `UI_THEME_MODE` as legacy/generic. |
| Safe-area wrapper | Separate app-shell component or explicitly opt-in provider option | ADR 0004 says app-shell wrappers should be optional or separate; current default is `withSafeArea = true`. |
| Scroll/content wrapper | Separate app-shell component or explicitly opt-in provider option | ADR 0004 says scroll container/app layout should not be forced by pure theme provider; current default is `withScroll = true`. |
| Global styles | Separate app-shell theme extension or documented provider contract | Current provider applies `globalStyles` to wrappers; this should be deliberate before public stabilization. |

## Verification Outcome

Current ThemeProvider is functional as an app-shell provider, not a pure theme provider. This is not necessarily wrong for the demo, but it does not match the target responsibility boundary in ADR 0004 unless safe-area/scroll/layout behavior is documented as optional and non-default, or moved to a separate app-shell wrapper.

