# Theme Hardening Ticket Candidates - PLRNUI-6

These are Jira candidates only. No Jira issues were created, transitioned, or marked Done.

## Candidate Tickets

| Candidate | Priority | Title | Evidence | Acceptance criteria |
| --- | --- | --- | --- | --- |
| PLRNUI-6-A / PLRNUI-27 | P0 resolved | Wire base theme dark mode to semantic color tokens | `tokens/colors.base.ts` provides `darkColors`/`resolveColors`; `theme/defaultTheme.tsx` now uses `resolveColors(mode)` in `createBaseTheme`; `ThemeProvider` calls `createBaseTheme(mode)`. | `tests/theme/base-theme-dark-mode.test.tsx` verifies `createBaseTheme("dark").colors.background`, dark `globalStyles.app.backgroundColor`, and consumer-visible `theme.colors` after `toggleTheme()`. |
| PLRNUI-6-B / PLRNUI-30 | P1 implemented | Define and wire Button component tokens | `theme/types.ts` defines the structural `components.button` contract; `theme/defaultTheme.tsx` supplies defaults; `components/Button.tsx` reads height, padding, icon size, radius, gap, border width and opacity from `theme.components.button`. | `tests/theme/button-component-tokens.test.tsx` verifies custom structural Button token overrides are consumed; colors remain semantic-token driven and non-structural Button tokens are intentionally deferred. |
| PLRNUI-6-C / PLRNUI-31 | P1 implemented | Define and wire Input component tokens | `theme/types.ts` defines the structural `components.input` contract; `theme/defaultTheme.tsx` supplies defaults; `src/components/Input/Input.tsx` reads height, padding, icon box height and radius from `theme.components.input`. | `tests/theme/input-component-tokens.test.tsx` verifies custom structural Input token overrides are consumed; label marker is removed; magic offsets are eliminated; colors remain semantic-token driven. |
| PLRNUI-6-D / PLRNUI-32 | P1 implemented | Define and wire Card component tokens | `theme/types.ts` defines `components.card`; `theme/defaultTheme.tsx` supplies defaults; `src/components/Card/Card.tsx` reads radius, padding and shadow defaults from `theme.components.card`. | `tests/theme/card-component-tokens.test.tsx` verifies Card token defaults and explicit prop override precedence; the former `radius = 14` default is removed. |
| PLRNUI-6-E / PLRNUI-28 | P1 implemented | Split pure ThemeProvider from app-shell wrappers | ADR 0004 says safe area/scroll wrappers should be optional/separate; PLRNUI-28 makes `ThemeProvider` pure and adds `ThemeAppShell` for opt-in layout/scroll. | Pure provider supplies only context and mode; optional app-shell wrapper is documented; migration note covers behavior change. |
| PLRNUI-6-F | P1 | Establish legacy AURA token removal path | `tokens/index.ts` exports `auraTokens`/`getAuraTokens`; `audit/api/export-matrix.md` marks them deprecated; PLRNUI-16 selects `themeTokens` and conditional `getThemeTokens` as replacements. | AURA token names are removed from the future API contract; no compatibility aliases are introduced; docs/migration notes updated. |
| PLRNUI-6-G | P1 | Namespace and migrate theme mode storage key | `theme/themeStorage.ts` uses `UI_THEME_MODE`; `audit/migration/legacy-naming-map.md` marks it as legacy/generic. | Storage key is namespaced or storage policy is made internal; migration from old key is documented/tested if behavior remains public. |
| PLRNUI-6-H | P2 | Create shared form-control size tokens | Switch, Checkbox, and RadioGroup hardcode control dimensions; no form-control component tokens exist. | Shared tokens cover control box/track/thumb/icon sizes and border widths, or components are kept beta until tokenization is complete. |
| PLRNUI-6-I | P2 | Create overlay geometry and motion tokens | Modal, BottomSheet, Tooltip, and ToastProvider hardcode widths, snap heights, delays, durations, max widths, and queue defaults. | Overlay/motion tokens are defined for promoted components; experimental components document hardcoded behavior until stabilized. |
| PLRNUI-6-J | P2 | Create navigation layout tokens or keep navigation experimental | TopBar, BottomBar, and SideBar hardcode nav heights/widths/min widths and fallback z-index. | Navigation layout tokens exist for promoted nav components, or export policy keeps navigation experimental. |
| PLRNUI-6-K | P2 | Add theme override verification | `ThemeProvider` accepts `themeOverrides`; `createTheme` uses `any` internally; Risk Assessment 0004 flags unsafe overrides. | Type-safe override behavior is tested for nested colors/component tokens and invalid structures are rejected or documented. |
| PLRNUI-6-L | P2 | Align token docs with current public API and migration naming | Docs still use `AURA` imports; token docs list `auraTokens`/`getAuraTokens`; API audit proposes future token entrypoint names. | Docs clearly distinguish current legacy exports from target names and do not present unapproved token names as implemented. |

## Suggested Sequencing

1. Base dark mode was fixed by PLRNUI-27; continue treating the remaining rows as separate hardening work.
2. Decide ThemeProvider responsibility before stabilizing public provider behavior, because changing default wrappers can be breaking.
3. Approve token naming/deprecation strategy before adding neutral public token names.
4. Button structural component tokens are wired by PLRNUI-30, Input structural component tokens are wired by PLRNUI-31 and Card structural component tokens are wired by PLRNUI-32; continue component-token work only for future promoted candidates.
5. Defer overlay/navigation tokenization unless those components are promoted from experimental.
