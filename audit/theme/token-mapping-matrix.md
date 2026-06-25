# Token Mapping Matrix - PLRNUI-6

## Classification Rules

- `verified`: present in code and wired to at least one consumer or public export.
- `partial`: present in type/code but not consistently wired to components or provider behavior.
- `declared-not-wired`: declared as contract but current implementation does not connect behavior.
- `missing`: not present in code.
- `blocked`: cannot be verified from repository evidence without runtime/demo/test execution.

## Primitive to Semantic to Component Tokens

| Layer | Token source | Current tokens | Mapping / consumers | Status | Evidence |
| --- | --- | --- | --- | --- | --- |
| Primitive color values | `tokens/colors.base.ts` | Hex/RGBA values inside `lightColors` and `darkColors` | Used directly as semantic role values in the same exported objects | verified | `tokens/colors.base.ts` exports `lightColors`, `darkColors`, `resolveColors`. |
| Semantic color roles | `tokens/colors.base.ts` | `primary`, `secondary`, `accent`, `success`, `warning`, `error`, `info`, `background`, `surface`, `surfaceElevated`, `textPrimary`, `textSecondary`, `textMuted`, `textInverted`, `border`, `divider`, `outline`, `disabled`, `disabledBg`, `overlay`, `backdrop`, `codeBorder`, `codeBg`, `codeText` | Consumed by components through `useTheme().colors`; grouped in `tokens/themeTokens.ts` as `surface`, `text`, `border`, `brand`, `feedback` | verified | `components/Button.tsx`, `components/form/Input.tsx`, `components/surfaces/Card.tsx`, `components/overlay/Modal.tsx`, `tokens/themeTokens.ts`. |
| Primitive spacing scale | `tokens/spacing.base.ts` | Numeric keys `0`, `4`, `8`, `12`, `20`, `30`, `80` | Basis for semantic `space` aliases | verified | `tokens/spacing.base.ts`. |
| Semantic spacing aliases | `tokens/spacing.base.ts` | `none`, `xs`, `sm`, `md`, `lg`, `xl`, `xxl` | Widely consumed as `theme.space.*` and `theme.space[size]` | verified | `components/Button.tsx`, `components/layout/*`, `components/form/Input.tsx`, `components/navigation/*`, `components/overlay/*`. |
| Radius scale | `tokens/radius.base.ts` | `none`, `xs`, `sm`, `md`, `lg`, `xl`, `full` | Consumed as `theme.radius.*`; component-token defaults can map to the same scale | verified | `theme/defaultTheme.tsx` maps Button/Input radius to `radius.md` and Card radius to `radius.lg`. |
| Typography scale | `tokens/typography.base.ts` | Font family, font size, line height, weight | Consumed by typography and Button text | verified | `components/Button.tsx`, `components/typography/Text.tsx`, `components/typography/Heading.tsx`. |
| Shadow tokens | `tokens/shadows.base.ts` | `none`, `sm`, `md`, `lg` with RN shadow/elevation values | Consumed by Box/Card shadow helpers; web `boxShadow` reconstructs RGBA string | verified | `components/layout/Box.tsx`; `src/components/Card/Card.tsx`; `tests/theme/card-component-tokens.test.tsx`. |
| z-index tokens | `tokens/zIndex.base.ts` | `base`, `dropdown`, `sticky`, `overlay`, `modal`, `toast`, `tooltip` | Consumed by navigation/overlay components, with at least one fallback | partial | `components/navigation/BottomBar.tsx` uses `theme.zIndex?.sticky ?? 100`; `components/overlay/Tooltip.tsx` uses `theme.zIndex.tooltip`. |
| Size tokens | `tokens/size.base.ts` | `height.xs`, `height.sm`, `height.md`, `height.lg` | Consumed by Input and by Button defaults for `theme.components.button.height.sm/md/lg`; Button keeps `xs` on the primitive scale because PLRNUI-30 only approved component-token sizes `sm/md/lg`. | verified | `components/form/Input.tsx`; `theme/defaultTheme.tsx`; `components/Button.tsx`. |
| Theme tokens | `tokens/themeTokens.ts` | `ThemeTokens`, `defaultThemeTokens`, `createThemeTokens(mode)` | Neutral public token API for default light tokens and light/dark token creation | verified | `tokens/index.ts`; `src/index.ts`; `tests/theme/token-public-api.test.tsx`; `audit/theme/token-naming-removal-plrnui-29.md`. |
| Component tokens - Button | `theme/types.ts` | `components.button.height.sm/md/lg`, `components.button.paddingX.sm/md/lg`, `components.button.iconSize.sm/md/lg`, `components.button.radius`, `components.button.gap`, `components.button.borderWidth`, `components.button.opacity.disabled`, `components.button.opacity.pressed` | Button reads approved structural component tokens from `theme.components.button`; colors remain semantic-token driven. | verified | `theme/types.ts`; `theme/defaultTheme.tsx`; `components/Button.tsx`; `tests/theme/button-component-tokens.test.tsx`; `audit/theme/button-component-token-contract-plrnui-30.md`. |
| Component tokens - Input | `theme/types.ts` | `components.input.height.xs/sm/md/lg`, `components.input.paddingX.xs/sm/md/lg`, `components.input.paddingY.xs/sm/md/lg`, `components.input.iconBoxHeight.xs/sm/md/lg`, `components.input.radius` | Input reads approved structural component tokens from `theme.components.input`; colors remain semantic-token driven. | verified | `theme/types.ts`; `theme/defaultTheme.tsx`; `src/components/Input/Input.tsx`; `tests/theme/input-component-tokens.test.tsx`; `audit/theme/input-component-token-contract-plrnui-31.md`. |
| Component tokens - Card | `theme/types.ts` | `components.card.radius`, `components.card.padding`, `components.card.shadow` | Card reads approved structural component tokens from `theme.components.card`; props remain explicit consumer overrides. | verified | `theme/types.ts`; `theme/defaultTheme.tsx`; `src/components/Card/Card.tsx`; `tests/theme/card-component-tokens.test.tsx`; `audit/theme/card-component-token-contract-plrnui-32.md`. |
| Component tokens - Form controls | none found | Switch/Checkbox/Radio dimensions | Dimensions hardcoded in component files | missing | `components/form/Switch.tsx`, `components/form/Checkbox.tsx`, `components/form/RadioGroup.tsx`. |
| Component tokens - Overlay/navigation | none found | Modal width, bottom sheet snaps/handle, tooltip delay/max width, nav dimensions | Dimensions hardcoded in component files | missing | `components/overlay/Modal.tsx`, `components/overlay/BottomSheet.tsx`, `components/overlay/Tooltip.tsx`, `components/navigation/*`. |

