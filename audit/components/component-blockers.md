# PLRNUI-5 - Component Blockers

## Scope

Blocker operativi derivati da `audit/02-component-inventory.md`, `audit/api/export-matrix.md`, `audit/api/public-types.md`, `audit/risk-assessment/0003-component-stability-misclassification-risk.md` e verifica degli export reali da `index.ts` e `components/*`.

## Critical and high blockers

| Blocker ID | Component | Current maturity | Evidence | Impact | Recommended Jira ticket |
| --- | --- | --- | --- | --- | --- |
| PLRNUI5-BLK-005 | `TopBar` | experimental | `components/navigation/TopBar.tsx`; `audit/02-component-inventory.md` finding `CMP-05` | Fallback placeholder text can leak visibly into consumer UI. | Remove TopBar placeholder fallback and test slot rendering. |

## Medium blockers

| Blocker ID | Component | Current maturity | Evidence | Impact | Recommended Jira ticket |
| --- | --- | --- | --- | --- | --- |
| PLRNUI5-BLK-006 | `NavBar` | beta | `components/navigation/NavBar.tsx`; `audit/02-component-inventory.md` finding `CMP-06` | Public prop `bottomMaxItems` is ineffective. | Wire NavBar `bottomMaxItems` to BottomBar or remove prop from public contract. |
| PLRNUI5-BLK-007 | `Button` | beta | `components/Button.tsx`; `audit/02-component-inventory.md` finding `CMP-07`; docs `docs/components/buttons/button.md` | `variant="info"` is declared but not handled consistently. | Complete Button variant map and export `ButtonProps`. |
| PLRNUI5-BLK-008 | `Input` | beta | `components/form/Input.tsx`; `audit/02-component-inventory.md` finding `CMP-08`; docs `docs/components/form/input.md` | Required label and focus handler behavior make composition unstable. | Stabilize Input label/focus contract and export `InputProps`. |
| PLRNUI5-BLK-009 | `Row` | beta | `components/layout/Row.tsx`; `audit/02-component-inventory.md` row note | Declared `flex` prop is not applied. | Apply or remove Row `flex` prop and add layout smoke test. |
| PLRNUI5-BLK-011 | `Alert` | beta | `components/feedback/Alert.tsx`; `audit/02-component-inventory.md` | Ghost action on colored background can have contrast issues. | Verify Alert contrast states and action variants. |
| PLRNUI5-BLK-012 | `ToastProvider` | experimental | `components/feedback/ToastProvider.tsx`; `audit/02-component-inventory.md`; `audit/api/export-matrix.md` | Web-specific markup and timer lifecycle make provider unsuitable for stable API. | Harden ToastProvider platform behavior and lifecycle cleanup. |

## Resolved in PLRNUI-21

| Blocker ID | Component | New maturity ceiling | Remediation evidence | Stable status |
| --- | --- | --- | --- | --- |
| PLRNUI5-BLK-001 | `Card` | beta | `src/components/Card/Card.tsx` no longer calls `useTheme()` from `applyShadow`; `tests/components/component-smoke.test.tsx` renders `Card`. | Not stable; stable gate still requires broader docs/platform/support review. |
| PLRNUI5-BLK-002 | `ProgressBar` | beta | `src/components/ProgressBar/ProgressBar.tsx` clamps progress and applies calculated fill width; smoke test asserts `100%` clamp behavior. | Not stable; stable gate still requires documented progress contract/support review. |
| PLRNUI5-BLK-003 | `CodeInline` | beta | `src/components/CodeInline/CodeInline.tsx` resolves size once and uses it for `lineHeight`; smoke test asserts default size/lineHeight. | Not stable; stable gate still requires typography docs/platform review. |
| PLRNUI5-BLK-004 | `Textarea` | beta | `src/components/Textarea/Textarea.tsx` exposes explicit `TextareaProps`, uses semantic `theme.space.md`, and forces `multiline`; smoke test asserts multiline/top alignment. | Not stable; stable gate still requires form contract/docs review. |
| PLRNUI5-BLK-010 | `PasswordInput` | beta | `src/components/PasswordInput/PasswordInput.tsx` exposes explicit `PasswordInputProps`, adds controlled/uncontrolled visibility state, and renders an accessible toggle; smoke test asserts toggle behavior. | Not stable; stable gate still requires fuller accessibility/platform validation. |

## Platform or behavior blockers

| Blocker ID | Component | Current maturity | Evidence | Impact | Recommended Jira ticket |
| --- | --- | --- | --- | --- | --- |
| PLRNUI5-BLK-013 | `Tooltip` | experimental | `components/overlay/Tooltip.tsx`; `audit/02-component-inventory.md` | Native renders only children and never renders tooltip content. | Document Tooltip as web-only or implement native fallback. |
| PLRNUI5-BLK-014 | `Popover` | experimental | `components/overlay/Popover.tsx`; `audit/02-component-inventory.md` | Native renders only the trigger and never renders popover content. | Document Popover as web-only or implement native fallback. |
| PLRNUI5-BLK-015 | `SideBar` | experimental | `components/navigation/SideBar.tsx`; `components/navigation/SideBar.web.tsx`; `audit/02-component-inventory.md` | Native implementation returns `null`; web behavior depends on platform resolution. | Add SideBar platform support matrix and native fallback decision. |
| PLRNUI5-BLK-016 | `BottomSheet` | experimental | `components/overlay/BottomSheet.tsx`; `audit/02-component-inventory.md`; docs `docs/components/overlay/bottom-sheet.md` | Gesture, keyboard and snap behavior are incomplete. | Define BottomSheet interaction contract and add platform tests. |
| PLRNUI5-BLK-017 | `Modal` | experimental | `components/overlay/Modal.tsx`; `audit/02-component-inventory.md`; docs `docs/components/overlay/modal.md` | Modal platform semantics, dismiss behavior and styling are not verified. | Add Modal accessibility/platform smoke tests. |
| PLRNUI5-BLK-018 | `Select` | experimental | `components/form/Select.tsx`; `audit/02-component-inventory.md`; docs `docs/components/form/select.md` | Modal select behavior lacks keyboard/accessibility contract. | Stabilize Select keyboard/accessibility behavior. |
| PLRNUI5-BLK-019 | `Link` | beta | `components/navigation/Link.tsx`; `audit/02-component-inventory.md` | Uses web navigation fallback and lacks router adapter contract. | Define Link router adapter strategy and platform behavior. |

## Cross-cutting blockers

| Blocker ID | Scope | Evidence | Impact | Recommended Jira ticket |
| --- | --- | --- | --- | --- |
| PLRNUI5-BLK-020 | Component-like exports without smoke coverage | PLRNUI-20 added `tests/components/component-smoke.test.tsx`; PLRNUI-21 extends it for `Card`, `ProgressBar`, `CodeInline`, `Textarea` and `PasswordInput`. | Components without smoke/render or equivalent tests remain blocked from `stable`; PLRNUI-21 coverage does not satisfy the full stable gate by itself. | Continue targeted smoke/interaction coverage for remaining beta/stable candidates. |
| PLRNUI5-BLK-021 | Public/beta component props | `audit/api/public-types.md` | Many public candidates do not export named props types, blocking stable consumer contracts. | Export named props types for approved public components. |
| PLRNUI5-BLK-022 | Root API scope | `index.ts`; `audit/api/export-matrix.md`; `audit/migration/breaking-change-register.md` `BC-004`, `BC-007` | Root exports currently include internal/experimental components. | Move/fence internal and experimental components before stable release. |
