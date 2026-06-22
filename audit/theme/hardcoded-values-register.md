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
| HCV-001 | P0 | `theme/defaultTheme.tsx` | Base theme | `colors: lightColors`; `backgroundColor: lightColors.background` | Dark mode contract is declared but base theme remains light. | `createBaseTheme(mode)` accepts mode but assigns light colors. |
| HCV-002 | P1 | `components/Button.tsx` | Button | `heightMap` values `26/32/40/48` | Duplicates `tokens/size.base.ts` and bypasses `theme.components.button.height`. | `Button` local map; `tokens/size.base.ts` exports same height scale. |
| HCV-003 | P1 | `components/Button.tsx` | Button | `iconSizeMap` values `12/16/20/24` | No icon size token/component token; variant size cannot be themed. | Local `iconSizeMap`. |
| HCV-004 | P1 | `components/Button.tsx` | Button | `horizontalPadding` values `8/12/16/20`; `borderWidth: 2`; `gap: 8`; opacity `0.5` | Button spacing/state tokens cannot be overridden consistently. | Local maps and style object. |
| HCV-005 | P1 | `components/form/Input.tsx` | Input | Label marker `height: 10`, `width: 10`, `borderRadius: 5` | Visual marker is not represented by semantic/component tokens and may not belong in a generic input. | Inline Box before label. |
| HCV-006 | P1 | `components/form/Input.tsx` | Input | `theme.size.height[size] - 2`; `theme.space["md"] - 2.5`; `paddingVertical: 0` | Magic offsets make component sizing fragile and hard to theme. | Input container/TextInput styles. |
| HCV-007 | P1 | `components/surfaces/Card.tsx` | Card | `radius = 14` | Default radius is outside `radius` token scale (`md: 10`, `lg: 16`) and bypasses `theme.components.card.radius`. | Card props default. |
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

- Core P0: base dark mode is blocked by hardcoded light colors.
- Core P1: Button/Input/Card have component-token contracts in `theme/types.ts`, but their implementations do not read `theme.components.*`.
- Form controls need a shared control-size token family before stable promotion.
- Overlay/navigation tokens are missing; current values may remain experimental until component maturity decisions are made.