## Current Public Export Mapping

| Export | Source | Status | Evidence |
| --- | --- | --- | --- |
| `Theme`, `ThemeMode` | `theme/types.ts` | public/beta | `audit/api/export-matrix.md` lines for theme API classify them as public beta. |
| `ThemeProvider` | `theme/ThemeProvider.tsx` | public/beta with responsibility risk | `audit/api/export-matrix.md`; `theme/ThemeProvider.tsx` renders safe-area and scroll wrappers. |
| `useTheme` | `theme/useTheme.ts` | public/beta | `audit/api/export-matrix.md`; `theme/index.ts` exports it. |
| `createTheme` | `theme/createTheme.ts` | public/beta with merge typing risk | `audit/api/export-matrix.md`; `theme/createTheme.ts` uses `any` internally. |
| `auraTokens`, `getAuraTokens` | `tokens/themeTokens.ts` | removed/breaking | Removed from root and token barrels by PLRNUI-29; PLRNUI-53 confirms they are legacy/deprecated, not stable public API, forbidden in consumer examples, and not aliases. |
| `TokensSnapshot` | `tokens/themeTokens.ts` | removed/breaking | Removed from root and token barrels by PLRNUI-29; replacement is `ThemeTokens`. |
| `defaultThemeTokens`, `createThemeTokens` | `tokens/themeTokens.ts` | public/beta | Neutral public token exports verified by `tests/theme/token-public-api.test.tsx`. |
| `ThemeTokens` | `tokens/themeTokens.ts` | public/beta | Neutral public token type replacing `TokensSnapshot`. |
| `liquidglass*` theme exports | `themes/liquidglass/index.ts` | experimental | `audit/api/export-matrix.md` marks `createLiquidglassTheme`, `liquidglassTheme`, and `liquidglassDarkTheme` as experimental. |

## Gaps Against ADR 0004

| ADR 0004 expectation | Current evidence | Gap |
| --- | --- | --- |
| Public components prefer semantic and component tokens | Components often use semantic tokens; Button structural component tokens are wired by PLRNUI-30; Input structural component tokens are wired by PLRNUI-31; Card structural component tokens are wired by PLRNUI-32. | Remaining component-token work is for other promoted candidates, not the Button/Input/Card starting set from ADR 0004. |
| Light/dark changes semantic tokens coherently | `resolveColors` and liquidglass factory can choose dark; base theme does not | Need base `createBaseTheme` to use dark semantic colors before provider-level claim. |
| Override is typed and does not break structure | `themeOverrides?: Partial<Theme>` exists; merge uses `any` | Need typed merge contract or test evidence. |
| Legacy token names mapped/deprecated | PLRNUI-29 removes legacy/snapshot token names and exposes neutral names with no aliases | Consumer-facing docs/policy remain PLRNUI-53. |
