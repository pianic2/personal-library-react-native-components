# PLRNUI-5 - Component Classification Summary

## Result

Classificazione iniziale completata per 41 export component-like reali trovati tra root/barrel `components/*` e sorgenti componenti. Di questi, 40 sono raggiungibili dalla root API attuale; `Stack` e un alias sorgente non esportato dal barrel corrente.

Non sono state classificate come componenti le API type-only, utility, token, storage e hook non-component. Restano coperte da `audit/api/export-matrix.md`.

## Count by maturity

| Maturity | Count |
| --- | ---: |
| stable | 0 |
| beta | 23 |
| experimental | 12 |
| internal | 6 |
| deprecated | 0 |
| total | 41 |

## Components blocked by known bugs

| Component | Maturity | Evidence | Ticket candidate |
| --- | --- | --- | --- |
| `Card` | internal | `audit/02-component-inventory.md` `CMP-01`; `components/surfaces/Card.tsx` | PLRNUI5-BUG-001 |
| `ProgressBar` | internal | `audit/02-component-inventory.md` `CMP-02`; `components/feedback/ProgressBar.tsx` | PLRNUI5-BUG-001 |
| `CodeInline` | internal | `audit/02-component-inventory.md` `CMP-03`; `components/typography/CodeInline.tsx` | PLRNUI5-BUG-001 |
| `Textarea` | internal | `audit/02-component-inventory.md` `CMP-04`; `components/form/Textarea.tsx` | PLRNUI5-BUG-001 |
| `TopBar` | experimental | `audit/02-component-inventory.md` `CMP-05`; `components/navigation/TopBar.tsx` | PLRNUI5-NAV-001 |
| `NavBar` | beta | `audit/02-component-inventory.md` `CMP-06`; `components/navigation/NavBar.tsx` | PLRNUI5-NAV-001 |
| `Button` | beta | `audit/02-component-inventory.md` `CMP-07`; `components/Button.tsx` | PLRNUI5-BUG-002 |
| `Input` | beta | `audit/02-component-inventory.md` `CMP-08`; `components/form/Input.tsx` | PLRNUI5-TYPES-001 / PLRNUI5-FORM-001 |
| `PasswordInput` | internal | `audit/02-component-inventory.md`; `components/form/PasswordInput.tsx`; `audit/api/public-types.md` | PLRNUI5-BUG-001 |
| `Row` | beta | `audit/02-component-inventory.md`; `components/layout/Row.tsx` | PLRNUI5-LAYOUT-001 |

## Components blocked by absence of tests

All 41 analyzed component-like exports are blocked from `stable` by test absence.

Evidence: `rg --files -g '*test*' -g '*spec*' -g '__tests__/**'` returned no files.

Highest-priority beta candidates needing first smoke coverage:

`Button`, `Box`, `Column`, `Row`, `Divider`, `Text`, `P`, `B`, `Small`, `Heading`, `Quote`, `TextGroup`, `Spinner`, `Alert`, `Badge`, `Input`, `Switch`, `Checkbox`, `RadioGroup`, `FormField`, `NavProvider`, `Link`, `NavBar`.

## Web-only or native-null components

| Component | Maturity | Evidence | Limitation |
| --- | --- | --- | --- |
| `SideBar` | experimental | `components/navigation/SideBar.tsx`, `components/navigation/SideBar.web.tsx` | Web sidebar exists; native returns `null`. |
| `Tooltip` | experimental | `components/overlay/Tooltip.tsx` | Native returns children only; tooltip content is web-only. |
| `Popover` | experimental | `components/overlay/Popover.tsx` | Native returns trigger only; popover content is web-only. |

Related platform-risk components without proven cross-platform behavior:

`ToastProvider`, `Modal`, `BottomSheet`, `Select`, `Code`, `Page`, `Hero`, `TopBar`, `BottomBar`, `Link`, `Box`.

## Recommended Jira tickets

| Ticket candidate | Priority | Scope | Source evidence |
| --- | --- | --- | --- |
| PLRNUI5-TEST-001 | High | Add component smoke/render test harness and first coverage for beta candidates. | ADR 0003 stable criteria; no test/spec files found. |
| PLRNUI5-BUG-001 | High | Fix `Card`, `ProgressBar`, `CodeInline`, `Textarea`, `PasswordInput`. | `audit/02-component-inventory.md` findings `CMP-01` to `CMP-04`; `audit/api/public-types.md`. |
| PLRNUI5-NAV-001 | High | Fix `TopBar`, `NavBar`, `Link`, `SideBar` behavior and platform contracts. | `audit/02-component-inventory.md` findings `CMP-05`, `CMP-06`; `components/navigation/*`. |
| PLRNUI5-OVERLAY-001 | High | Define and test overlay/platform behavior for `Modal`, `BottomSheet`, `Tooltip`, `Popover`, `Select`. | `audit/02-component-inventory.md`; `audit/risk-assessment/0003-component-stability-misclassification-risk.md`. |
| PLRNUI5-TYPES-001 | High | Export named props types for approved public components. | `audit/api/public-types.md`. |
| PLRNUI5-DOCS-001 | Medium | Add support matrix to component docs and align examples with approved package import. | ADR 0007; `audit/api/deep-import-audit.md`. |
| PLRNUI5-API-001 | Medium | Fence internal/experimental components from stable root API or document maturity in root API. | `audit/api/export-matrix.md`; `audit/migration/breaking-change-register.md` `BC-004`, `BC-007`. |

## Operational notes

- `stable` count is intentionally zero, not because no component is useful, but because ADR 0003 requires tests or equivalent verification and support matrix before stable promotion.
- `deprecated` count is zero for components. Legacy AURA symbols are token exports, not component exports.
- `Stack` is treated as non-root/currently internal evidence because the source alias exists in `components/layout/Column.tsx`, but `components/layout/index.tsx` does not export it. It is included in the 41 analyzed source/root component-like symbols, but not in the 40 root-reachable components.
