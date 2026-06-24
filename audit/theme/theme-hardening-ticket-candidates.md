# Theme Hardening Ticket Candidates - PLRNUI-6

These are Jira candidates only. No Jira issues were created, transitioned, or marked Done.

## Candidate Tickets

| Candidate | Priority | Title | Evidence | Acceptance criteria |
| --- | --- | --- | --- | --- |
| PLRNUI-6-A / PLRNUI-27 | P0 resolved | Wire base theme dark mode to semantic color tokens | `tokens/colors.base.ts` provides `darkColors`/`resolveColors`; `theme/defaultTheme.tsx` now uses `resolveColors(mode)` in `createBaseTheme`; `ThemeProvider` calls `createBaseTheme(mode)`. | `tests/theme/base-theme-dark-mode.test.tsx` verifies `createBaseTheme("dark").colors.background`, dark `globalStyles.app.backgroundColor`, and consumer-visible `theme.colors` after `toggleTheme()`. |
| PLRNUI-6-B | P1 | Define and wire Button component tokens | `theme/types.ts` defines `components.button`; `components/Button.tsx` uses local `heightMap`, `iconSizeMap`, `horizontalPadding`. | Button reads documented component token defaults for height/radius/padding/icon size or a deliberate token contract is rejected and ADR updated. |
| PLRNUI-6-C | P1 | Define and wire Input component tokens | `theme/types.ts` defines `components.input`; `components/form/Input.tsx` uses marker `10x10`, radius `5`, `-2` and `-2.5` offsets. | Input sizing/radius/padding/focus marker values are tokenized or removed; no magic offsets remain without documented reason. |
| PLRNUI-6-D | P1 | Define and wire Card component tokens | `theme/types.ts` defines `components.card`; `components/surfaces/Card.tsx` defaults to `radius = 14` and has component audit blocker. | Card default radius/padding/shadow uses theme component/base tokens; hook-rule blocker from component audit is resolved before stable promotion. |
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
4. Wire Button/Input/Card component tokens before claiming component-token architecture.
5. Defer overlay/navigation tokenization unless those components are promoted from experimental.
