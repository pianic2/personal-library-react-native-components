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

Current result: no exported component-like symbol satisfies the stable gate. PLRNUI-20, PLRNUI-21, PLRNUI-22 and PLRNUI-23 add Node smoke/render coverage for selected components. PLRNUI-25 adds the first dedicated component platform support matrix and docs import audit, but consumer proof and component-specific hardening remain incomplete for stable promotion.

## Promotion groups

### Beta to stable candidates

These components are usable candidates after test/docs/type hardening:

`Button`, `Box`, `Column`, `Row`, `Divider`, `P`, `B`, `Small`, `CodeInline`, `Quote`, `Text`, `TextGroup`, `Heading`, `Spinner`, `Alert`, `Badge`, `Card`, `Input`, `PasswordInput`, `ProgressBar`, `Switch`, `Checkbox`, `RadioGroup`, `FormField`, `Textarea`, `NavProvider`, `Link`, `NavBar`.

`Stack` is counted as an analyzed source export but not as a root-reachable component because `components/layout/index.tsx` does not export it. If the barrel is changed later, it needs an explicit decision: public alias, internal alias, or deprecated alias.

Required work for every beta candidate:

| Requirement | Evidence for gap | Minimum completion |
| --- | --- | --- |
| Smoke/render test | PLRNUI-20 added the Node harness; PLRNUI-21 adds coverage for `Card`, `ProgressBar`, `CodeInline`, `Textarea`, `PasswordInput`; PLRNUI-22 adds coverage for `TopBar`, `BottomBar`, `NavBar`, `Link`, `SideBar`; PLRNUI-23 adds coverage for `Modal`, `BottomSheet`, `Tooltip`, `Popover`, `Select`; remaining components and richer behavior coverage are incomplete. | Add component render smoke coverage for remaining candidates and interaction/platform coverage where behavior requires it. |
| Named props export | `audit/api/public-types.md` lists many `Not exported` props | Export named props for approved public components. |
| Platform support line | ADR 0003 and ADR 0007 stable criteria; PLRNUI-25 matrix | `audit/components/component-platform-support-matrix-plrnui-25.md` now records iOS, Android and Web posture for current public candidates; future component docs must keep this in sync. |
| Example aligned to public API | `audit/docs/docs-import-audit-plrnui-25.md`; historical `audit/api/deep-import-audit.md` findings | README now shows the canonical root package import; no current `docs/`, `examples`, `demo` or `preview-web` files exist in this checkout to migrate. |
| Known bug cleanup | `audit/02-component-inventory.md` findings `CMP-06` to `CMP-08` and component notes | Fix or document behavior before stable. |

### Experimental to beta candidates

These components need platform/behavior decisions before even beta/stable promotion:

`Code`, `Page`, `ToastProvider`, `Modal`, `BottomSheet`, `Tooltip`, `Popover`, `Hero`, `Select`, `TopBar`, `BottomBar`, `SideBar`.

Required work:

| Component group | Evidence | Promotion requirement |
| --- | --- | --- |
| Web-only/native-null overlays/navigation | `Tooltip`, `Popover`, `SideBar` source files; PLRNUI-23 overlay contract | Tooltip and Popover native fallback behavior is documented, but stable promotion still requires native fallback decisions and keyboard/focus/accessibility coverage. |
| Overlay/modal components | `Modal`, `BottomSheet`, `Select` source and inventory notes; PLRNUI-23 overlay contract | PLRNUI-23 defines the current contract, but stable promotion still requires keyboard, focus, gesture, dismiss and accessibility validation. |
| App-shell-like components | `Page`, `Hero`, `BottomBar`, `TopBar` source and inventory notes | Decide whether they belong in root API or experimental subpath. |
| Clipboard/timer components | `Code`, `ToastProvider` source and inventory notes | Add lifecycle cleanup, dependency/platform documentation and tests. |

PLRNUI-22 note: `SideBar` no longer has a native `null` implementation; it remains experimental because the minimal native list is only a safe fallback and not a full drawer, gesture, overlay, or accessibility contract.

### Remediated internal to beta candidates

These exports were fixed by PLRNUI-21 and may be treated as `beta`, not `stable`:

| Component | Evidence | Required before beta |
| --- | --- | --- |
| `Card` | `src/components/Card/Card.tsx`; `tests/components/component-smoke.test.tsx` | Completed in PLRNUI-21: hook usage bug removed and render smoke added. |
| `ProgressBar` | `src/components/ProgressBar/ProgressBar.tsx`; `tests/components/component-smoke.test.tsx` | Completed in PLRNUI-21: calculated width applied, progress clamped and state assertion added. |
| `CodeInline` | `src/components/CodeInline/CodeInline.tsx`; `tests/components/component-smoke.test.tsx` | Completed in PLRNUI-21: resolved size drives `lineHeight` and typography smoke assertion added. |
| `PasswordInput` | `src/components/PasswordInput/PasswordInput.tsx`; `tests/components/component-smoke.test.tsx` | Completed in PLRNUI-21: explicit props and accessible controlled/uncontrolled visibility toggle added. |
| `Textarea` | `src/components/Textarea/Textarea.tsx`; `tests/components/component-smoke.test.tsx` | Completed in PLRNUI-21: explicit props, semantic spacing token and multiline assertion added. |

## Minimum Jira ticket set

| Ticket candidate | Scope | Blocks |
| --- | --- | --- |
| PLRNUI5-TEST-001 | Add component smoke test harness and first coverage for beta candidates | Stable promotion for all components |
| PLRNUI5-TYPES-001 | Export named props for approved public components | Stable promotion for public root API |
| PLRNUI5-BUG-001 | Closed by PLRNUI-21 for `Card`, `ProgressBar`, `CodeInline`, `Textarea`, `PasswordInput` blockers | These components can be `beta`, not `stable`; future work must satisfy the stable gate. |
| PLRNUI5-NAV-001 | Closed by PLRNUI-22 for targeted `TopBar`, `NavBar`, `Link`, `SideBar` platform/router blockers | These components are not `stable`; future work must satisfy docs/platform/support and accessibility gates. |
| PLRNUI5-OVERLAY-001 | Documented by PLRNUI-23 for `Modal`, `BottomSheet`, `Tooltip`, `Popover`, `Select` with render smoke coverage | These components remain experimental; future work must satisfy runtime platform, focus, keyboard and accessibility gates. |
| PLRNUI5-DOCS-001 | Add component support matrix and migrate examples away from legacy/deep imports | Docs gate for stable promotion |
| PLRNUI5-API-001 | Fence internal/experimental exports or document root API maturity | Breaking change register `BC-004`, `BC-007` |

PLRNUI-25 note: PLRNUI5-DOCS-001 is partially satisfied for the current checkout by `audit/components/component-platform-support-matrix-plrnui-25.md`, `audit/docs/docs-import-audit-plrnui-25.md`, and the canonical README root import example. It is not fully closed for stable promotion because package consumer smoke, per-component docs pages and platform runtime proof are still open.
