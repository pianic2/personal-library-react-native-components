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
| Default ThemeProvider light/dark behavior | declared-not-wired | `ThemeProvider` recomputes `createBaseTheme(mode)` on mode changes, but `createBaseTheme` always assigns `colors: lightColors` and `globalStyles.app.backgroundColor: lightColors.background` in `theme/defaultTheme.tsx`. |
| Alternative liquidglass light/dark theme factory | verified | `themes/liquidglass/index.ts` selects `mode === "dark" ? darkColors : lightColors` and exports `liquidglassDarkTheme`. |
| Theme override API | partial | `ThemeProvider` accepts `themeOverrides?: Partial<Theme>` and calls `createTheme(themeOverrides, createBaseTheme(mode))`; `createTheme` uses untyped `any` inside `deepMerge`, already flagged by `audit/03-theme-token-system.md`. |
| Public theme/tokens API classification | partial | `audit/api/export-matrix.md` marks `Theme`, `ThemeMode`, `createTheme`, `ThemeProvider`, `useTheme` as public/beta and `auraTokens`, `getAuraTokens` as deprecated. Current root `index.ts` still exports all `./tokens`, `./theme`, and `./themes`. |
| Legacy AURA token naming migration path | partial | `tokens/index.ts` exports `auraTokens` and `getAuraTokens`; `audit/migration/legacy-naming-map.md` maps them to unknown future neutral names and `audit/migration/breaking-change-register.md` marks token naming as a candidate breaking change. |

## Findings

### THM-PLRNUI6-01 - Base dark mode is declared but not wired

- Status: declared-not-wired.
- Evidence: `theme/ThemeProvider.tsx` stores `mode`, exposes `toggleTheme`, and recomputes the theme with `createBaseTheme(mode)`. `theme/defaultTheme.tsx` persists `mode` but always uses `lightColors`.
- Risk: consumers can toggle to `dark` while receiving light semantic colors.
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

### THM-PLRNUI6-04 - ThemeProvider currently owns app-shell responsibilities

- Status: verified.
- Evidence: `theme/ThemeProvider.tsx` imports and renders `SafeAreaProvider`, `SafeAreaView`, and `ScrollView`; ADR 0004 states safe area, scroll container, and app layout wrappers should be optional or separate.
- Risk: consumers may get unexpected layout/provider nesting when they only need theme context.
- Priority: P1.

### THM-PLRNUI6-05 - Hardcoded values remain in public/beta component candidates

- Status: verified.
- Evidence: Button height/padding/icon maps in `components/Button.tsx`; Input marker and offsets in `components/form/Input.tsx`; Switch/Checkbox/RadioGroup dimensions in `components/form/*`; navigation and overlay dimensions in `components/navigation/*` and `components/overlay/*`.
- Risk: component visuals cannot be consistently themed or overridden through ADR 0004 token layers.
- Priority: P1/P2 depending on component maturity.

## Release Candidate Gate Assessment

ADR 0004 verification gates are not met:

- Light/dark mode: not met for base theme/provider.
- Token docs present: partial, docs exist but still use AURA imports and legacy token names.
- Stable components without critical hardcoded values: not met; `audit/components/component-maturity-matrix.md` states no component is stable and several have blockers.
- Theme override example: not verified in this audit; code supports `themeOverrides` but merge typing is partial.
- Legacy token deprecation/rename mapping: partial; audit files identify candidates, but source still exposes only AURA token names.

