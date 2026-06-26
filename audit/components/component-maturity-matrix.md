# PLRNUI-5 - Component Maturity Matrix

## Scope

Classificazione iniziale dei componenti reali esportati dalla root API corrente
tramite `src/index.ts`, piu l'alias root `Stack`.

PLRNUI-60 current-state note: le righe storiche derivate da source-tree
inventory o barrel legacy non coincidono sempre con la root public surface
corrente. Per RC-hardening, la source of truth della root surface e
`src/index.ts`; `audit/api/export-matrix.md` resta il registro piu ampio per
hook, provider, tipi, utility, theme e token.

Inclusi:

- componenti React;
- provider component-like;
- alias component-like esportati dai sorgenti, ad esempio `Stack`.

Esclusi dalla conta componenti:

- type-only export;
- hook non-component, utility, storage, token e theme export. Questi restano tracciati in `audit/api/export-matrix.md` e sono citati qui solo quando influenzano un componente.
- source-tree-only entries that are not currently root-exported from `src/index.ts`.

## Classification rules applied

- Nessun componente e classificato `stable`: `rg --files -g '*test*' -g '*spec*' -g '__tests__/**'` non trova test nel repository.
- Componenti con bug runtime o funzionali noti non sono `stable`.
- Componenti con docs presenti ma test assenti sono al massimo `beta`.
- Componenti con limiti web-only, native-null, gesture/keyboard/accessibility non stabilizzati sono `experimental`.
- Componenti rotti o con props `any`/implementation detail esposte dalla root sono `internal` finche non vengono corretti o rimossi/spostati.
- Nessun componente esportato risulta deprecated in questa classificazione iniziale; i simboli legacy AURA deprecated sono token (`auraTokens`, `getAuraTokens`) e non componenti.

## Evidence baseline

- Root export: `index.ts`.
- Package root only: `package.json:exports["."]`.
- Inventory: `audit/02-component-inventory.md`.
- API classification: `audit/api/export-matrix.md`, `audit/api/root-api-proposal.md`, `audit/api/public-types.md`.
- Platform and deep import constraints: `audit/api/deep-import-audit.md`.
- Migration risk: `audit/migration/breaking-change-register.md`.
- Governance: `audit/adr/0003-component-stability-classification.md`, `audit/adr/0007-documentation-and-example-app-strategy.md`, `audit/risk-assessment/0003-component-stability-misclassification-risk.md`, `audit/adr-review.md`.

PLRNUI-22 current-state note: navigation sources now live under `src/components/<ComponentName>/<ComponentName>.tsx` with local `index.ts` barrels and root exports from `src/index.ts`. PLRNUI-22 hardens `TopBar`, `BottomBar`, `NavBar`, `Link` and `SideBar`, adds smoke coverage, and records the platform contract in `audit/components/navigation-platform-contract-plrnui-22.md`. This does not promote any component to `stable`.

PLRNUI-23 current-state note: overlay/form modal sources now live under `src/components/<ComponentName>/<ComponentName>.tsx` with local `index.ts` barrels and root exports from `src/index.ts`. PLRNUI-23 adds API visibility, smoke/render coverage and `audit/components/overlay-platform-contract-plrnui-23.md` for `Modal`, `BottomSheet`, `Tooltip`, `Popover` and `Select`. The classification does not change: these components remain `experimental` and are not promoted to `stable`.

PLRNUI-25 current-state note: `audit/components/component-platform-support-matrix-plrnui-25.md` now declares iOS, Android and Web support posture for current root-public component candidates and explicitly records web-only/native-fallback behavior for platform-risk components. This satisfies a documentation prerequisite for future stable promotion, but no component is promoted to `stable`.

PLRNUI-26 current-state note: `Stack` is root-reachable through `src/index.ts` and is classified as a layout primitive public candidate, not an internal-only alias. Internal helpers `useIsMounted` and `cn` are excluded from root and are not component maturity entries. `useNavigate`, overlays and app-shell navigation exports may remain root-visible only as documented experimental/pre-stable APIs; no component is promoted to `stable`.

