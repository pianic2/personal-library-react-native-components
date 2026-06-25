# Hardcoded Values Register - PLRNUI-6

## Scope

This register lists hardcoded values that affect theme/token architecture. Local layout constants such as `top: 0`, `left: 0`, or `width: "100%"` are included only when they represent reusable component sizing or theming policy.

Priorities:

- P0: blocks ADR 0004 core contract.
- P1: high-impact component token debt in core/public candidates.
- P2: medium-impact token debt in beta/experimental surfaces.
- P3: local or low-impact cleanup.

## Register

| ID | Priority | Path | Component | Hardcoded value | Risk | Evidence |
| --- | --- | --- | --- | --- | --- | --- |
| HCV-001 | P0 resolved by PLRNUI-27 | `theme/defaultTheme.tsx` | Base theme | formerly `colors: lightColors`; `backgroundColor: lightColors.background` | Resolved for base dark mode; `createBaseTheme(mode)` now selects semantic colors through `resolveColors(mode)`. | `tests/theme/base-theme-dark-mode.test.tsx` verifies dark base colors, dark app background, and provider toggle behavior. |
| HCV-002 | P1 resolved by PLRNUI-30 | `components/Button.tsx` | Button | formerly local `heightMap` values `26/32/40/48` | Resolved for approved component-token sizes `sm/md/lg`; legacy `xs` continues to use `theme.size.height.xs` because PLRNUI-30 did not add `components.button.height.xs`. | `theme.defaultTheme.components.button.height`; `tests/theme/button-component-tokens.test.tsx`; `audit/theme/button-component-token-contract-plrnui-30.md`. |
| HCV-003 | P1 resolved by PLRNUI-30 | `components/Button.tsx` | Button | formerly local `iconSizeMap` values `12/16/20/24` | Resolved for approved component-token sizes `sm/md/lg`; legacy `xs` retains the existing `12` fallback to preserve the public `size="xs"` behavior outside the PLRNUI-30 token contract. | `theme.defaultTheme.components.button.iconSize`; `tests/theme/button-component-tokens.test.tsx`; `audit/theme/button-component-token-contract-plrnui-30.md`. |
| HCV-004 | P1 resolved by PLRNUI-30 | `components/Button.tsx` | Button | formerly local `horizontalPadding` values `8/12/16/20`; `borderWidth: 2`; `gap: 8`; opacity `0.5` | Resolved for approved component-token sizes and structural state values through `theme.components.button.paddingX`, `borderWidth`, `gap`, and `opacity`; legacy `xs` padding keeps `theme.space.sm` to preserve existing behavior without widening the approved contract. | `theme.defaultTheme.components.button`; `components/Button.tsx`; `tests/theme/button-component-tokens.test.tsx`; `audit/theme/button-component-token-contract-plrnui-30.md`. |
| HCV-005 | P1 resolved by PLRNUI-31 | `src/components/Input/Input.tsx` | Input | formerly label marker `height: 10`, `width: 10`, `borderRadius: 5` | Resolved by removing the always-on decorative marker instead of promoting it into the theme contract. | `src/components/Input/Input.tsx`; `audit/theme/input-component-token-contract-plrnui-31.md`. |
| HCV-006 | P1 resolved by PLRNUI-31 | `src/components/Input/Input.tsx` | Input | formerly `theme.size.height[size] - 2`; `theme.space["md"] - 2.5`; `paddingVertical: 0` | Resolved by replacing generic sizing and magic offsets with `theme.components.input.height`, `paddingX`, `paddingY`, `iconBoxHeight` and `radius`. | `src/components/Input/Input.tsx`; `tests/theme/input-component-tokens.test.tsx`; `audit/theme/input-component-token-contract-plrnui-31.md`. |
| HCV-007 | P1 resolved by PLRNUI-32 | `src/components/Card/Card.tsx` | Card | formerly `radius = 14` | Resolved by removing the hardcoded prop default and mapping Card radius, padding and shadow defaults through `theme.components.card` with approved base-token fallbacks. | `theme/defaultTheme.tsx`; `src/components/Card/Card.tsx`; `tests/theme/card-component-tokens.test.tsx`; `audit/theme/card-component-token-contract-plrnui-32.md`. |
| HCV-008 | P1 | `components/form/Switch.tsx` | Switch | Track `44x24`, radius `24`, padding `2`; thumb `20x20`, radius `20`, margin `20` | Control dimensions cannot be themed or aligned to component tokens. | Switch style object. |
| HCV-009 | P1 | `components/form/Checkbox.tsx` | Checkbox | Box `22x22`, border width `2`; icon size `16` | Form control size and icon size are not tokenized. | Checkbox style and Check icon. |
| HCV-010 | P1 | `components/form/RadioGroup.tsx` | RadioGroup | Outer `22x22/radius 22`; inner `12x12/radius 12`; border width `2` | Radio dimensions are not tokenized and cannot share form control scale. | RadioGroup style objects. |
| HCV-011 | P2 | `components/navigation/TopBar.tsx` | TopBar | Row `height: 40`; link `width: 90` | Navigation sizing is not represented by layout/navigation tokens. | TopBar row and Link style. |
| HCV-012 | P2 | `components/navigation/BottomBar.tsx` | BottomBar | `zIndex` fallback `100`; `height: 60`; `minWidth: 64`; `marginTop: 4` | Navigation dimensions and fallback layering can drift from tokens. | BottomBar style object. |
| HCV-013 | P2 | `components/navigation/SideBar.web.tsx` | SideBar | Default width `280`; collapsed width `72`; icon size `18`; opacity `0.7` | Sidebar sizing/state values are not tokenized and are web-only behavior. | SideBar props/defaults and pressable style. |
| HCV-014 | P2 | `components/overlay/Modal.tsx` | Modal | Width map `360/480/640`; RNModal style `rgba(0,0,0,0.5)` | Overlay size tokens are missing; modal style backdrop duplicates `colors.backdrop` path. | Modal `widthMap` and `RNModal` style. |
| HCV-015 | P2 | `components/overlay/BottomSheet.tsx` | BottomSheet | Snap heights `"35%"`/`"70%"`; handle `48x5`, radius `5` | Sheet behavior and handle dimensions are not tokenized. | BottomSheet `sheetHeight` and handle view. |
| HCV-016 | P2 | `components/overlay/Tooltip.tsx` | Tooltip | Default delay `1000`; fallback position `50/50`; anchor inflation `+10`; padding vertical `6`; max width `260` | Tooltip motion/geometry is not represented by overlay tokens. | Tooltip defaults and style. |
| HCV-017 | P2 | `components/feedback/ToastProvider.tsx` | ToastProvider | Duration `3000`; animation durations `120/180`; max toasts `3`; translate `20/-20` | Feedback motion/queue behavior is not tokenized or documented as provider policy. | ToastProvider defaults and Animated timing. |
| HCV-018 | P2 | `components/feedback/ProgressBar.tsx` | ProgressBar | Height `8`; fallback width `"30%"` | Progress dimensions are not tokenized; component has existing functional blocker in component audit. | ProgressBar style and `audit/components/component-maturity-matrix.md`. |
| HCV-019 | P2 | `components/form/Textarea.tsx` | Textarea | `minHeight: 100`; props typed `any` | Textarea sizing not tokenized; implementation maturity already internal/blocking. | Textarea source and component maturity matrix. |
| HCV-020 | P3 | `components/surfaces/Hero.tsx` | Hero | `height - 80` | App-shell/screen behavior is embedded in component; experimental component per component audit. | Hero source and `audit/components/component-maturity-matrix.md`. |

## Critical Themes

- Core P0: base dark mode hardcoded-light blocker is resolved by PLRNUI-27.
- Core P1: Button reads approved structural `theme.components.button` tokens after PLRNUI-30; Input reads approved structural `theme.components.input` tokens after PLRNUI-31; Card reads approved structural `theme.components.card` tokens after PLRNUI-32.
- Form controls need a shared control-size token family before stable promotion.
- Overlay/navigation tokens are missing; current values may remain experimental until component maturity decisions are made.
