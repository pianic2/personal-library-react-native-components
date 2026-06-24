# Theme Token Verification - PLRNUI-6

## Scope

Read-only verification of ADR 0004 against the current codebase. This audit does not modify source files and does not mark PLRNUI-6 as Done.

Inputs verified:

- ADR 0004: `audit/adr/0004-theme-token-architecture.md`.
- Risk Assessment 0004: `audit/risk-assessment/0004-theme-token-regression-risk.md`.
- ADR review: `audit/adr-review.md`.
- Existing theme/token audit: `audit/03-theme-token-system.md`.
- API audit: `audit/api/export-matrix.md`, `audit/api/subpath-exports.md`.
- Component audit: `audit/components/component-maturity-matrix.md`.
- Migration audit: `audit/migration/legacy-naming-map.md`, `audit/migration/breaking-change-register.md`.

## Verdict

ADR 0004 is architecturally aligned with the intended target, but the current implementation only partially satisfies the contract.

| Contract area | Verification status | Evidence |
| --- | --- | --- |
| Primitive tokens exist | verified | `tokens/colors.base.ts`, `tokens/spacing.base.ts`, `tokens/radius.base.ts`, `tokens/size.base.ts`, `tokens/shadows.base.ts`, `tokens/zIndex.base.ts`, `tokens/typography.base.ts`; ADR 0004 requires primitive tokens in `audit/adr/0004-theme-token-architecture.md`. |
| Semantic color tokens exist | verified | `tokens/colors.base.ts` defines roles such as `background`, `surface`, `textPrimary`, `border`, `error`, `success`, `overlay`, `backdrop`; snapshot groups them into `surface`, `text`, `border`, `brand`, `feedback` in `tokens/snapshot.ts`. |
| Component tokens exist in type contract | partial | `theme/types.ts` defines optional `components.button`, `components.input`, and `components.card`; no current component reads `theme.components.*` based on `rg "theme\\.components|components\\?\\." components theme`. |
| Default ThemeProvider light/dark behavior | verified by PLRNUI-27 and preserved by PLRNUI-28 | `ThemeProvider` recomputes `createBaseTheme(mode)` on mode changes; `createBaseTheme` resolves semantic colors through `resolveColors(mode)` and `tests/theme/base-theme-dark-mode.test.tsx` verifies consumer-visible colors change after `toggleTheme()` and `setMode()`. |
| Alternative liquidglass light/dark theme factory | verified | `themes/liquidglass/index.ts` selects `mode === "dark" ? darkColors : lightColors` and exports `liquidglassDarkTheme`. |
| Theme override API | partial | `ThemeProvider` accepts `themeOverrides?: Partial<Theme>` and calls `createTheme(themeOverrides, createBaseTheme(mode))`; `createTheme` uses untyped `any` inside `deepMerge`, already flagged by `audit/03-theme-token-system.md`. |
| Public theme/tokens API classification | partial | `audit/api/export-matrix.md` marks `Theme`, `ThemeMode`, `createTheme`, `ThemeProvider`, `useTheme` as public/beta and `auraTokens`, `getAuraTokens` as deprecated. Current root `index.ts` still exports all `./tokens`, `./theme`, and `./themes`. |
| Legacy AURA token naming migration path | partial | `tokens/index.ts` exports `auraTokens` and `getAuraTokens`; `audit/migration/legacy-naming-map.md` maps them to unknown future neutral names and `audit/migration/breaking-change-register.md` marks token naming as a candidate breaking change. |

## Findings

### THM-PLRNUI6-01 - Base dark mode is wired by PLRNUI-27

- Status: verified.
- Evidence: `theme/ThemeProvider.tsx` stores `mode`, exposes `toggleTheme`, and recomputes the theme with `createBaseTheme(mode)`. `theme/defaultTheme.tsx` now resolves semantic colors through `resolveColors(mode)`, and `tests/theme/base-theme-dark-mode.test.tsx` verifies dark base colors, dark app background, and provider consumer-visible color changes after `toggleTheme()`.
- Risk: P0 risk resolved for the base semantic color path; component-token and provider-responsibility findings remain separate.
- Priority: P0.

### THM-PLRNUI6-02 - Component tokens are type-only for core components

- Status: partial.
- Evidence: `theme/types.ts` defines `components.button`, `components.input`, `components.card`. `components/Button.tsx`, `components/form/Input.tsx`, and `components/surfaces/Card.tsx` use local maps, base tokens, or props instead of `theme.components`.
- Risk: ADR 0004 says component tokens should start from Button, Input, and Card, but those components are not wired to component token defaults.
- Priority: P1.

### THM-PLRNUI6-03 - Public token API still exposes AURA names

- Status: verified legacy debt.
- Evidence: `tokens/index.ts` exports `auraTokens`, `getAuraTokens`; `tokens/snapshot.ts` defines those names; `audit/api/export-matrix.md` classifies them as deprecated.
- Risk: token names are public API according to ADR 0004; renaming without alias/deprecation policy is breaking.
- Priority: P1.

### THM-PLRNUI6-04 - ThemeProvider app-shell responsibilities split by PLRNUI-28

- Status: resolved for current source.
- Evidence: `src/theme/ThemeProvider.tsx` renders only context and children. `src/theme/ThemeAppShell.tsx` owns app/content styles and renders `ScrollView` only when `scroll` is true.
- Risk: consumers must migrate from implicit provider layout or `withScroll` to explicit `ThemeAppShell` composition.
- Priority: P1.

### THM-PLRNUI6-05 - Hardcoded values remain in public/beta component candidates

- Status: verified.
- Evidence: Button height/padding/icon maps in `components/Button.tsx`; Input marker and offsets in `components/form/Input.tsx`; Switch/Checkbox/RadioGroup dimensions in `components/form/*`; navigation and overlay dimensions in `components/navigation/*` and `components/overlay/*`.
- Risk: component visuals cannot be consistently themed or overridden through ADR 0004 token layers.
- Priority: P1/P2 depending on component maturity.

## Release Candidate Gate Assessment

ADR 0004 verification gates are not met:

- Light/dark mode: met for base theme/provider after PLRNUI-27.
- Token docs present: partial, docs exist but still use AURA imports and legacy token names.
- Stable components without critical hardcoded values: not met; `audit/components/component-maturity-matrix.md` states no component is stable and several have blockers.
- Theme override example: not verified in this audit; code supports `themeOverrides` but merge typing is partial.
- Legacy token deprecation/rename mapping: partial; audit files identify candidates, but source still exposes only AURA token names.
