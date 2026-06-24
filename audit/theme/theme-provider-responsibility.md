# ThemeProvider Responsibility Verification - PLRNUI-6

## Current Responsibilities

| Responsibility | Current status | Evidence | Assessment |
| --- | --- | --- | --- |
| Provide theme context | verified | `ThemeProvider` creates `ThemeContext` and provides `{ theme, mode, toggleTheme, setMode, ready }`. | In scope for ThemeProvider. |
| Expose consumer hook path | verified | `useTheme` delegates to `useThemeContext`; `theme/index.ts` exports `useTheme`. | In scope, but `useThemeContext` is currently root-reachable and classified internal in API audit. |
| Manage light/dark mode state | verified | `ThemeProvider` stores `mode`, exposes `toggleTheme`/`setMode`, and passes mode to `createBaseTheme(mode)`. | In scope for ThemeProvider. |
| Persist mode | not implemented | Current `src/theme` has no `ThemeStorageAdapter`, storage props or `themeStorage.ts`. | PLRNUI-38 remains a future optional adapter-based implementation; no AsyncStorage import is allowed in core runtime. |
| Merge overrides | partial | `ThemeProvider` accepts `themeOverrides?: Partial<Theme>`; `createTheme` deep-merges overrides. | In scope, but merge typing uses `any` and lacks test evidence in this audit. |
| Safe-area provider ownership | not implemented in current source | `ThemeProvider` does not import `react-native-safe-area-context`, `SafeAreaProvider` or `SafeAreaView`. | PLRNUI-28 does not implement safe-area support. Future safe-area work remains separate dependency governance. |
| Scroll/layout wrapper ownership | split by PLRNUI-28 | `ThemeProvider` renders only context and children. `ThemeAppShell` renders `View` by default and `ScrollView` only when `scroll` is true. | ADR 0004 target is satisfied for provider/app-shell separation. |
| Global app/content/safeArea styles | split by PLRNUI-28 | `ThemeAppShell` applies `globalStyles.app`, `content`, and `scrollContent`; `ThemeProvider` no longer applies layout styles. | App-shell adjacent styles are explicit opt-in wrapper behavior. |

## Current Public API Risk

| API surface | Current source/export | Audit classification | Risk |
| --- | --- | --- | --- |
| `ThemeProvider` | `src/theme/ThemeProvider.tsx`, root exported via `src/index.ts` -> `src/theme/index.ts` | public/beta in `audit/api/export-matrix.md` | PLRNUI-28 makes this a pure provider and removes app-shell defaults. |
| `ThemeAppShell` | `src/theme/ThemeAppShell.tsx`, root exported via `src/index.ts` -> `src/theme/index.ts` | public/beta in `audit/api/export-matrix.md` | Opt-in replacement for themed layout and optional scroll behavior. |
| `useTheme` | `theme/useTheme.ts`, root exported | public/beta in `audit/api/export-matrix.md` | Good consumer hook; depends on provider. |
| `useThemeContext` | `theme/ThemeProvider.tsx`, exported by `theme/index.ts` | internal in `audit/api/export-matrix.md` | Low-level context hook is root-reachable despite internal classification. |

## Target Responsibility Model

| Target responsibility | Recommended owner | Evidence basis |
| --- | --- | --- |
| Theme object creation from mode and overrides | ThemeProvider + `createTheme` | ADR 0004 requires ThemeProvider to provide theme and current mode. |
| Context and consumer hook | ThemeProvider + `useTheme` | API audit marks these as public/beta. |
| Mode toggle/setter | ThemeProvider | Current API already exposes `toggleTheme` and `setMode`; dark token selection must be fixed before claiming contract. |
| Persistence | Optional provider option or separate storage adapter | API audit says storage helpers are internal; migration audit marks `UI_THEME_MODE` as legacy/generic. |
| Safe-area wrapper | Future separate component/dependency decision | PLRNUI-28 deliberately does not implement safe-area support. |
| Scroll/content wrapper | `ThemeAppShell` | ADR 0004 says scroll container/app layout should not be forced by pure theme provider. |
| Global styles | `ThemeAppShell` | App-shell layout styles are explicit opt-in wrapper behavior. |

## Verification Outcome

PLRNUI-28 makes `ThemeProvider` a pure theme context provider. App-shell layout behavior is moved to `ThemeAppShell`, where scroll defaults to false and no safe-area support is implemented.
