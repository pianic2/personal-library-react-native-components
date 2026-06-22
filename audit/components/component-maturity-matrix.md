# PLRNUI-5 - Component Maturity Matrix

## Scope

Classificazione iniziale dei componenti reali esportati dalla root API attuale tramite `index.ts` e i barrel sotto `components/*`, piu l'alias sorgente `Stack` trovato in `components/layout/Column.tsx`.

Inclusi:

- componenti React;
- provider component-like;
- alias component-like esportati dai sorgenti, ad esempio `Stack`.

Esclusi dalla conta componenti:

- type-only export;
- hook non-component, utility, storage, token e theme export. Questi restano tracciati in `audit/api/export-matrix.md` e sono citati qui solo quando influenzano un componente.

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

## Matrix

| Area | Export | Source/export evidence | Initial maturity | Stable blocker | Platform limit | Notes |
| --- | --- | --- | --- | --- | --- | --- |
| Button | `Button` | `index.ts` exports `./components/Button`; source `components/Button.tsx`; docs `docs/components/buttons/button.md`; audit `CMP-07` | beta | No tests; variant `info` not handled | Cross-platform expected, unverified | Keep public candidate, but props type is not exported and variant map must be completed before stable. |
| Layout | `Box` | `components/layout/index.tsx`; source `components/layout/Box.tsx`; docs `docs/components/layout/box.md` | beta | No tests; props type not exported | Web shadow behavior needs explicit support note | Foundational primitive; candidate stable after docs/test/support matrix hardening. |
| Layout | `Column` | `components/layout/index.tsx`; source `components/layout/Column.tsx`; docs `docs/components/layout/column.md` | beta | No tests; props type not exported | Cross-platform expected, unverified | Child wrapping and index keys are known implementation debt. |
| Layout | `Stack` | source alias `components/layout/Column.tsx`; `components/layout/index.tsx` currently does not export `Stack`; audit `export-matrix` marks human review | internal | Not root-reachable through current barrel; no docs/test | N/A until export decision | Treat as internal/currently non-root despite source alias. If intentionally exported later, classify beta or deprecated alias by policy. |
| Layout | `Row` | `components/layout/index.tsx`; source `components/layout/Row.tsx`; docs `docs/components/layout/row.md`; audit `Row` ineffective `flex` prop | beta | No tests; `flex` prop declared but not applied | Cross-platform expected, unverified | Public candidate after prop behavior fix and props export. |
| Layout | `Divider` | `components/layout/index.tsx`; source `components/layout/Divider.tsx`; docs `docs/components/layout/divider.md` | beta | No tests; props type not exported | Cross-platform expected, unverified | Simple component, but double `useTheme()` call should be cleaned before stable. |
| Typography | `P` | `components/typography/index.ts`; source `components/typography/P.tsx`; docs `docs/components/typography/p.md` | beta | No tests; `PProps` not exported | Cross-platform expected, unverified | Public shorthand candidate. |
| Typography | `B` | `components/typography/index.ts`; source `components/typography/B.tsx`; docs `docs/components/typography/b.md` | beta | No tests; `PProps` not exported | Cross-platform expected, unverified | Public shorthand candidate. |
| Typography | `Small` | `components/typography/index.ts`; source `components/typography/Small.tsx`; docs `docs/components/typography/small.md` | beta | No tests; `PProps` not exported | Cross-platform expected, unverified | Public shorthand candidate. |
| Typography | `Code` | `components/typography/index.ts`; source `components/typography/Code.tsx`; docs `docs/components/typography/code.md` | experimental | No tests; clipboard/timer lifecycle not hardened | Clipboard dependency requires platform notes | Keep out of stable root until unmount timer cleanup and clipboard support matrix are documented. |
| Typography | `CodeInline` | `components/typography/index.ts`; source `components/typography/CodeInline.tsx`; docs `docs/components/typography/code-inline.md`; audit `CMP-03` | internal | Known size/lineHeight bug; no tests | Cross-platform expected after fix, unverified | Do not promote until bug is fixed; `audit/api/export-matrix.md` already marks internal. |
| Typography | `Quote` | `components/typography/index.ts`; source `components/typography/Quote.tsx`; docs `docs/components/typography/quote.md` | beta | No tests; inline anonymous props | Cross-platform expected, unverified | Candidate stable after props export and smoke test. |
| Typography | `Text` | `components/typography/index.ts`; source `components/typography/Text.tsx`; docs `docs/components/typography/text.md` | beta | No tests; public props type naming unresolved | Cross-platform expected, unverified | Core primitive; stable candidate after test/docs/support matrix. |
| Typography | `TextGroup` | `components/typography/index.ts`; source `components/typography/TextGroup.tsx`; docs `docs/components/typography/text-group.md` | beta | No tests; props type not exported | Cross-platform expected, unverified | Index keys are minor implementation debt. |
| Typography | `Heading` | `components/typography/index.ts`; source `components/typography/Heading.tsx`; docs `docs/components/typography/heading.md` | beta | No tests; props type not exported | Cross-platform expected, unverified | `children: string` limits React content; document or broaden before stable. |
| Typography | `Page` | `components/typography/index.ts`; source `components/typography/Page.tsx`; docs `docs/components/typography/page.md` | experimental | No tests; app-level layout in typography barrel | ScrollView/app-shell behavior needs platform notes | Consider excluding from root stable API. |
| Feedback | `Spinner` | `components/feedback/index.ts`; source `components/feedback/Spinner.tsx`; docs `docs/components/feedback/spinner.md` | beta | No tests; props type not exported | Cross-platform expected, unverified | Simple stable candidate after smoke test. |
| Feedback | `Alert` | `components/feedback/index.ts`; source `components/feedback/Alert.tsx`; docs `docs/components/feedback/alert.md` | beta | No tests; contrast/action behavior needs review | Cross-platform expected, unverified | Public candidate, blocked by accessibility/contrast verification. |
| Feedback | `ToastProvider` | `components/feedback/index.ts`; source `components/feedback/ToastProvider.tsx`; docs `docs/components/feedback/toast-provider.md`; audit inventory | experimental | No tests; web-specific `<div>` and timer lifecycle concerns | Web-specific implementation detail present; native behavior unverified | Keep experimental until provider implementation and platform contract are hardened. |
| Feedback | `ProgressBar` | `components/feedback/index.ts`; source `components/feedback/ProgressBar.tsx`; docs `docs/components/feedback/progress-bar.md`; audit `CMP-02` | internal | Known functional bug: calculated width not applied; no tests | Cross-platform expected after fix, unverified | Do not present as public stable/beta until progress rendering is fixed. |
| Overlay | `Modal` | `components/overlay/index.ts`; source `components/overlay/Modal.tsx`; docs `docs/components/overlay/modal.md` | experimental | No tests; RNModal style/dismiss behavior not verified | Native modal semantics require explicit support matrix | Keep experimental until behavior, accessibility and platform support are proven. |
| Overlay | `BottomSheet` | `components/overlay/index.ts`; source `components/overlay/BottomSheet.tsx`; docs `docs/components/overlay/bottom-sheet.md` | experimental | No tests; snap/gesture/keyboard incomplete | Mobile gesture/keyboard behavior unverified | Candidate for separate stabilization ticket, not stable root. |
| Overlay | `Tooltip` | `components/overlay/index.ts`; source `components/overlay/Tooltip.tsx`; docs `docs/components/overlay/tooltip.md` | experimental | No tests; native renders children only | Web-only tooltip content; native-null equivalent behavior | Must declare web-only behavior before any public promotion. |
| Overlay | `Popover` | `components/overlay/index.ts`; source `components/overlay/Popover.tsx`; docs `docs/components/overlay/popover.md` | experimental | No tests; native renders trigger only | Web-only popover content; native fallback requires Modal/BottomSheet | Must declare web-only behavior before any public promotion. |
| Surfaces | `Badge` | `components/surfaces/index.tsx`; source `components/surfaces/Badge.tsx`; docs `docs/components/surfaces/badge.md` | beta | No tests; color/variant review pending | Cross-platform expected, unverified | Public candidate after token/color and a11y review. |
| Surfaces | `Card` | `components/surfaces/index.tsx`; source `components/surfaces/Card.tsx`; docs `docs/components/surfaces/card.md`; audit `CMP-01` | internal | Known hook usage bug; no tests | Cross-platform expected after fix, unverified | Blocked from stable/beta until hook rule violation is removed. |
| Surfaces | `Hero` | `components/surfaces/index.tsx`; source `components/surfaces/Hero.tsx`; docs `docs/components/surfaces/hero.md` | experimental | No tests; hardcoded screen height | App-shell/screen-size behavior needs platform notes | Too app-specific for stable root until contract is narrowed. |
| Form | `Input` | `components/form/index.ts`; source `components/form/Input.tsx`; docs `docs/components/form/input.md`; audit `CMP-08` | beta | No tests; label/focus behavior needs contract | Cross-platform expected, unverified | Public candidate after props export and FormField composition decision. |
| Form | `PasswordInput` | `components/form/index.ts`; source `components/form/PasswordInput.tsx`; docs `docs/components/form/password-input.md` | internal | Props `any`; incomplete toggle behavior; no tests | Cross-platform expected after fix, unverified | Keep internal until typed and interaction behavior is fixed. |
| Form | `Switch` | `components/form/index.ts`; source `components/form/Switch.tsx`; docs `docs/components/form/switch.md` | beta | No tests; accessibility and animation gaps | Cross-platform expected, unverified | Public candidate after accessibility state and smoke test. |
| Form | `Checkbox` | `components/form/index.ts`; source `components/form/Checkbox.tsx`; docs `docs/components/form/checkbox.md` | beta | No tests; accessibility role/state missing | Cross-platform expected, unverified | Public candidate after accessibility support. |
| Form | `RadioGroup` | `components/form/index.ts`; source `components/form/RadioGroup.tsx`; docs `docs/components/form/radio-group.md` | beta | No tests; option type not exported; disabled/a11y gaps | Cross-platform expected, unverified | Public candidate after public option type and accessibility contract. |
| Form | `Select` | `components/form/index.ts`; source `components/form/Select.tsx`; docs `docs/components/form/select.md` | experimental | No tests; modal/select accessibility incomplete | Modal behavior and keyboard support unverified | Keep experimental until select interaction contract is defined. |
| Form | `FormField` | `components/form/index.ts`; source `components/form/FormField.tsx`; docs `docs/components/form/form-field.md` | beta | No tests; clone-props behavior heuristic | Cross-platform expected, unverified | Public candidate after props export and child contract docs. |
| Form | `Textarea` | `components/form/index.ts`; source `components/form/Textarea.tsx`; docs `docs/components/form/textarea.md`; audit `CMP-04` | internal | Props `any`; known token bug; no tests | Cross-platform expected after fix, unverified | Blocked until token bug and typing are fixed. |
| Navigation | `NavProvider` | `components/navigation/index.ts`; source `components/navigation/NavContext.tsx`; docs `docs/components/navigation/nav-context.md` | beta | No tests; helper hooks expose implementation details | Cross-platform expected, unverified | Provider can be public, but helper hook exports need API decision. |
| Navigation | `Link` | `components/navigation/index.ts`; source `components/navigation/Link.tsx`; docs `docs/components/navigation/link.md` | beta | No tests; router adapter behavior partial | Uses `window` on web; native navigation requires explicit strategy | Public candidate after router/platform support matrix. |
| Navigation | `NavBar` | `components/navigation/index.ts`; source `components/navigation/NavBar.tsx`; docs `docs/components/navigation/nav-bar.md`; audit `CMP-06` | beta | No tests; `bottomMaxItems` not passed to `BottomBar` | Cross-platform layout behavior unverified | Public candidate after prop behavior fix and responsive tests. |
| Navigation | `TopBar` | `components/navigation/index.ts`; source `components/navigation/TopBar.tsx`; docs `docs/components/navigation/top-bar.md`; audit `CMP-05` | experimental | Known placeholder fallback bug; no tests | Cross-platform expected after fix, unverified | Keep experimental until placeholder bug and slot contract are fixed. |
| Navigation | `BottomBar` | `components/navigation/index.ts`; source `components/navigation/BottomBar.tsx`; docs `docs/components/navigation/bottom-bar.md` | experimental | No tests; hardcoded absolute positioning | Mobile/native layout behavior must be documented | Keep experimental until layout/accessibility contract is stable. |
| Navigation | `SideBar` | `components/navigation/index.ts`; source `components/navigation/SideBar.tsx` and `SideBar.web.tsx`; docs `docs/components/navigation/side-bar.md` | experimental | No tests; native returns `null` | Web implementation only; native null fallback | Must remain experimental with explicit web-only/native-null documentation. |

## Counts

| Maturity | Count |
| --- | ---: |
| stable | 0 |
| beta | 23 |
| experimental | 12 |
| internal | 6 |
| deprecated | 0 |
| total | 41 |
