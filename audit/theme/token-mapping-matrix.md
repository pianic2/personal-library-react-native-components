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
| Semantic color roles | `tokens/colors.base.ts` | `primary`, `secondary`, `accent`, `success`, `warning`, `error`, `info`, `background`, `surface`, `surfaceElevated`, `textPrimary`, `textSecondary`, `textMuted`, `textInverted`, `border`, `divider`, `outline`, `disabled`, `disabledBg`, `overlay`, `backdrop`, `codeBorder`, `codeBg`, `codeText` | Consumed by components through `useTheme().colors`; grouped in `tokens/snapshot.ts` as `surface`, `text`, `border`, `brand`, `feedback` | verified | `components/Button.tsx`, `components/form/Input.tsx`, `components/surfaces/Card.tsx`, `components/overlay/Modal.tsx`, `tokens/snapshot.ts`. |
| Primitive spacing scale | `tokens/spacing.base.ts` | Numeric keys `0`, `4`, `8`, `12`, `20`, `30`, `80` | Basis for semantic `space` aliases | verified | `tokens/spacing.base.ts`. |
| Semantic spacing aliases | `tokens/spacing.base.ts` | `none`, `xs`, `sm`, `md`, `lg`, `xl`, `xxl` | Widely consumed as `theme.space.*` and `theme.space[size]` | verified | `components/Button.tsx`, `components/layout/*`, `components/form/Input.tsx`, `components/navigation/*`, `components/overlay/*`. |
| Radius scale | `tokens/radius.base.ts` | `none`, `xs`, `sm`, `md`, `lg`, `xl`, `full` | Consumed as `theme.radius.*`; some components bypass it | partial | `components/Button.tsx` uses `theme.radius.md`; `components/surfaces/Card.tsx` defaults to `radius = 14`, outside the scale. |
| Typography scale | `tokens/typography.base.ts` | Font family, font size, line height, weight | Consumed by typography and Button text | verified | `components/Button.tsx`, `components/typography/Text.tsx`, `components/typography/Heading.tsx`. |
| Shadow tokens | `tokens/shadows.base.ts` | `none`, `sm`, `md`, `lg` with RN shadow/elevation values | Consumed by Box/Card shadow helpers; web `boxShadow` reconstructs RGBA string | partial | `components/layout/Box.tsx`, `components/surfaces/Card.tsx`; Card has a known hook-rule blocker in `audit/components/component-maturity-matrix.md`. |
| z-index tokens | `tokens/zIndex.base.ts` | `base`, `dropdown`, `sticky`, `overlay`, `modal`, `toast`, `tooltip` | Consumed by navigation/overlay components, with at least one fallback | partial | `components/navigation/BottomBar.tsx` uses `theme.zIndex?.sticky ?? 100`; `components/overlay/Tooltip.tsx` uses `theme.zIndex.tooltip`. |
| Size tokens | `tokens/size.base.ts` | `height.xs`, `height.sm`, `height.md`, `height.lg` | Consumed by Input; duplicated by Button local `heightMap` | partial | `components/form/Input.tsx` uses `theme.size.height[size]`; `components/Button.tsx` duplicates the same numeric height map. |
| Snapshot tokens | `tokens/snapshot.ts` | `TokensSnapshot`, `auraTokens`, `getAuraTokens(mode)` | Public token snapshot API, but names are legacy AURA | partial | `tokens/index.ts`; `audit/api/export-matrix.md`; `audit/migration/legacy-naming-map.md`. |
| Component tokens - Button | `theme/types.ts` | `components.button.height.sm/md/lg`, `components.button.radius` | Not read by Button implementation | declared-not-wired | `theme/types.ts`; `components/Button.tsx` uses local `heightMap`, `iconSizeMap`, `horizontalPadding`. |
| Component tokens - Input | `theme/types.ts` | `components.input.height`, `components.input.radius` | Not read by Input implementation | declared-not-wired | `theme/types.ts`; `components/form/Input.tsx` uses `theme.size.height`, `theme.radius.md`, local marker/offset values. |
| Component tokens - Card | `theme/types.ts` | `components.card.radius`, `components.card.shadow`, `components.card.padding` | Not read by Card implementation | declared-not-wired | `theme/types.ts`; `components/surfaces/Card.tsx` uses prop defaults and base tokens. |
| Component tokens - Form controls | none found | Switch/Checkbox/Radio dimensions | Dimensions hardcoded in component files | missing | `components/form/Switch.tsx`, `components/form/Checkbox.tsx`, `components/form/RadioGroup.tsx`. |
| Component tokens - Overlay/navigation | none found | Modal width, bottom sheet snaps/handle, tooltip delay/max width, nav dimensions | Dimensions hardcoded in component files | missing | `components/overlay/Modal.tsx`, `components/overlay/BottomSheet.tsx`, `components/overlay/Tooltip.tsx`, `components/navigation/*`. |

## Current Public Export Mapping

| Export | Source | Status | Evidence |
| --- | --- | --- | --- |
| `Theme`, `ThemeMode` | `theme/types.ts` | public/beta | `audit/api/export-matrix.md` lines for theme API classify them as public beta. |
| `ThemeProvider` | `theme/ThemeProvider.tsx` | public/beta with responsibility risk | `audit/api/export-matrix.md`; `theme/ThemeProvider.tsx` renders safe-area and scroll wrappers. |
| `useTheme` | `theme/useTheme.ts` | public/beta | `audit/api/export-matrix.md`; `theme/index.ts` exports it. |
| `createTheme` | `theme/createTheme.ts` | public/beta with merge typing risk | `audit/api/export-matrix.md`; `theme/createTheme.ts` uses `any` internally. |
| `auraTokens`, `getAuraTokens` | `tokens/snapshot.ts` | deprecated | `tokens/index.ts`; `audit/api/export-matrix.md`; `audit/migration/breaking-change-register.md`. |
| `TokensSnapshot` | `tokens/snapshot.ts` | public/beta | `audit/api/export-matrix.md`; neutral type name. |
| `liquidglass*` theme exports | `themes/liquidglass/index.ts` | experimental | `audit/api/export-matrix.md` marks `createLiquidglassTheme`, `liquidglassTheme`, and `liquidglassDarkTheme` as experimental. |

## Gaps Against ADR 0004

| ADR 0004 expectation | Current evidence | Gap |
| --- | --- | --- |
| Public components prefer semantic and component tokens | Components often use semantic tokens; component tokens are not wired | Need component-token source for Button/Input/Card before claiming this contract. |
| Light/dark changes semantic tokens coherently | `resolveColors` and liquidglass factory can choose dark; base theme does not | Need base `createBaseTheme` to use dark semantic colors before provider-level claim. |
| Override is typed and does not break structure | `themeOverrides?: Partial<Theme>` exists; merge uses `any` | Need typed merge contract or test evidence. |
| Legacy token names mapped/deprecated | Audit files identify legacy names; source still only exports AURA snapshot names | Need neutral token names plus alias/deprecation policy. |

