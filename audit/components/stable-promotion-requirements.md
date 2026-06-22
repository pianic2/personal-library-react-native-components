# PLRNUI-5 - Stable Promotion Requirements

## Stable gate

A component can move to `stable` only after satisfying ADR 0003 and ADR 0007:

- props are typed and exported when public;
- behavior is documented;
- platform support is declared;
- minimal examples exist;
- smoke/render or equivalent tests exist;
- no known blocking runtime bug remains;
- semver and migration impact are tracked.

Current result: no exported component-like symbol satisfies the stable gate because the repository has no test/spec files and multiple components have unresolved docs/type/platform gaps.

## Promotion groups

### Beta to stable candidates

These components are usable candidates after test/docs/type hardening:

`Button`, `Box`, `Column`, `Row`, `Divider`, `P`, `B`, `Small`, `Quote`, `Text`, `TextGroup`, `Heading`, `Spinner`, `Alert`, `Badge`, `Input`, `Switch`, `Checkbox`, `RadioGroup`, `FormField`, `NavProvider`, `Link`, `NavBar`.

`Stack` is counted as an analyzed source export but not as a root-reachable component because `components/layout/index.tsx` does not export it. If the barrel is changed later, it needs an explicit decision: public alias, internal alias, or deprecated alias.

Required work for every beta candidate:

| Requirement | Evidence for gap | Minimum completion |
| --- | --- | --- |
| Smoke/render test | `rg --files -g '*test*' -g '*spec*' -g '__tests__/**'` returns no files | Add component render smoke coverage for iOS/Android/Web-equivalent environment or documented equivalent. |
| Named props export | `audit/api/public-types.md` lists many `Not exported` props | Export named props for approved public components. |
| Platform support line | ADR 0003 and ADR 0007 stable criteria | Add support matrix to component docs. |
| Example aligned to public API | `audit/api/deep-import-audit.md` finds demo relative imports and docs `"AURA"` snippets | Update examples after package identity/API decision. |
| Known bug cleanup | `audit/02-component-inventory.md` findings `CMP-06` to `CMP-08` and component notes | Fix or document behavior before stable. |

### Experimental to beta candidates

These components need platform/behavior decisions before even beta/stable promotion:

`Code`, `Page`, `ToastProvider`, `Modal`, `BottomSheet`, `Tooltip`, `Popover`, `Hero`, `Select`, `TopBar`, `BottomBar`, `SideBar`.

Required work:

| Component group | Evidence | Promotion requirement |
| --- | --- | --- |
| Web-only/native-null overlays/navigation | `Tooltip`, `Popover`, `SideBar` source files | Document web-only/native-null behavior or implement native fallback. |
| Overlay/modal components | `Modal`, `BottomSheet`, `Select` source and inventory notes | Define keyboard, focus, gesture, dismiss and accessibility behavior. |
| App-shell-like components | `Page`, `Hero`, `BottomBar`, `TopBar` source and inventory notes | Decide whether they belong in root API or experimental subpath. |
| Clipboard/timer components | `Code`, `ToastProvider` source and inventory notes | Add lifecycle cleanup, dependency/platform documentation and tests. |

### Internal to beta candidates

These exports must be fixed before public promotion:

| Component | Evidence | Required before beta |
| --- | --- | --- |
| `Card` | `audit/02-component-inventory.md` `CMP-01`; `components/surfaces/Card.tsx` | Remove hook usage bug, add props export and render test. |
| `ProgressBar` | `audit/02-component-inventory.md` `CMP-02`; `components/feedback/ProgressBar.tsx` | Apply calculated width, add state test and docs note for accepted progress range. |
| `CodeInline` | `audit/02-component-inventory.md` `CMP-03`; `components/typography/CodeInline.tsx` | Fix size fallback and lineHeight calculation; add typography smoke test. |
| `PasswordInput` | `audit/02-component-inventory.md`; `audit/api/public-types.md` | Replace `any` props, implement explicit visibility toggle and accessibility label/state. |
| `Textarea` | `audit/02-component-inventory.md` `CMP-04`; `audit/api/public-types.md` | Replace `any` props and fix spacing token usage. |

## Minimum Jira ticket set

| Ticket candidate | Scope | Blocks |
| --- | --- | --- |
| PLRNUI5-TEST-001 | Add component smoke test harness and first coverage for beta candidates | Stable promotion for all components |
| PLRNUI5-TYPES-001 | Export named props for approved public components | Stable promotion for public root API |
| PLRNUI5-BUG-001 | Fix `Card`, `ProgressBar`, `CodeInline`, `Textarea`, `PasswordInput` blockers | Internal components leaving internal status |
| PLRNUI5-NAV-001 | Fix `TopBar`, `NavBar`, `Link`, `SideBar` platform/router behavior | Navigation beta/stable readiness |
| PLRNUI5-OVERLAY-001 | Define and test `Modal`, `BottomSheet`, `Tooltip`, `Popover`, `Select` platform behavior | Overlay/form experimental promotion |
| PLRNUI5-DOCS-001 | Add component support matrix and migrate examples away from legacy/deep imports | Docs gate for stable promotion |
| PLRNUI5-API-001 | Fence internal/experimental exports or document root API maturity | Breaking change register `BC-004`, `BC-007` |
