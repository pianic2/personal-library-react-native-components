# Texo V1 — Orchestrator Decision Register

Status: ADOPTED by orchestrator 2026-10-09 on the basis of independent review `reviews/R1-architecture-review.md`
(ADR-R0..R11 there are normative; this file records the ruling and what remains human-only).
Nothing here renames the package/repo/imports; all choices keep the future cutover
`@personal-library/react-native-components -> Texo` (legacy package = generated re-export shim) intact.

## Adopted (deducible, no human input needed)
| # | Decision | Source |
|---|----------|--------|
| D1 | ADRs live in `audit/adr/`; numbers allocated centrally: 0009 subpath exports, 0010 peer/optional deps, 0011 semver, 0012 motion engine, 0013 shim policy, 0014 API conventions, 0015 overlay architecture, 0016 metadata single source. `docs/adr/` is not used. | R1 ADR-R0 |
| D2 | `TexoProvider` is the single composition root (Theme→Locale→Motion→Responsive→Capabilities→Icons→Nav→OverlayHost→ToastViewport); individual providers stay exported. | ADR-R1 |
| D3 | API conventions: `value/defaultValue/onValueChange`; `open/defaultOpen/onOpenChange`; `variant`=structure, `tone`=semantic colour, `size xs..lg`; `invalid` + string `error`; ref/style/styles/testID/a11y passthrough; compound via `Object.assign`. Old names kept as `@deprecated` aliases through 1.x. | ADR-R2 |
| D4 | Overlay architecture: single owner E6-01; nearest-host Portal; native-window surfaces mount their own host; one stack for z-order/focus/Back. | ADR-R3 |
| D5 | One owner per capability (ownership table in R1 ADR-R4) — duplicates merged/dropped. | ADR-R4 |
| D6 | Optional deps: injection only in core, no `require()` in `src`; convenience adapters in `./adapters/<lib>`. **Allowing `peerDependenciesMeta` optional peers is human-only (see H2).** Until approved, tickets that need it are `blocked-decision`; injection path proceeds. | ADR-R5 |
| D7 | 1.0 subpaths: `.`, `./theme`, `./tokens`, `./native`, `./native/expo`, `./adapters/*`, `./testing`, `./meta`, `./package.json`. NO `./experimental`, `./navigation`, `./components/*`, `./utils`, `./hooks`. Stability = metadata, not import path. ESM-only (confirm by spike). | ADR-R6 |
| D8 | Single metadata source: colocated `<Name>.meta.ts`; maturity gate, catalog, docs lint and AI manifests all read it. | ADR-R7 |
| D9 | ESM emit: explicit `.js` / `/index.js` relative specifiers + lint; no `*.web/native/ios/android.*` files in `src`; no per-subpath bundling; webpack-5 `fullySpecified` case in consumer matrix. | ADR-R8 |
| D10 | Shim: generated `dist-shim/`, depends on Texo with caret major range (not exact), lockstep versions, global singleton contexts + dev duplicate warning, `PACKAGE_NAME` deprecated. | ADR-R9 |
| D11 | Motion: RN `Animated` + `LayoutAnimation` + `PanResponder`; no Reanimated/gesture-handler peers in 1.0; all animation gated by reduced motion. | ADR-R11 |
| D12 | `ThemePreference` (adds `"system"`), `ThemeMode` unchanged; flat `theme.colors` kept (derived); `useBreakpoint` native fix shipped pre-1.0 with breaking-change register entry; presets as root named exports; fonts = fallback stacks, consumer loads fonts. | R1 §4 |
| D13 | MCP: no. CLI `info/doctor`, plugin marketplace manifest: post-1.0. Only `./meta` JSON ships in npm; skills/AGENTS/llms live in repo + docs site. Docs/AI cards in English. | R1 §4 |
| D14 | Scope: 1.0 = foundations + core components + forms + overlays + list/table + native core + AI tier-0/1. Items in R1 §3 "Defer" get label `post-1.0` (kept in backlog, not in V1 critical path). B/P/Small/TextGroup become `@deprecated` aliases, not promoted. | R1 M8 |
| D15 | Proposed stable set for 1.0 (ADR-R10) is adopted as the working target; final confirmation is human (H3). | ADR-R10 |

## Human-only (REAL BLOCKERS — do not decide autonomously)
| # | Decision | Blocks |
|---|----------|--------|
| H1 | Final Texo name / npm scope / org / repo owner; license holder; SECURITY contact; CODEOWNERS handles | E15 cutover tickets labelled `blocked-decision`; E16 OSS metadata |
| H2 | Amend native-dependency gate (PLRNUI-39) to allow `peerDependenciesMeta` optional peers for non-Expo libs (svg, flash-list, safe-area-context, datetimepicker) | `./adapters/*` tickets (E7 charts/FlashList, E4 Icon-svg, E5 datetimepicker) |
| H3 | Confirm 1.0 scope cut and stable set | E17 stable-bar/promotion tickets (preparatory work proceeds) |
| H4 | Support matrix for 1.0 (Expo 57 only vs 56–57) and deprecation/sunset windows | E17, E15 deprecation tickets |
| H5 | Eval budget + reference agent/model for AI-uplift proof | E13 eval tickets |
| H6 | Version line: Texo starts at `1.0.0-rc.0`; legacy name jumps to shim `1.0.0` | E15, E17 |
| H7 | Public/private fate of `audit/` and Jira-internal CONTRIBUTING | E16-10 |
| H8 | Codemod channel naming (`npx <name>-codemod` vs `texo migrate`) | E15 codemod publish ticket |
| H9 | npm publish / tag / GitHub Release / PO approval (`po-approved`) for any ticket — never granted by the orchestrator | all execution |

## Process rules
- Jira "READY" = ticket body complete (problem, value, scope, AC, deps, out-of-scope, validation, evidence, risks, DoD) + labels `texo-v1`, `ready`, `awaiting-po-approval`, status stays `Da fare`. The orchestrator never applies `po-approved` nor moves to `Approvato` (PO gate, Confluence page 13).
- Tickets with an unresolved human decision: label `blocked-decision`, NOT `ready`; body states the decision and the unblock condition.
