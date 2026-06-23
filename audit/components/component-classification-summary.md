# PLRNUI-5 - Component Classification Summary

## Result

Classificazione iniziale completata per 41 export component-like reali trovati tra root/barrel `components/*` e sorgenti componenti. Di questi, 40 sono raggiungibili dalla root API attuale; `Stack` e un alias sorgente non esportato dal barrel corrente.

Non sono state classificate come componenti le API type-only, utility, token, storage e hook non-component. Restano coperte da `audit/api/export-matrix.md`.

## Count by maturity

| Maturity | Count |
| --- | ---: |
| stable | 0 |
| beta | 28 |
| experimental | 12 |
| internal | 1 |
| deprecated | 0 |
| total | 41 |

## Components blocked by known bugs after PLRNUI-21

| Component | Maturity | Evidence | Ticket candidate |
| --- | --- | --- | --- |
| `TopBar` | experimental | `audit/02-component-inventory.md` `CMP-05`; `components/navigation/TopBar.tsx` | PLRNUI5-NAV-001 |
| `NavBar` | beta | `audit/02-component-inventory.md` `CMP-06`; `components/navigation/NavBar.tsx` | PLRNUI5-NAV-001 |
| `Button` | beta | `audit/02-component-inventory.md` `CMP-07`; `components/Button.tsx` | PLRNUI5-BUG-002 |
| `Input` | beta | `audit/02-component-inventory.md` `CMP-08`; `components/form/Input.tsx` | PLRNUI5-TYPES-001 / PLRNUI5-FORM-001 |
| `Row` | beta | `audit/02-component-inventory.md`; `components/layout/Row.tsx` | PLRNUI5-LAYOUT-001 |

PLRNUI-21 remediated the known blocker set for `Card`, `ProgressBar`, `CodeInline`, `Textarea` and `PasswordInput`; they are now classified as `beta`, not `stable`.

PLRNUI-22 remediated the targeted navigation blocker set for `TopBar`, `BottomBar`, `NavBar`, `Link` and `SideBar`; they remain below `stable` until docs/platform/support and any required accessibility evidence are complete.

PLRNUI-25 adds `audit/components/component-platform-support-matrix-plrnui-25.md` as the current iOS/Android/Web support evidence for public candidates. This does not change maturity counts or promote any component to `stable`.

## Components blocked by absence of tests

All 41 analyzed component-like exports remain blocked from `stable` by incomplete stable-gate evidence.

Evidence: PLRNUI-20 introduced the Node smoke harness and PLRNUI-21 added coverage for the five remediated components, but ADR 0003 still requires complete docs/platform/support evidence and component-specific hardening before stable promotion.

Highest-priority beta candidates needing first smoke coverage:

`Button`, `Box`, `Column`, `Row`, `Divider`, `Text`, `P`, `B`, `Small`, `CodeInline`, `Heading`, `Quote`, `TextGroup`, `Spinner`, `Alert`, `Badge`, `Card`, `Input`, `PasswordInput`, `ProgressBar`, `Switch`, `Checkbox`, `RadioGroup`, `FormField`, `Textarea`, `NavProvider`, `Link`, `NavBar`.

## Web-only or native-fallback components

| Component | Maturity | Evidence | Limitation |
| --- | --- | --- | --- |
| `SideBar` | experimental | `src/components/SideBar/SideBar.tsx`, `src/components/SideBar/SideBar.web.tsx`, `audit/components/navigation-platform-contract-plrnui-22.md` | Minimal native vertical list exists; richer sidebar behavior remains experimental. |
| `Tooltip` | experimental | `components/overlay/Tooltip.tsx` | Native returns children only; tooltip content is web-only. |
| `Popover` | experimental | `components/overlay/Popover.tsx` | Native returns trigger only; popover content is web-only. |

Related platform-risk components without proven cross-platform behavior:

`ToastProvider`, `Modal`, `BottomSheet`, `Select`, `Code`, `Page`, `Hero`, `TopBar`, `BottomBar`, `Link`, `Box`.

## Recommended Jira tickets

| Ticket candidate | Priority | Scope | Source evidence |
| --- | --- | --- | --- |
| PLRNUI5-TEST-001 | In progress | Extend component smoke/render coverage beyond the PLRNUI-20/PLRNUI-21 harness. | ADR 0003 stable criteria; PLRNUI-21 coverage is not full stable-gate evidence. |
| PLRNUI5-BUG-001 | Closed by PLRNUI-21 | Fix `Card`, `ProgressBar`, `CodeInline`, `Textarea`, `PasswordInput`. | Remediation evidence in `audit/components/component-blocker-remediation-plrnui-21.md`. |
| PLRNUI5-NAV-001 | Closed by PLRNUI-22 for targeted blockers | Fix `TopBar`, `NavBar`, `Link`, `SideBar` behavior and platform contracts. | `audit/components/navigation-platform-contract-plrnui-22.md`; `tests/components/component-smoke.test.tsx`. |
| PLRNUI5-OVERLAY-001 | High | Define and test overlay/platform behavior for `Modal`, `BottomSheet`, `Tooltip`, `Popover`, `Select`. | `audit/02-component-inventory.md`; `audit/risk-assessment/0003-component-stability-misclassification-risk.md`. |
| PLRNUI5-TYPES-001 | High | Export named props types for approved public components. | `audit/api/public-types.md`. |
| PLRNUI5-DOCS-001 | Medium | Add support matrix to component docs and align examples with approved package import. | ADR 0007; `audit/api/deep-import-audit.md`. |
| PLRNUI5-API-001 | Medium | Fence internal/experimental components from stable root API or document maturity in root API. | `audit/api/export-matrix.md`; `audit/migration/breaking-change-register.md` `BC-004`, `BC-007`. |

## Operational notes

- `stable` count is intentionally zero, not because no component is useful, but because ADR 0003 requires tests or equivalent verification and support matrix before stable promotion.
- `deprecated` count is zero for components. Legacy AURA symbols are token exports, not component exports.
- `Stack` is treated as non-root/currently internal evidence because the source alias exists in `components/layout/Column.tsx`, but `components/layout/index.tsx` does not export it. It is included in the 41 analyzed source/root component-like symbols, but not in the 40 root-reachable components.
