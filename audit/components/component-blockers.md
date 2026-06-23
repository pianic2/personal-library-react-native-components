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

## Resolved in PLRNUI-22

| Blocker ID | Component | New maturity ceiling | Remediation evidence | Stable status |
| --- | --- | --- | --- | --- |
| PLRNUI5-BLK-005 | `TopBar` | beta | `src/components/TopBar/TopBar.tsx` removes the consumer-facing placeholder fallback; `tests/components/component-smoke.test.tsx` asserts missing slots do not render placeholder text. | Not stable; stable gate still requires docs/platform/support review. |
| PLRNUI5-BLK-006 | `NavBar` | beta | `src/components/NavBar/NavBar.tsx` passes `bottomMaxItems` to `BottomBar`; `tests/components/component-smoke.test.tsx` asserts extra items are not rendered and no overflow item appears. | Not stable; stable gate still requires navigation docs/platform/support review. |
| PLRNUI5-BLK-015 | `SideBar` | experimental | `src/components/SideBar/SideBar.tsx` now renders a minimal native-safe vertical list instead of `null`; `tests/components/component-smoke.test.tsx` asserts sidebar rendering through `NavBar`. | Still experimental pending richer accessibility/layout support evidence. |
| PLRNUI5-BLK-019 | `Link` | beta | `src/components/Link/Link.tsx` exports `LinkRouterAdapter`, supports `routerAdapter`, keeps `onPress`, guards `window`, and no-ops safely on native without a navigation handler; smoke tests assert no-crash, `onPress`, and adapter navigation. | Not stable; stable gate still requires docs/platform/support review. |

## Documented in PLRNUI-23

| Blocker ID | Component | Current maturity | PLRNUI-23 evidence | Stable status |
| --- | --- | --- | --- | --- |
| PLRNUI5-BLK-013 | `Tooltip` | experimental | `audit/components/overlay-platform-contract-plrnui-23.md`; `tests/components/component-smoke.test.tsx` renders `Tooltip`; source explicitly returns children only when `Platform.OS !== "web"`. | Not stable; native fallback, keyboard/focus and screen reader behavior remain incomplete. |
| PLRNUI5-BLK-014 | `Popover` | experimental | `audit/components/overlay-platform-contract-plrnui-23.md`; `tests/components/component-smoke.test.tsx` renders `Popover`; source explicitly returns trigger only when `Platform.OS !== "web"`. | Not stable; native fallback, keyboard/focus and screen reader behavior remain incomplete. |
| PLRNUI5-BLK-016 | `BottomSheet` | experimental | `audit/components/overlay-platform-contract-plrnui-23.md`; `tests/components/component-smoke.test.tsx` renders `BottomSheet`. | Not stable; gesture, keyboard, safe area and richer snap behavior remain incomplete. |
| PLRNUI5-BLK-017 | `Modal` | experimental | `audit/components/overlay-platform-contract-plrnui-23.md`; `tests/components/component-smoke.test.tsx` renders `Modal`. | Not stable; focus, accessibility, keyboard and runtime platform behavior remain incomplete. |
| PLRNUI5-BLK-018 | `Select` | experimental | `audit/components/overlay-platform-contract-plrnui-23.md`; `tests/components/component-smoke.test.tsx` renders `Select`. | Not stable; keyboard, screen reader and focus behavior remain incomplete. |

## Platform or behavior blockers

| Blocker ID | Component | Current maturity | Evidence | Impact | Recommended Jira ticket |
| --- | --- | --- | --- | --- | --- |
| PLRNUI5-BLK-013 | `Tooltip` | experimental | `src/components/Tooltip/Tooltip.tsx`; `audit/components/overlay-platform-contract-plrnui-23.md` | Native renders only children and never renders tooltip content. | Implement native fallback or add explicit non-stable docs and accessibility coverage before promotion. |
| PLRNUI5-BLK-014 | `Popover` | experimental | `src/components/Popover/Popover.tsx`; `audit/components/overlay-platform-contract-plrnui-23.md` | Native renders only the trigger and never renders popover content. | Implement native fallback or add explicit non-stable docs and accessibility coverage before promotion. |
| PLRNUI5-BLK-015 | `SideBar` | experimental | `components/navigation/SideBar.tsx`; `components/navigation/SideBar.web.tsx`; `audit/02-component-inventory.md` | Native implementation returns `null`; web behavior depends on platform resolution. | Add SideBar platform support matrix and native fallback decision. |
| PLRNUI5-BLK-016 | `BottomSheet` | experimental | `src/components/BottomSheet/BottomSheet.tsx`; `audit/components/overlay-platform-contract-plrnui-23.md` | Gesture, keyboard and snap behavior are incomplete. | Add runtime platform, keyboard, safe area and gesture tests before promotion. |
| PLRNUI5-BLK-017 | `Modal` | experimental | `src/components/Modal/Modal.tsx`; `audit/components/overlay-platform-contract-plrnui-23.md` | Modal platform semantics, focus and accessibility behavior are not fully verified. | Add Modal focus/accessibility/platform interaction tests before promotion. |
| PLRNUI5-BLK-018 | `Select` | experimental | `src/components/Select/Select.tsx`; `audit/components/overlay-platform-contract-plrnui-23.md` | Modal select behavior lacks keyboard/accessibility proof. | Stabilize Select keyboard/accessibility behavior before promotion. |
| PLRNUI5-BLK-019 | `Link` | beta | `components/navigation/Link.tsx`; `audit/02-component-inventory.md` | Uses web navigation fallback and lacks router adapter contract. | Define Link router adapter strategy and platform behavior. |

PLRNUI-22 note: PLRNUI5-BLK-015 and PLRNUI5-BLK-019 are retained above as historical blocker rows from the PLRNUI-5 audit baseline. Current remediation evidence is recorded in `audit/components/navigation-platform-contract-plrnui-22.md`.

PLRNUI-23 note: PLRNUI5-BLK-013, PLRNUI5-BLK-014, PLRNUI5-BLK-016, PLRNUI5-BLK-017 and PLRNUI5-BLK-018 are now documented and smoke-rendered, but remain blockers for stable promotion.

## Cross-cutting blockers

| Blocker ID | Scope | Evidence | Impact | Recommended Jira ticket |
| --- | --- | --- | --- | --- |
| PLRNUI5-BLK-020 | Component-like exports without smoke coverage | PLRNUI-20 added `tests/components/component-smoke.test.tsx`; PLRNUI-21 extends it for `Card`, `ProgressBar`, `CodeInline`, `Textarea` and `PasswordInput`; PLRNUI-22 extends it for `TopBar`, `BottomBar`, `NavBar`, `Link` and `SideBar`; PLRNUI-23 extends it for `Modal`, `BottomSheet`, `Tooltip`, `Popover` and `Select`. | Components without smoke/render or equivalent tests remain blocked from `stable`; PLRNUI-23 coverage does not satisfy the full stable gate by itself. | Continue targeted smoke/interaction coverage for remaining beta/stable candidates. |
| PLRNUI5-BLK-021 | Public/beta component props | `audit/api/public-types.md` | Many public candidates do not export named props types, blocking stable consumer contracts. | Export named props types for approved public components. |
| PLRNUI5-BLK-022 | Root API scope | `index.ts`; `audit/api/export-matrix.md`; `audit/migration/breaking-change-register.md` `BC-004`, `BC-007` | Root exports currently include internal/experimental components. | Move/fence internal and experimental components before stable release. |
