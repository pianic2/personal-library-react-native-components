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

## PO decisions — 2026-10-09 (authoritative; override defaults above)

| # | Decision (PO) | Effect |
|---|---|---|
| P1 | **Do not raise the spend limit; build a harness instead.** Budget for execution and evals is 0 (local model such as a ~27B Qwen, or free-tier providers). | New Epic E18 "Agent execution harness (zero-cost)" PLRNUI-443, 13 tickets. Cloud sessions cannot reach a local model: the harness runs on the PO machine or in CI with free providers. Subagent fan-out by the orchestrator is minimised. |
| P2 | **Tickets are approved only after all decisions are taken.** | No `po-approved` anywhere until the open items below are answered. |
| P3 | **Git model A:** one branch per ticket `texo/PLRNUI-<n>-<slug>`, PR to integration branch `texo/v1`; the agent merges into `texo/v1` only with green CI + independent review; merge `texo/v1` -> `main` is the PO's (interpretation, to confirm). Commit messages: `add(PLRNUI-<n>): ...`, `fix(PLRNUI-<n>): ...`, `chore(PLRNUI-<n>): ...`. | Authorises branch/PR creation and merge into `texo/v1` for approved tickets only. E18-04 enforces the convention. |
| H1 | npm package **`@theopificium/texo`** (bare `texo` is taken on npm; `@theopificium/texo` returned 404 = free on 2026-10-09), repo **`theopificium/texo`**, security contact **info@theopificium.it**, PO is owner of the `@personal-library` npm scope. License: open source "well done", **not yet chosen** (currently MIT). | Unblocks E15-01, E15-10, E15-13, E15-14, E15-16, E16-03. Still blocked: E16-01 (CODEOWNERS handle), E16-09 (license). |
| H2 | **Yes** to optional adapters (`peerDependenciesMeta`, `./adapters/*`). | Unblocks E4-24, E5-18, E7-04, E7-25, E7-26, E8-31. |
| H3 | **Everything that was planned is in scope; nothing is "post-1.0".** Everything must work, then publish; whatever is not ready stays in draft (unpublished) while work continues. | `postV1` list emptied: all 33 deferred tickets are V1 (ordered by dependencies). Stable set (ADR-R10) becomes a *floor*, not a ceiling: components that pass the stable bar at release time are published stable; others stay draft. Unblocks E1-38..41, E17-14. |
| H4 | Default accepted: Expo 57 / RN 0.86 only for 1.0; shim sunset 12 months; deprecated aliases through 1.x. | Unblocks E15-02, E17-07. |
| H5 | Budget **0**; local model (e.g. Qwen 27B) or free-tier token providers. | E13-31 now depends on E18-12 (zero-cost eval runner). |
| H6 | Launch as **1.0.0** (not an rc line). | E15-14/E15-16 and E17 release plan must target 1.0.0 directly; keep dist-tag `next`/`rc` rehearsal on a local registry (E17-12) instead of public rc publishes. |
| H7 | Default accepted. | Unblocks E16-10. |
| H8 | Default accepted (standalone codemod in the same scope + `migrate` alias evaluated). | Unblocks E15-10. |
| Env | PO reports the environment configuration (section 4 of the owner guide) as done. | Not verifiable from this session: repo `theopificium/texo` is not visible to the GitHub integration. |

### Still open (needed before the PO approves tickets)
1. License choice (recommendation: MIT + SPDX headers + THIRD_PARTY_NOTICES + DCO sign-off; Apache-2.0 + NOTICE if a patent grant is wanted).
2. CODEOWNERS GitHub handle(s).
3. Repo move: transfer `pianic2/personal-library-react-native-components` to `theopificium` and rename to `texo` now, at cutover (E15-14, recommended), or create a fresh `theopificium/texo`? The session's GitHub scope must include the target repo.
4. Confirm: `texo/v1` -> `main` merges stay with the PO.
5. Confirm: stable set is a floor and unfinished components stay draft (H3 reading above).
6. Where the harness runs: PO machine with a local model (GPU/VRAM or Apple unified memory?) or only CI with free-tier providers.
7. H6 consequence: confirm no public `rc` publishes (1.0.0 straight, rehearsed on a local registry).

## PO decisions — round 2 (2026-10-09, answers to the 7 open items)

| # | Decision (PO) | Effect |
|---|---|---|
| 1 | License **MIT** | E16-09 unblocked. Implementation per recommendation: SPDX headers, THIRD_PARTY_NOTICES, DCO sign-off |
| 2 | CODEOWNERS handle **pianic2** | E16-01 unblocked (use `@pianic2`) |
| 3 | Repository transfer/rename (pianic2/personal-library-react-native-components -> theopificium/texo) **at cutover** | Added to E15-14 scope; PO performs the GitHub transfer |
| 4 | `texo/v1` -> `main` stays with the PO | Confirmed |
| 5 | Stable is a floor; **beta** components are also published but must be shown in the example app, have tests, be deeply integrated in the system and have **no known bugs or problems**; anything else stays draft (unpublished) | E17-14 rewritten: tiers draft / beta / stable with explicit beta bar and `check-stable-bar.mjs --tier` |
| 6 | **No harness** (too heavy): only targeted prompts and targeted skills, using Jira | E18 reduced to an execution kit (skill texo-execute, skill texo-review, prompt templates, JQL set, commit/ownership guards, CI on texo/v1, runbook); same 13 ticket ids, no ticket deleted. Stale Blocks links from the old E18 design remain in Jira (no tool to delete links); they only over-constrain order slightly and create no cycle |
| 7 | **1.0.0** straight and **local registry rehearsal** | No public rc publishes; E17-12 (Verdaccio) is the rehearsal |

Open (low stakes, defaults apply unless changed): 2.4 permission mode, 2.5 allowed Jira transitions for sessions, 2.6 silence = default after N days, 2.7 scheduled runs.
Backlog after round 2: 361 tickets, 361 ready, 0 blocked, 0 post-1.0, 19 waves, validator clean. Ticket approval (`po-approved`) is the PO's step and can now happen.