PLRNUI-60 current-state note: current root runtime component/provider surface
from `src/index.ts` is:

- Beta public component/provider surface: `Alert`, `B`, `Badge`, `Box`,
  `Button`, `Card`, `Checkbox`, `CodeInline`, `Column`, `Stack`, `Divider`,
  `FormField`, `Heading`, `Input`, `Link`, `NavBar`, `NavProvider`, `P`,
  `PasswordInput`, `ProgressBar`, `Quote`, `RadioGroup`, `Row`, `Small`,
  `Spinner`, `Switch`, `Text`, `TextGroup`, `Textarea`, `TopBar`.
- Experimental root component surface: `BottomBar`, `BottomSheet`, `Modal`,
  `Popover`, `Select`, `SideBar`, `Tooltip`.
- Root hooks from `src/components/NavContext` are not component maturity rows:
  `useNav` is beta/public-candidate and `useNavigate` is experimental in
  `audit/api/export-matrix.md`.
- Source-tree-only / historical inventory rows not currently root-exported:
  `Code`, `Page`, `Hero`, `ToastProvider`. They remain historical/source-tree
  evidence and must not be counted as current root public API.

## Matrix

| Area | Export | Source/export evidence | Initial maturity | Stable blocker | Platform limit | Notes |
| --- | --- | --- | --- | --- | --- | --- |
| Button | `Button` | `index.ts` exports `./components/Button`; source `components/Button.tsx`; docs `docs/components/buttons/button.md`; audit `CMP-07` | beta | No tests; variant `info` not handled | Cross-platform expected, unverified | Keep public candidate, but props type is not exported and variant map must be completed before stable. |
| Layout | `Box` | `components/layout/index.tsx`; source `components/layout/Box.tsx`; docs `docs/components/layout/box.md` | beta | No tests; props type not exported | Web shadow behavior needs explicit support note | Foundational primitive; candidate stable after docs/test/support matrix hardening. |
| Layout | `Column` | `components/layout/index.tsx`; source `components/layout/Column.tsx`; docs `docs/components/layout/column.md` | beta | No tests; props type not exported | Cross-platform expected, unverified | Child wrapping and index keys are known implementation debt. |
| Layout | `Stack` | `src/index.ts` exports `Stack` from `src/components/Column/index.ts`; source alias in `src/components/Column/Column.tsx` | beta | Stable gate incomplete: alias policy, docs/platform/support review and consumer evidence remain open | Cross-platform expected through `Column`, unverified as a named alias | PLRNUI-26 reconciles this as a root-reachable layout primitive public candidate, not an internal-only alias. |
| Layout | `Row` | `components/layout/index.tsx`; source `components/layout/Row.tsx`; docs `docs/components/layout/row.md`; audit `Row` ineffective `flex` prop | beta | No tests; `flex` prop declared but not applied | Cross-platform expected, unverified | Public candidate after prop behavior fix and props export. |
| Layout | `Divider` | `components/layout/index.tsx`; source `components/layout/Divider.tsx`; docs `docs/components/layout/divider.md` | beta | No tests; props type not exported | Cross-platform expected, unverified | Simple component, but double `useTheme()` call should be cleaned before stable. |
| Typography | `P` | `components/typography/index.ts`; source `components/typography/P.tsx`; docs `docs/components/typography/p.md` | beta | No tests; `PProps` not exported | Cross-platform expected, unverified | Public shorthand candidate. |
| Typography | `B` | `components/typography/index.ts`; source `components/typography/B.tsx`; docs `docs/components/typography/b.md` | beta | No tests; `PProps` not exported | Cross-platform expected, unverified | Public shorthand candidate. |
| Typography | `Small` | `components/typography/index.ts`; source `components/typography/Small.tsx`; docs `docs/components/typography/small.md` | beta | No tests; `PProps` not exported | Cross-platform expected, unverified | Public shorthand candidate. |
| Typography | `Code` | Historical/source-tree inventory; not exported from current `src/index.ts` | experimental | No current root public API; clipboard/timer lifecycle not hardened | Clipboard dependency requires platform notes | PLRNUI-60 classifies this as source-tree-only / not current root public API. |
| Typography | `CodeInline` | `components/typography/index.ts`; source `components/typography/CodeInline.tsx`; docs `docs/components/typography/code-inline.md`; PLRNUI-21 remediation | beta | Stable gate incomplete: docs/platform/support review remains | Cross-platform expected, smoke-rendered in Node harness | PLRNUI-21 fixed size/lineHeight resolution and added smoke assertion; no stable promotion. |
| Typography | `Quote` | `components/typography/index.ts`; source `components/typography/Quote.tsx`; docs `docs/components/typography/quote.md` | beta | No tests; inline anonymous props | Cross-platform expected, unverified | Candidate stable after props export and smoke test. |
| Typography | `Text` | `components/typography/index.ts`; source `components/typography/Text.tsx`; docs `docs/components/typography/text.md` | beta | No tests; public props type naming unresolved | Cross-platform expected, unverified | Core primitive; stable candidate after test/docs/support matrix. |
| Typography | `TextGroup` | `components/typography/index.ts`; source `components/typography/TextGroup.tsx`; docs `docs/components/typography/text-group.md` | beta | No tests; props type not exported | Cross-platform expected, unverified | Index keys are minor implementation debt. |
| Typography | `Heading` | `components/typography/index.ts`; source `components/typography/Heading.tsx`; docs `docs/components/typography/heading.md` | beta | No tests; props type not exported | Cross-platform expected, unverified | `children: string` limits React content; document or broaden before stable. |
| Typography | `Page` | Historical/source-tree inventory; not exported from current `src/index.ts` | experimental | No current root public API; app-level layout in typography inventory | ScrollView/app-shell behavior needs platform notes | PLRNUI-60 classifies this as source-tree-only / not current root public API. |
| Feedback | `Spinner` | `components/feedback/index.ts`; source `components/feedback/Spinner.tsx`; docs `docs/components/feedback/spinner.md` | beta | No tests; props type not exported | Cross-platform expected, unverified | Simple stable candidate after smoke test. |
| Feedback | `Alert` | `components/feedback/index.ts`; source `components/feedback/Alert.tsx`; docs `docs/components/feedback/alert.md` | beta | No tests; contrast/action behavior needs review | Cross-platform expected, unverified | Public candidate, blocked by accessibility/contrast verification. |
| Feedback | `ToastProvider` | Historical/source-tree inventory; not exported from current `src/index.ts` | experimental | No current root public API; web-specific `<div>` and timer lifecycle concerns | Web-specific implementation detail present; native behavior unverified | PLRNUI-60 classifies this as source-tree-only / not current root public API. |
| Feedback | `ProgressBar` | `components/feedback/index.ts`; source `components/feedback/ProgressBar.tsx`; docs `docs/components/feedback/progress-bar.md`; PLRNUI-21 remediation | beta | Stable gate incomplete: docs/platform/support review remains | Cross-platform expected, smoke-rendered in Node harness | PLRNUI-21 fixed clamped width application and added progress state assertion; no stable promotion. |
| Overlay | `Modal` | `src/components/Modal/index.ts`; source `src/components/Modal/Modal.tsx`; PLRNUI-23 contract | experimental | Stable gate incomplete: focus, accessibility, keyboard and runtime platform behavior unverified | Native modal semantics require deeper support proof | PLRNUI-23 adds root API visibility and smoke render coverage; no stable promotion. |
| Overlay | `BottomSheet` | `src/components/BottomSheet/index.ts`; source `src/components/BottomSheet/BottomSheet.tsx`; PLRNUI-23 contract | experimental | Stable gate incomplete: gesture, keyboard, safe area and snap behavior unverified | Mobile gesture/keyboard behavior unverified | PLRNUI-23 adds root API visibility and smoke render coverage; no stable promotion. |
| Overlay | `Tooltip` | `src/components/Tooltip/index.ts`; source `src/components/Tooltip/Tooltip.tsx`; PLRNUI-23 contract | experimental | Stable gate incomplete: native renders children only; keyboard/a11y unverified | Web tooltip content; native children-only fallback | PLRNUI-23 documents web behavior and explicit native fallback; no stable promotion. |
| Overlay | `Popover` | `src/components/Popover/index.ts`; source `src/components/Popover/Popover.tsx`; PLRNUI-23 contract | experimental | Stable gate incomplete: native renders trigger only; keyboard/a11y unverified | Web popover content; native trigger-only fallback | PLRNUI-23 documents web behavior and explicit native fallback; no stable promotion. |
| Surfaces | `Badge` | `components/surfaces/index.tsx`; source `components/surfaces/Badge.tsx`; docs `docs/components/surfaces/badge.md` | beta | No tests; color/variant review pending | Cross-platform expected, unverified | Public candidate after token/color and a11y review. |
| Surfaces | `Card` | `src/components/Card/index.ts`; source `src/components/Card/Card.tsx`; docs `docs/components/surfaces/card.md`; PLRNUI-21 remediation; PLRNUI-32 token contract | beta | Stable gate incomplete: docs/platform/support review and consumer runtime evidence remain | Cross-platform expected, smoke-rendered in Node harness; Card token path covered by focused test | PLRNUI-21 removed helper hook-rule violation and added render smoke coverage. PLRNUI-32 wires radius, padding and shadow defaults through `theme.components.card` and removes `radius = 14`. No stable promotion. |
| Surfaces | `Hero` | Historical/source-tree inventory; not exported from current `src/index.ts` | experimental | No current root public API; hardcoded screen height | App-shell/screen-size behavior needs platform notes | PLRNUI-60 classifies this as source-tree-only / not current root public API. |
| Form | `Input` | `components/form/index.ts`; source `components/form/Input.tsx`; docs `docs/components/form/input.md`; audit `CMP-08` | beta | No tests; label/focus behavior needs contract | Cross-platform expected, unverified | Public candidate after props export and FormField composition decision. |
| Form | `PasswordInput` | `components/form/index.ts`; source `components/form/PasswordInput.tsx`; docs `docs/components/form/password-input.md`; PLRNUI-21 remediation | beta | Stable gate incomplete: fuller accessibility/platform validation remains | Cross-platform expected, smoke-rendered in Node harness | PLRNUI-21 added explicit props plus controlled/uncontrolled accessible visibility toggle; no stable promotion. |
| Form | `Switch` | `components/form/index.ts`; source `components/form/Switch.tsx`; docs `docs/components/form/switch.md` | beta | No tests; accessibility and animation gaps | Cross-platform expected, unverified | Public candidate after accessibility state and smoke test. |
| Form | `Checkbox` | `components/form/index.ts`; source `components/form/Checkbox.tsx`; docs `docs/components/form/checkbox.md` | beta | No tests; accessibility role/state missing | Cross-platform expected, unverified | Public candidate after accessibility support. |
| Form | `RadioGroup` | `components/form/index.ts`; source `components/form/RadioGroup.tsx`; docs `docs/components/form/radio-group.md` | beta | No tests; option type not exported; disabled/a11y gaps | Cross-platform expected, unverified | Public candidate after public option type and accessibility contract. |
| Form | `Select` | `src/components/Select/index.ts`; source `src/components/Select/Select.tsx`; PLRNUI-23 contract | experimental | Stable gate incomplete: keyboard, focus and screen reader behavior unverified | Modal behavior is present; keyboard support unverified | PLRNUI-23 adds root API visibility and smoke render coverage; no stable promotion. |
| Form | `FormField` | `components/form/index.ts`; source `components/form/FormField.tsx`; docs `docs/components/form/form-field.md` | beta | No tests; clone-props behavior heuristic | Cross-platform expected, unverified | Public candidate after props export and child contract docs. |
| Form | `Textarea` | `components/form/index.ts`; source `components/form/Textarea.tsx`; docs `docs/components/form/textarea.md`; PLRNUI-21 remediation | beta | Stable gate incomplete: form contract/docs review remains | Cross-platform expected, smoke-rendered in Node harness | PLRNUI-21 added explicit props, semantic spacing token usage and multiline assertion; no stable promotion. |
| Navigation | `NavProvider` | `components/navigation/index.ts`; source `components/navigation/NavContext.tsx`; docs `docs/components/navigation/nav-context.md` | beta | No tests; helper hooks expose implementation details | Cross-platform expected, unverified | Provider can be public, but helper hook exports need API decision. |
| Navigation | `Link` | `src/components/Link/index.ts`; source `src/components/Link/Link.tsx`; PLRNUI-22 evidence | beta | Stable gate incomplete: docs/platform/support review remains | Router-agnostic; guarded web fallback; safe native no-op without handler | PLRNUI-22 adds `LinkRouterAdapter`, guards `window`, and adds smoke coverage for no-crash, `onPress`, and adapter navigation. |
| Navigation | `NavBar` | `src/components/NavBar/index.ts`; source `src/components/NavBar/NavBar.tsx`; PLRNUI-22 evidence | beta | Stable gate incomplete: docs/platform/support review remains | Cross-platform layout behavior smoke-rendered in Node harness | PLRNUI-22 wires `bottomMaxItems` to `BottomBar` as a visible item limit with no overflow menu/item. |
| Navigation | `TopBar` | `src/components/TopBar/index.ts`; source `src/components/TopBar/TopBar.tsx`; PLRNUI-22 evidence | beta | Stable gate incomplete: docs/platform/support review remains | Cross-platform render-safe in source; richer platform UX unproven | PLRNUI-22 removes placeholder fallback text and smoke-tests missing-slot behavior. |
| Navigation | `BottomBar` | `src/components/BottomBar/index.ts`; source `src/components/BottomBar/BottomBar.tsx`; PLRNUI-22 evidence | experimental | Stable gate incomplete: docs/platform/support review remains | Absolute bottom layout remains an app-shell/platform consideration | PLRNUI-22 documents and tests visible item limiting with no overflow. |
| Navigation | `SideBar` | `src/components/SideBar/index.ts`; source `src/components/SideBar/SideBar.tsx` and `SideBar.web.tsx`; PLRNUI-22 evidence | experimental | Stable gate incomplete: accessibility/layout support review remains | Minimal native vertical list; web-specific file remains available | PLRNUI-22 replaces native `null` with a safe list and smoke-tests rendering. |

## Counts

| Maturity | Count |
| --- | ---: |
| stable | 0 |
| beta root component/provider surface | 30 |
| experimental root component surface | 7 |
| historical/source-tree-only entries | 4 |
| internal | 0 |
| deprecated | 0 |
| total | 41 |

Count interpretation:

- Current root component/provider surface total: 37.
- Current stable root surface: 0.
- Historical/source-tree-only rows are retained for governance continuity but are
  not current root public API.

## PLRNUI-25 platform support evidence

The component platform support matrix for public candidates is now tracked in `audit/components/component-platform-support-matrix-plrnui-25.md`.

Stable promotion remains blocked because the new matrix is documentation evidence only. The remaining gates include consumer runtime verification, richer interaction/accessibility coverage, and component-specific blocker cleanup recorded in `audit/components/component-blockers.md`.
