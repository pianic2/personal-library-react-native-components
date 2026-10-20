# Texo V1 — Orchestrator State / Handoff (checkpoint, 2026-10-09)

A new orchestrator can resume from here without redoing the audit.

## Where things are
| Artifact | Location |
|---|---|
| Brief + ticket schema | `audit/texo-v1/00-brief.md` |
| Binding decisions (D1–D15) and human blockers (H1–H9) | `audit/texo-v1/DECISIONS.md` |
| Stream audits (E1…E17) | `audit/texo-v1/audit/*.md` |
| Raw per-stream ticket drafts (pre-review, historical) | `audit/texo-v1/tickets/*.json` |
| Independent reviews | `audit/texo-v1/reviews/R1-architecture-review.md`, `R2-backlog-review.md`, `R2-dedup-map.json`, `reconcile-rules.json` |
| **Final consolidated backlog (source of truth for ticket bodies)** | `audit/texo-v1/backlog/E*.json`, `_index.json`, `epics.json`, `RECONCILIATION.md` |
| Reproducible reconciliation | `audit/texo-v1/scripts/reconcile.py` (re-run to regenerate backlog; do not hand-edit backlog/) |
| Local id -> Jira key map | `audit/texo-v1/jira-map.json` (348 tickets + 17 epics) |
| Confluence decision page | SPLRNC page 67239938 "Texo 1.0.0 — Master Plan & Decision Register" |

## Jira (project PLRNUI, cloud 31c85df6-5dd7-4c5f-b021-2d2951ab1041)
- Epics PLRNUI-78…94 = E1…E17. 348 Tasks created as children (E8-28 = PLRNUI-442).
- Status policy: all in `Da fare`; labels `texo-v1`, `ready` | `blocked-decision`, `awaiting-po-approval`, `wave-N`, `size-S|M`, `epic-eN`, `post-1.0`.
  READY = complete body + `ready` label. `po-approved` / `Approvato` is the PO gate: NEVER set by the orchestrator.
- Dependencies = Jira links type Blocks (createIssueLink inwardIssue = blocker, outwardIssue = blocked; on the blocked issue Jira shows `inwardIssue` = its blocker). All 1,248 links created and each pair confirmed by a successful createIssueLink call in this session (the 235 pairs first logged in unreliable progress files were re-run; calls are idempotent, no duplicates; spot-checked PLRNUI-166, 156, 211, 310). To re-derive: `jira-map.json` + backlog `dependencies`.
- PLRNUI-77 (GitHub Pages showcase, already Approvato) is a dependency of E11 tickets; do not duplicate it.

## PO decisions 2026-10-09
See DECISIONS.md section "PO decisions". Backlog regenerated: 361 tickets, 0 post-1.0, 2 blocked (E16-01 CODEOWNERS, E16-09 license), E18 harness epic PLRNUI-443 (13 tickets). Jira labels synced for 52 tickets; E18 tickets PLRNUI-444…456 created and all 52 new dependency links created. Ticket approval waits for the open items in DECISIONS.md.

## PO decisions round 2 (2026-10-09)
All 7 open items answered (see DECISIONS.md). 361 tickets, 361 ready, 0 blocked. E18 is now an execution kit (skills + prompts, no harness). Jira sync for 17 tickets + epic PLRNUI-443 + 11 links delegated to one agent. Next: PO applies `po-approved` (JQL in the PO guide), then execute Wave 0 with the texo-execute skill once E18-01/02 exist (bootstrap: execute E18-01..04 first, by hand).

## Numbers
348 tickets: S 160 / M 188 / L 0. 325 `ready`, 23 `blocked-decision`, 33 `post-1.0`. 17 waves. Validator: 0 schema violations, 0 unresolved deps, 0 cycles, 0 unordered file collisions.
Baseline: 36 components = 18 demo / 18 prototype / 0 stable.

## Known cosmetic defects (fix in Jira only if desired; backlog JSON is correct)
- Jira markdown->ADF mangles `__DEV__` (-> bold DEV), `*` globs, some backslashes in regexes, and escapes `- [ ]` checkboxes (seen in PLRNUI-138, 173, 282, 382, E2-07, E2-20, E4-01..04, E4-23, E14-03, E14-12, E14-13, E1-01, E1-37, E1-42). Authoritative text: repo backlog JSON. A re-send as ADF would fix them.
- E4-16 title still says "List and ListItemText" and body has typo `BulletBulletList.meta.ts` (reconcile rename artifact) -> fix in `reviews/reconcile-rules.json`, re-run script, update PLRNUI-332.
- Epic E16 description says 10 tickets; Jira has 10 children after E8-28 was added (PLRNUI-93).
- 81 short acceptance criteria are flagged informationally in `backlog/RECONCILIATION.md` (heuristic); tighten in a later pass.
- `peer-dependency-policy.md` is stale (RN 0.85/Expo 56 vs package.json RN 0.86); covered by E14/E16 tickets.

## Human-only blockers (surface to the owner)
H1 name/scope/org/repo/license holder/CODEOWNERS · H2 allow optional peerDependenciesMeta for non-Expo libs · H3 confirm 1.0 scope + stable set · H4 support matrix + deprecation windows · H5 AI eval budget/model · H6 version line · H7 audit/ public or private · H8 codemod naming · H9 po-approved / any publish, tag, Release.

## Recommended next work
1. (done) 1,248 dependency links imported and spot-checked.
2. Ask owner for H1–H8; PO approval (`po-approved`) of Wave 0–2 tickets (E1-15, E14-03, E2-01, E2-06, E14-13, E6-01, E4-03, E8-01, E14-12, …) so execution can start.
3. Optional hardening pass: re-send mangled descriptions as ADF; tighten flagged acceptance criteria; fix E4-16.
4. When execution begins, first tickets on the critical path: E1-15 -> E14-03 (ESM) -> E2-01 -> E2-06 -> API-conventions ADR.

## Wave progress
One row per closed wave, added by the closing ticket (docs/policies/checkpoint.md). Empty until the first wave closes.
| Wave | Merged | Total | Closed by |
|---|---|---|---|

## Execution log (ticket sessions)
| Ticket | PR | Result |
|---|---|---|
| PLRNUI-457 (CI fix: npm audit, shell-quote 1.12.0 + targeted braces exemption GHSA-vfj7-8cjw-p6xm until 2027-01-09, PO-approved) | #13 | merged into texo/v1 (ae5c7d5), CI green, review PASS (3 rounds) |
| PLRNUI-444 (E18-01: ADR 0020 ticket execution protocol) | #12 | merged into texo/v1 after green CI and review PASS (row committed pre-merge, see ADR 0020 Branching) |
| PLRNUI-445 (E18-02: skill texo-execute + 6 class templates) | #14 | merged into texo/v1 after green CI and review PASS (row committed pre-merge, see ADR 0020 Branching) |
| PLRNUI-447 (E18-04: commit-msg check, pre-push no-main guard, branching policy) | #16 | merged into texo/v1 after green CI and review PASS (row committed pre-merge, see ADR 0020 Branching) |
| PLRNUI-446 (E18-03: JQL set docs/policies/jql.md, link from texo-execute skill) | #15 | merged into texo/v1 after green CI and review PASS (row committed pre-merge, see ADR 0020 Branching) |
| PLRNUI-449 (E18-06: file-ownership guard scripts/check-ownership.mjs) | #17 | merged into texo/v1 after green CI and review PASS (row committed pre-merge, see ADR 0020 Branching) |
| PLRNUI-453 (E18-10: checkpoint and resume protocol docs/policies/checkpoint.md) | #19 | merged into texo/v1 after green CI and review PASS (row committed pre-merge, see ADR 0020 Branching) |
| PLRNUI-448 (E18-05: scripts/ticket-prompt.mjs minimal execution prompt) | #20 | merged into texo/v1 after green CI and review PASS (row committed pre-merge, see ADR 0020 Branching) |
| PLRNUI-451 (E18-08: skill texo-review) | #21 | merged into texo/v1 after green CI and review PASS (row committed pre-merge, see ADR 0020 Branching) |
| PLRNUI-456 (E18-13: execution runbook docs/policies/execution-runbook.md) | #22 | merged into texo/v1 after green CI and review PASS (row committed pre-merge, see ADR 0020 Branching) |
| PLRNUI-454 (E18-11: token-economy measurements docs/policies/token-economy.md) | #24 | merged into texo/v1 after green CI and review PASS (row committed pre-merge, see ADR 0020 Branching) |
| PLRNUI-450 (E18-07: evidence template docs/policies/evidence-template.md, link from texo-execute skill) | #18 | merged into texo/v1 after green CI and review PASS (row committed pre-merge, see ADR 0020 Branching) |
| PLRNUI-452 (E18-09: texo-v1-pr workflow, branch protection docs) | #23 | merged into texo/v1 after green CI and review PASS (row committed pre-merge, see ADR 0020 Branching) |
| PLRNUI-95 (E9-01: a11y test helpers: hint, hidden, live region, hitSlop, interactive nodes) | #26 | merged into texo/v1 after green CI and review PASS (row committed pre-merge, see ADR 0020 Branching) |
| PLRNUI-108 (E12-04: type contract tests: props contracts, polymorphism, negative cases) | #27 | merged into texo/v1 after green CI and review PASS (row committed pre-merge, see ADR 0020 Branching) |
| PLRNUI-118 (E16-03: SECURITY.md, CODE_OF_CONDUCT.md, SUPPORT.md) | #29 | merged into texo/v1 after green CI and review PASS (row committed pre-merge, see ADR 0020 Branching) |
| PLRNUI-110 (E16-01: CODEOWNERS owner @pianic2 and path owners) | #28 | merged into texo/v1 after green CI and review PASS (row committed pre-merge, see ADR 0020 Branching) |
| PLRNUI-127 (E3-02: ADR 0012 motion engine and optional peers, motion-dependency-strategy) | #31 | merged into texo/v1 after green CI and review PASS (row committed pre-merge, see ADR 0020 Branching). **Owner sign-off in ADR 0012 is PENDING: ADR status is Proposed, dependents of PLRNUI-127 must not start until the owner records it.** |
| PLRNUI-125 (E16-04: CONTRIBUTING rewrite for external contributors, commands test) | #30 | merged into texo/v1 after green CI and review PASS (row committed pre-merge, see ADR 0020 Branching) |
| PLRNUI-179 (E1-03: token-usage lint scripts/check-token-usage.mjs, allowlist, tests) | #34 | merged into texo/v1 after green CI and review PASS (row committed pre-merge, see ADR 0020 Branching) |
| PLRNUI-131 (E16-05: PR template and issue forms for the external flow) | #33 | merged into texo/v1 after green CI and review PASS (row committed pre-merge, see ADR 0020 Branching) |
| PLRNUI-129 (E15-02: ADR 0013 legacy shim policy, Pending H4 section) | #32 | merged into texo/v1 after green CI and review PASS (row committed pre-merge, see ADR 0020 Branching) |
| PLRNUI-185 (E1-04: tsconfig.tests.json, Badge smoke fix, examples render test) | #35 | merged into texo/v1 after green CI and review PASS (row committed pre-merge, see ADR 0020 Branching) |
| PLRNUI-299 (E1-15: unify SideBar into one Platform.OS file, remove SideBar.web.tsx) | #37 | merged into texo/v1 after green CI and review PASS (row committed pre-merge, see ADR 0020 Branching) |
| PLRNUI-153 (E16-09: license check scripts/license-check.mjs, NOTICE, docs/policies/licensing.md) | #36 | merged into texo/v1 after green CI and review PASS (row committed pre-merge, see ADR 0020 Branching) |
| PLRNUI-215 (E14-07: single-source package identity config/package-identity.json, scripts/lib/identity.mjs) | #39 | merged into texo/v1 after green CI and review PASS (row committed pre-merge, see ADR 0020 Branching) |
| PLRNUI-212 (E14-06: import-time side-effects audit, test and sideEffects recommendation) | #38 | merged into texo/v1 after green CI and review PASS (row committed pre-merge, see ADR 0020 Branching) |
| PLRNUI-147 (E17-06: support matrix schema v2 with tiers and evidence, generated docs) | #41 | merged into texo/v1 after green CI and review PASS (row committed pre-merge, see ADR 0020 Branching) |
| PLRNUI-161 (E16-10: audit/ public-release review, secretlint scan, subtree classification) | #40 | merged into texo/v1 after green CI and review PASS (row committed pre-merge, see ADR 0020 Branching) |
| PLRNUI-130 (E13-02: TS-compiler-API component props extractor scripts/ai/lib/extract-props.mjs) | #44 | merged into texo/v1 after green CI and review PASS (row committed pre-merge, see ADR 0020 Branching) |
| PLRNUI-190 (E14-01: subpath export contract config/exports.json, validator, ADR 0009) | #43 | merged into texo/v1 after green CI and review PASS (row committed pre-merge, see ADR 0020 Branching) |
| PLRNUI-155 (E17-07: ADR 0011 semver/stability/deprecation policy pages) | #42 | merged into texo/v1 after green CI and review PASS (row committed pre-merge, see ADR 0020 Branching) |
| PLRNUI-265 (E15-09: codemod engine tools/codemod, legacy import specifier rewrite) | #46 | merged into texo/v1 after green CI and review PASS (row committed pre-merge, see ADR 0020 Branching) |
| PLRNUI-248 (E17-10: supply-chain hardening: Dependabot, dependency review, CodeQL, scheduled audit, SBOM) | #45 | merged into texo/v1 after green CI and review PASS (row committed pre-merge, see ADR 0020 Branching) |
| PLRNUI-163 (E17-08: V1 release train plan, freeze rules, GA checklist) | #49 | merged into texo/v1 after green CI and review PASS (row committed pre-merge, see ADR 0020 Branching) |
| PLRNUI-310 (E14-09: ADR 0010 peer and optional dependency policy, optional-peers test) | #48 | merged into texo/v1 after green CI and review PASS (row committed pre-merge, see ADR 0020 Branching) |
| PLRNUI-318 (E14-13: ADR 0014 API conventions, prop-convention check, baseline and type tests) | #47 | merged into texo/v1 after green CI and review PASS (row committed pre-merge, see ADR 0020 Branching) |
| PLRNUI-259 (E17-13: rollback and incident runbook for bad releases) | #54 | merged into texo/v1 after green CI and review PASS; the CODEOWNERS approval criterion was accepted as met by the PO decision of 2026-10-10 (sole maintainer, no second approver possible) (row committed pre-merge, see ADR 0020 Branching) |
| PLRNUI-114 (E16-02: mkdocs repo_url, nav, strict docs build and Pages deploy workflow) | #53 | merged into texo/v1 after green CI and review PASS (row committed pre-merge, see ADR 0020 Branching) |
| PLRNUI-268 (E15-11: evaluation of texo migrate CLI subcommand vs standalone codemod) | #52 | merged into texo/v1 after green CI and review PASS (row committed pre-merge, see ADR 0020 Branching) |
| PLRNUI-270 (E15-12: migration guide to Texo with placeholder tokens, doc-token gate) | #51 | merged into texo/v1 after green CI and review PASS (row committed pre-merge, see ADR 0020 Branching) |
| PLRNUI-275 (E15-15: runbook for Texo and shim publish and npm deprecate sequence) | #50 | merged into texo/v1 after green CI and review PASS (row committed pre-merge, see ADR 0020 Branching) |
| PLRNUI-201 (E14-03: explicit .js specifiers in src, check-esm-specifiers, NodeNext build, dist import tests) | #55 | merged into texo/v1 after green CI and review PASS (row committed pre-merge, see ADR 0020 Branching) |
| PLRNUI-99 (E9-11: screen-reader reading-order helper getAccessibleTree and tests) | #56 | merged into texo/v1 after green CI and review PASS (row committed pre-merge, see ADR 0020 Branching) |
| PLRNUI-124 (E17-03: release-guard channels rc, latest and shim, identity-based names, unit tests) | #57 | merged into texo/v1 after green CI and review PASS (row committed pre-merge, see ADR 0020 Branching) |
| PLRNUI-139 (E16-06: getting-started and index docs in English, generated install matrix, snippet check) | #58 | merged into texo/v1 after green CI and review PASS (row committed pre-merge, see ADR 0020 Branching) |
| PLRNUI-119 (E12-08: Expo consumer smoke exports web, iOS and Android Hermes bundles with render assertion) | #60 | merged into texo/v1 after green CI and review PASS (row committed pre-merge, see ADR 0020 Branching) |
| PLRNUI-136 (E15-03: generated legacy shim build scripts/build-shim.mjs and template) | #59 | merged into texo/v1 after green CI and review PASS (row committed pre-merge, see ADR 0020 Branching) |
| PLRNUI-452 (follow-up: ownership exception scripts/consumer-smoke.mjs for PLRNUI-201, PO-approved 2026-10-10) | #62 | merged into texo/v1 after green CI and review PASS (row committed pre-merge, see ADR 0020 Branching) |
| PLRNUI-254 (E17-12: local Verdaccio rehearsal of target and shim publish, install and deprecate) | #61 | merged into texo/v1 after green CI and review PASS (row committed pre-merge, see ADR 0020 Branching) |
| PLRNUI-228 (E4-02: useControllableState and useMergedRefs hooks) | #64 | merged into texo/v1 after green CI and review PASS (row committed pre-merge, see ADR 0020 Branching) |
| PLRNUI-196 (E14-02: generate package.json exports, typesVersions, sideEffects from config/exports.json; scripts/generate-exports.mjs) | #63 | merged into texo/v1 after green CI and review PASS (row committed pre-merge, see ADR 0020 Branching) |
| PLRNUI-138 (E8-01: native capability contract: CapabilityProvider, registry, noop and RN-core fallbacks, defineExpoAdapter) | #66 | merged into texo/v1 after green CI and review PASS (row committed pre-merge, see ADR 0020 Branching) |
| PLRNUI-166 (E1-01: ComponentMeta, colocated <Name>.meta.ts for 36 components, scripts/lib/meta.mjs lint/loader, ADR 0016) | #65 | merged into texo/v1 after green CI and review PASS (row committed pre-merge, see ADR 0020 Branching) |
| PLRNUI-162 (E15-07: compat test suite through the legacy shim: loader, curated tests, gate harness) | #68 | merged into texo/v1 after green CI and review PASS (row committed pre-merge, see ADR 0020 Branching) |
| PLRNUI-452 (follow-up: ownership exception package.json for PLRNUI-138 test:native script, PO-approved 2026-10-10) | #67 | merged into texo/v1 after green CI and review PASS (row committed pre-merge, see ADR 0020 Branching) |
| PLRNUI-232 (E12-11: consumer smoke tsconfig matrix with skipLibCheck false) | #72 | merged into texo/v1 after green CI and review PASS (row committed pre-merge, see ADR 0020 Branching) |
| PLRNUI-199 (E1-07: component docs lint scripts/check-component-docs.mjs, report-only and --strict) | #71 | merged into texo/v1 after green CI and review PASS (row committed pre-merge, see ADR 0020 Branching) |
| PLRNUI-174 (E1-02: maturity checker scripts/maturity-check.mjs over component meta) | #69 | merged into texo/v1 after green CI and review PASS (row committed pre-merge, see ADR 0020 Branching) |
| PLRNUI-452 (follow-up: ownership exception for PLRNUI-174: NavContextValue root export, export contract symbol, snapshot, TopBar example; PO-approved 2026-10-10) | #70 | merged into texo/v1 after green CI and review PASS (row committed pre-merge, see ADR 0020 Branching) |
| PLRNUI-205 (E14-04: spike ESM-only vs dual ESM+CJS vs jest-expo/Metro resolution) | #74 | merged into texo/v1 after green CI and review PASS (row committed pre-merge, see ADR 0020 Branching) |
| PLRNUI-195 (E1-06: meta-driven render matrix over every component, light and dark) | #73 | merged into texo/v1 after green CI and review PASS (row committed pre-merge, see ADR 0020 Branching) |
| PLRNUI-133 (E11-09: template folder contract and scripts/check-templates.mjs) | #75 | merged into texo/v1 after green CI and review PASS (row committed pre-merge, see ADR 0020 Branching) |
| PLRNUI-202 (E1-08: sync catalog labels and nav index pages from component meta via scripts/gen-catalog.mjs) | #76 | merged into texo/v1 after green CI and review PASS (row committed pre-merge, see ADR 0020 Branching) |
| PLRNUI-208 (E14-05: bundle-size and tree-shaking measurement harness with esbuild budgets) | #79 | merged into texo/v1 after green CI and review PASS (row committed pre-merge, see ADR 0020 Branching) |
| PLRNUI-122 (E15-01: final Texo identity decision, ADR 0017) | #78 | merged into texo/v1 after green CI and review PASS (row committed pre-merge, see ADR 0020 Branching) |
| PLRNUI-146 (E8-03: /native/testing mock adapters and renderWithCapabilities) | #77 | merged into texo/v1 after green CI and review PASS (row committed pre-merge, see ADR 0020 Branching) |
| PLRNUI-452 (follow-up: ownership exceptions for PLRNUI-134 package.json+package-lock.json, PLRNUI-144 src/tokens/types.ts and PLRNUI-202 three TopBar stability docs, PO-approved 2026-10-10 (202: standing rule "fix the repo, no waivers", flagged to the PO); arms of merged 201/138/174 removed) | #80 | merged into texo/v1 after green CI and review PASS (row committed pre-merge, see ADR 0020 Branching) |
| PLRNUI-187 (E8-09: device info and platform helpers with Expo Go detection) | #81 | merged into texo/v1 after green CI and review PASS (row committed pre-merge, see ADR 0020 Branching) |
| PLRNUI-182 (E8-08: orientation and window metrics hooks, orientation lock adapter) | #82 | merged into texo/v1 after green CI and review PASS (row committed pre-merge, see ADR 0020 Branching) |
| PLRNUI-134 (E13-03: generate props manifest ai/manifests/props.json) | #83 | merged into texo/v1 after green CI and review PASS (row committed pre-merge, see ADR 0020 Branching) |
| PLRNUI-452 (follow-up: ownership exceptions for PLRNUI-144 tests/types/props-contracts.ts and PLRNUI-172/178 capability-map files; standing PO rule "fix the repo, no waivers", flagged to the PO) | #84 | merged into texo/v1 after green CI and review PASS (row committed pre-merge, see ADR 0020 Branching) |
| PLRNUI-172 (E8-06: app-state hooks useAppState, useIsAppActive, useOnForeground, useOnBackground) | #87 | merged into texo/v1 after green CI and review PASS (row committed pre-merge, see ADR 0020 Branching) |
| PLRNUI-452 (follow-up: ownership exceptions for the two type-level capability-id contract files in the PLRNUI-172/178 arms; flagged to the PO) | #85 | merged into texo/v1 after green CI and review PASS (row committed pre-merge, see ADR 0020 Branching) |
| PLRNUI-452 (follow-up: ownership exception config/size-limits.json for PLRNUI-144, theme budgets after the Theme v2 token layer; flagged to the PO) | #86 | merged into texo/v1 after green CI and review PASS (row committed pre-merge, see ADR 0020 Branching) |
| PLRNUI-178 (E8-07: network status hook, subscribable network capability, web/expo/netinfo adapters) | #89 | merged into texo/v1 after green CI and review PASS (row committed pre-merge, see ADR 0020 Branching) |
| PLRNUI-144 (E2-01: define Theme contract v2 and token layer skeleton) | #88 | merged into texo/v1 after green CI and review PASS (row committed pre-merge, see ADR 0020 Branching) |
| PLRNUI-452 (follow-up: ownership exception ai/manifests/props.json for PLRNUI-144, generated manifest must be regenerated when Theme changes; flagged to the PO) | #90 | merged into texo/v1 after green CI and review PASS (row committed pre-merge, see ADR 0020 Branching) |
| PLRNUI-452 (follow-up: remove spent ownership exception arms for PLRNUI-134, 144, 172, 178, 202 after their merge) | #91 | merged into texo/v1 after green CI and review PASS (row committed pre-merge, see ADR 0020 Branching) |
| PLRNUI-103 (E12-01: fix test runner glob and add coverage reporting) | #92 | merged into texo/v1 after green CI and review PASS (row committed pre-merge, see ADR 0020 Branching) |
| PLRNUI-121 (E3-01: define motion tokens: duration, easing, spring, stagger, distance) | #94 | merged into texo/v1 after green CI and review PASS (row committed pre-merge, see ADR 0020 Branching) |
| PLRNUI-452 (follow-up: ownership exceptions config/size-limits.json, ai/manifests/props.json and tests/theme/theme-contract-v2.test.tsx for PLRNUI-121, motion tokens redefine theme.motion; budget relaxation flagged to the PO) | #93 | merged into texo/v1 after green CI and review PASS (row committed pre-merge, see ADR 0020 Branching) |
| PLRNUI-167 (E8-05: accessibility preference hooks: reduced motion, transparency, screen reader, font scale) | #96 | merged into texo/v1 after green CI and review PASS (row committed pre-merge, see ADR 0020 Branching) |
| PLRNUI-452 (follow-up: ownership exception for the closed CapabilityMap files for PLRNUI-167, new accessibility capability and native-core budget; flagged to the PO) | #95 | merged into texo/v1 after green CI and review PASS (row committed pre-merge, see ADR 0020 Branching) |
| PLRNUI-135 (E3-03: MotionProvider and useMotionPreference consuming useReducedMotion) | #98 | merged into texo/v1 after green CI and review PASS (row committed pre-merge, see ADR 0020 Branching) |
| PLRNUI-452 (follow-up: remove spent ownership exception arms for PLRNUI-121 and PLRNUI-167 after their merge) | #97 | merged into texo/v1 after green CI and review PASS (row committed pre-merge, see ADR 0020 Branching) |
| PLRNUI-137 (E10-01: unify useBreakpoint: width-based on all platforms, breakpoint tokens, ResponsiveContext) | #100 | merged into texo/v1 after green CI and review PASS (row committed pre-merge, see ADR 0020 Branching) |
| PLRNUI-452 (follow-up: ownership exceptions ai/manifests/props.json and tests/theme/theme-contract-v2.test.tsx for PLRNUI-137, breakpoint tokens redefine theme.breakpoints) | #99 | merged into texo/v1 after green CI and review PASS (row committed pre-merge, see ADR 0020 Branching) |
| PLRNUI-145 (E10-02: useWindowSizeClass with orientation re-export) | #104 | merged into texo/v1 after green CI and review PASS (row committed pre-merge, see ADR 0020 Branching) |
| PLRNUI-452 (follow-up: ownership exception src/responsive/context.ts for PLRNUI-145, size-class thresholds overridable through ResponsiveContext; removes the spent PLRNUI-137 arm) | #103 | merged into texo/v1 after green CI and review PASS (row committed pre-merge, see ADR 0020 Branching) |
| PLRNUI-156 (E10-03: responsive value resolver and useResponsiveValue) | #102 | merged into texo/v1 after green CI and review PASS (row committed pre-merge, see ADR 0020 Branching) |
| PLRNUI-171 (E3-08: layout transition helper over LayoutAnimation) | #101 | merged into texo/v1 after green CI and review PASS (row committed pre-merge, see ADR 0020 Branching) |
| PLRNUI-183 (E10-08: useDeviceClass, useAspectPosture and FoldAdapter) | #106 | merged into texo/v1 after green CI and review PASS (row committed pre-merge, see ADR 0020 Branching) |
| PLRNUI-173 (E10-05: ResponsiveProvider for breakpoint and size class overrides) | #105 | merged into texo/v1 after green CI and review PASS (row committed pre-merge, see ADR 0020 Branching) |
| PLRNUI-143 (E3-04: animation primitives: useAnimatedValue and animate() honoring tokens) | #108 | merged into texo/v1 after green CI and review PASS (row committed pre-merge, see ADR 0020 Branching) |
| PLRNUI-452 (follow-up: ownership exception src/motion/MotionProvider.tsx for PLRNUI-143, swappable motion engine through a MotionProvider prop; removes the spent PLRNUI-145 arm) | #107 | merged into texo/v1 after green CI and review PASS (row committed pre-merge, see ADR 0020 Branching) |
| PLRNUI-157 (E3-06: usePressFeedback hook) | #109 | merged into texo/v1 after green CI and review PASS (row committed pre-merge, see ADR 0020 Branching) |
| PLRNUI-181 (E2-06: variant API defineVariants/useVariants with Theme.variants overrides) | #111 | merged into texo/v1 after green CI and review PASS (row committed pre-merge, see ADR 0020 Branching) |
| PLRNUI-452 (follow-up: ownership exceptions src/theme/types.ts, ai/manifests/props.json and tests/types/props-contracts.ts for PLRNUI-181, optional Theme.variants; removes the spent PLRNUI-143 arm) | #110 | merged into texo/v1 after green CI and review PASS (row committed pre-merge, see ADR 0020 Branching) |
| PLRNUI-164 (E10-04: Show, Hide and Responsive components) | #112 | merged into texo/v1 after green CI and review PASS (row committed pre-merge, see ADR 0020 Branching) |
| PLRNUI-225 (E4-01: Slot primitive for asChild prop merging) | #114 | PR open (row committed pre-merge, see ADR 0020 Branching) |
| PLRNUI-452 (follow-up: ownership exceptions for the component tickets, tests/helpers/fixtures.tsx for PLRNUI-225 and count-agnostic meta-lint and check-component-docs tests; removes the spent PLRNUI-181 arm) | #113 | PR open (row committed pre-merge, see ADR 0020 Branching) |
| PLRNUI-241 (E12-14: test-coverage matrix report) | #115 | PR open (row committed pre-merge, see ADR 0020 Branching) |
| PLRNUI-126 (E12-10: render-count performance baseline tests) | #116 | PR open (row committed pre-merge, see ADR 0020 Branching) |
| PLRNUI-104 (E12-02: per-component behavior tests for layout, typography and surfaces) | #117 | PR open (row committed pre-merge, see ADR 0020 Branching) |
| PLRNUI-189 (E2-07: defineTheme composition and strict createTheme merge) | #119 | PR open (row committed pre-merge, see ADR 0020 Branching) |
| PLRNUI-452 (follow-up: ownership exceptions config/size-limits.json for PLRNUI-189 and tests/helpers/fixtures.tsx for PLRNUI-210, PLRNUI-224 and PLRNUI-233; removes the spent PLRNUI-225 arm) | #118 | PR open (row committed pre-merge, see ADR 0020 Branching) |
| PLRNUI-210 (E5-04: Label with required marker, disabled state and press-to-focus) | #120 | PR open (row committed pre-merge, see ADR 0020 Branching) |
| PLRNUI-233 (E4-04: Icon component with pluggable icon-set registry) | #121 | PR open (row committed pre-merge, see ADR 0020 Branching) |
| PLRNUI-452 (follow-up: ownership exceptions ai/manifests/props.json for PLRNUI-180, PLRNUI-209, PLRNUI-216 and PLRNUI-218, prop changes of Input, Alert, Link and Text; removes the spent PLRNUI-189, PLRNUI-210 and PLRNUI-233 arms) | #122 | PR open (row committed pre-merge, see ADR 0020 Branching) |
| PLRNUI-180 (E1-12: Input label leak, root wrapper and optional label) | #123 | PR open (row committed pre-merge, see ADR 0020 Branching) |
| PLRNUI-209 (E1-25: Alert alert role, contrast and dismiss) | #125 | PR open (row committed pre-merge, see ADR 0020 Branching) |
| PLRNUI-452 (follow-up: ownership exception config/size-limits.json for PLRNUI-209, Alert dismiss, live region and contrast check add about 370 B gzip to the root entry) | #124 | PR open (row committed pre-merge, see ADR 0020 Branching) |
| PLRNUI-216 (E1-28: Link role link, disabled and tokenised styling) | #126 | PR open (row committed pre-merge, see ADR 0020 Branching) |
| PLRNUI-452 (follow-up: ownership exception tests/components/typography/Text.test.tsx for PLRNUI-218, default Text alignment; removes the spent PLRNUI-209 and PLRNUI-216 arms) | #127 | PR open (row committed pre-merge, see ADR 0020 Branching) |
| PLRNUI-218 (E1-17: Text default alignment, fontFamily token and lines option) | #128 | PR open (row committed pre-merge, see ADR 0020 Branching) |
| PLRNUI-149 (E3-05: Presence and enter/exit transition presets) | #129 | PR open (row committed pre-merge, see ADR 0020 Branching) |
| PLRNUI-452 (follow-up: ownership exception for PLRNUI-219, props manifest, type contracts and Link accessibilityRole/selected for the bar tab semantics; removes the spent PLRNUI-180 and PLRNUI-218 arms) | #130 | PR open (row committed pre-merge, see ADR 0020 Branching) |
| PLRNUI-219 (E1-27: TopBar and BottomBar tokens, safe-area insets, navigation and tab semantics) | #131 | PR open (row committed pre-merge, see ADR 0020 Branching) |
| PLRNUI-452 (follow-up: ownership exceptions for PLRNUI-192 and PLRNUI-214, props manifest and type contracts for the toggle and progress props, root bundle budget for the toggles; removes the spent PLRNUI-219 arm) | #133 | PR open (row committed pre-merge, see ADR 0020 Branching) |
| PLRNUI-222 (E1-30: NavContext hook tests, NavBar layout and selected-state docs) | #132 | PR open (row committed pre-merge, see ADR 0020 Branching) |
| PLRNUI-214 (E1-26: ProgressBar and Spinner semantics and honest indeterminate) | #134 | PR open (row committed pre-merge, see ADR 0020 Branching) |
| PLRNUI-160 (E2-03: text style roles, font family slots and resolveTextStyle) | #136 | PR open (row committed pre-merge, see ADR 0020 Branching) |
| PLRNUI-192 (E1-22: Checkbox, Switch and RadioGroup states, animated Switch) | #135 | PR open (row committed pre-merge, see ADR 0020 Branching) |
| PLRNUI-452 (follow-up: ownership exception ai/manifests/props.json for PLRNUI-169, the new radius, spacing and size tokens widen the props manifest; removes the spent PLRNUI-192 and PLRNUI-214 arms) | #137 | PR open (row committed pre-merge, see ADR 0020 Branching) |
| PLRNUI-169 (E2-04: spacing, radius, size, border and opacity scales) | #138 | PR open (row committed pre-merge, see ADR 0020 Branching) |
| PLRNUI-152 (E2-02: palette ramps, semantic colour roles and state layers) | #140 | PR open (row committed pre-merge, see ADR 0020 Branching) |
| PLRNUI-452 (follow-up: ownership exceptions ai/manifests/props.json and config/size-limits.json for PLRNUI-152, the palette and semantic roles feed the theme colours; removes the spent PLRNUI-169 arm) | #139 | PR open (row committed pre-merge, see ADR 0020 Branching) |
| PLRNUI-186 (E1-16: FormField tokenised spacing, muted colour, typed props, error exposure) | #143 | PR open (row committed pre-merge, see ADR 0020 Branching) |
| PLRNUI-452 (follow-up: ownership exceptions for PLRNUI-177, PLRNUI-186, PLRNUI-230 and PLRNUI-239, render fixtures, props manifest and type contracts; removes the spent PLRNUI-152 arm) | #142 | PR open (row committed pre-merge, see ADR 0020 Branching) |
| PLRNUI-184 (E1-35: root exports for the nav hooks, PACKAGE_NAME deprecation) | #141 | PR open (row committed pre-merge, see ADR 0020 Branching) |
| PLRNUI-230 (E6-03: Alert appearance, icon and actions slots) | #144 | PR open (row committed pre-merge, see ADR 0020 Branching) |
| PLRNUI-239 (E4-05: built-in glyph set for Icon, IconGlyphs provider) | #146 | PR open (row committed pre-merge, see ADR 0020 Branching) |
| PLRNUI-177 (E10-06: Container with max width, gutters and container size context) | #145 | PR open (row committed pre-merge, see ADR 0020 Branching) |
| PLRNUI-223 (E10-12: useIsLargeText and StackOnLargeText) | #147 | PR open (row committed pre-merge, see ADR 0020 Branching) |
| PLRNUI-188 (E10-10: SplitView master-detail layout) | #149 | PR open (row committed pre-merge, see ADR 0020 Branching) |
| PLRNUI-165 (E3-07: useShimmer animation hook) | #148 | PR open (row committed pre-merge, see ADR 0020 Branching) |
| PLRNUI-193 (E2-08: system colour scheme, preference/preset/density, ThemeScope, honest persistence) | #151 | PR open (row committed pre-merge, see ADR 0020 Branching) |
| PLRNUI-452 (ownership exception for PLRNUI-193; spent arms 177, 186, 230, 239 removed) | #150 | PR open (row committed pre-merge, see ADR 0020 Branching) |
| PLRNUI-165 (test typing fix for use-shimmer test, found by tsc -p tsconfig.tests.json) | #152 | PR open (row committed pre-merge, see ADR 0020 Branching) |
| PLRNUI-154 (E8-04: appearance and colour-scheme hooks) | #155 | PR open (row committed pre-merge, see ADR 0020 Branching) |
| PLRNUI-452 (ownership exception for PLRNUI-154; spent arm 193 removed) | #154 | PR open (row committed pre-merge, see ADR 0020 Branching) |
| PLRNUI-226 (E10-14: responsive barrel, docs, example, public-API test) | #153 | PR open (row committed pre-merge, see ADR 0020 Branching) |
| PLRNUI-452 (remove the spent PLRNUI-154 ownership arm) | #156 | PR open (row committed pre-merge, see ADR 0020 Branching) |
| PLRNUI-224 (E6-01: Portal, nested OverlayHost and overlay stack, ADR 0015) | #161 | PR open (row committed pre-merge, see ADR 0020 Branching) |
| PLRNUI-106 (E12-03: RNTL helper, ADR 0018, core-controls port) | #160 | PR open (row committed pre-merge, see ADR 0020 Branching) |
| PLRNUI-211 (E7-08: useDataTable headless model) | #158 | PR open (row committed pre-merge, see ADR 0020 Branching) |
| PLRNUI-452 (ownership exception for PLRNUI-211) | #157 | PR open (row committed pre-merge, see ADR 0020 Branching) |
| PLRNUI-234 (E11-10: tabs app starter template, check-templates --build) | #163 | PR open (row committed pre-merge, see ADR 0020 Branching) |
| PLRNUI-452 (ownership exception for PLRNUI-106) | #159 | PR open (row committed pre-merge, see ADR 0020 Branching) |
| PLRNUI-452 (ownership exception for PLRNUI-234) | #162 | PR open (row committed pre-merge, see ADR 0020 Branching) |
| PLRNUI-123 (E13-01: AI-layer architecture, ai/README.md, ai:build and ai:check, dist/meta in the pack) | #165 | PR open (row committed pre-merge, see ADR 0020 Branching) |
| PLRNUI-452 (remove the spent PLRNUI-234, 106, 211 and 224 ownership arms) | #164 | PR open (row committed pre-merge, see ADR 0020 Branching) |
| PLRNUI-227 (E6-02: Modal accessibility, dismissal, animation, keyboard avoidance) | #167 | PR open (row committed pre-merge, see ADR 0020 Branching) |
| PLRNUI-452 (ownership exception for PLRNUI-227) | #166 | PR open (row committed pre-merge, see ADR 0020 Branching) |
| PLRNUI-191 (E1-05: maturity, tokens and tests typecheck gates in npm scripts and CI, docs/maturity.md) | #170 | PR open (row committed pre-merge, see ADR 0020 Branching) |
| PLRNUI-452 (remove the spent PLRNUI-227 ownership arm) | #168 | PR open (row committed pre-merge, see ADR 0020 Branching) |
| PLRNUI-452 (ownership exception for PLRNUI-191) | #169 | PR open (row committed pre-merge, see ADR 0020 Branching) |
| PLRNUI-140 (E17-05: CI split into parallel jobs, Node 22.13 and 24 unit matrix, compat-driven Expo lanes, concurrency) | #172 | PR open (row committed pre-merge, see ADR 0020 Branching) |
| PLRNUI-452 (remove the spent PLRNUI-191 ownership arm) | #171 | PR open (row committed pre-merge, see ADR 0020 Branching) |
| PLRNUI-113 (E17-01: Changesets with rc pre mode, shim version sync) | #175 | PR open (row committed pre-merge, see ADR 0020 Branching) |
| PLRNUI-452 (ownership exception for PLRNUI-113) | #173 | PR open (row committed pre-merge, see ADR 0020 Branching) |
| PLRNUI-452 (ownership exception for PLRNUI-140) | #174 | PR open (row committed pre-merge, see ADR 0020 Branching) |
| PLRNUI-240 (E17-09: release notes template, GitHub release categories, changelog-github generator) | #178 | PR open (row committed pre-merge, see ADR 0020 Branching) |
| PLRNUI-452 (remove the spent PLRNUI-113 and PLRNUI-140 ownership arms) | #176 | PR open (row committed pre-merge, see ADR 0020 Branching) |
| PLRNUI-452 (ownership exception for PLRNUI-240) | #177 | PR open (row committed pre-merge, see ADR 0020 Branching) |
| PLRNUI-117 (E17-02: release workflow with npm trusted publishing and provenance) | #180 | PR open (row committed pre-merge, see ADR 0020 Branching) |
| PLRNUI-452 (ownership exception for PLRNUI-117) | #179 | PR open (row committed pre-merge, see ADR 0020 Branching) |
| PLRNUI-452 (remove the spent PLRNUI-240 and PLRNUI-117 ownership arms) | #181 | PR open (row committed pre-merge, see ADR 0020 Branching) |
| PLRNUI-132 (E17-04: dist-tag promotion script and workflow with integrity check, gates and rollback) | #182 | PR open (row committed pre-merge, see ADR 0020 Branching) |
| PLRNUI-279 (E8-10: keyboard hooks and keyboard-avoiding/dismiss-on-tap primitives) | #183 | PR open (row committed pre-merge, see ADR 0020 Branching) |
| PLRNUI-282 (E8-11: safe-area adapter with RN-core fallback and useInsets hook) | #184 | PR open (row committed pre-merge, see ADR 0020 Branching) |
| PLRNUI-293 (E8-13: haptics adapter, useHaptics with expo-haptics injection and web/RN fallbacks) | #185 | PR open (row committed pre-merge, see ADR 0020 Branching) |
| PLRNUI-298 (E8-15: clipboard adapter and useCopyToClipboard with expo and web mappings) | #186 | PR open (row committed pre-merge, see ADR 0020 Branching) |
| PLRNUI-322 (E13-21: skill pack scaffolding, validator and skills.sh installability) | #187 | PR open (row committed pre-merge, see ADR 0020 Branching) |
| PLRNUI-452 (ownership exception for PLRNUI-285) | #188 | PR open (row committed pre-merge, see ADR 0020 Branching) |
| PLRNUI-285 (E1-09: Button info variant and pressed-state contrast fix) | #190 | PR open (row committed pre-merge, see ADR 0020 Branching) |
| PLRNUI-452 (ownership exception for PLRNUI-285: size budget and props manifest) | #189 | PR open (row committed pre-merge, see ADR 0020 Branching) |
| PLRNUI-353 (E8-19: usePermission API and PermissionAdapter pattern) | #191 | PR open (row committed pre-merge, see ADR 0020 Branching) |
| PLRNUI-366 (E8-23: storage adapters and useStoredState with secure-store no-downgrade rule) | #192 | PR open (row committed pre-merge, see ADR 0020 Branching) |
| PLRNUI-360 (E4-23: LocaleProvider, typed messages catalog, direction and Intl formatters) | #193 | PR open (row committed pre-merge, see ADR 0020 Branching) |
| PLRNUI-412 (E6-20: StateView with EmptyState, ErrorState, LoadingState, Result and AsyncBoundary) | #195 | PR open (row committed pre-merge, see ADR 0020 Branching) |
| PLRNUI-452 (ownership exception for PLRNUI-412: fixture and generated maturity page) | #194 | PR open (row committed pre-merge, see ADR 0020 Branching) |
| PLRNUI-242 (E11-12: dashboard app starter template) | #196 | PR open (row committed pre-merge, see ADR 0020 Branching) |
| PLRNUI-263 (E11-17: settings app starter template) | #197 | PR open (row committed pre-merge, see ADR 0020 Branching) |
| PLRNUI-368 (E8-24: biometric prompt adapter, Expo mapping, noop and useBiometricPrompt) | #198 | PR open (row committed pre-merge, see ADR 0020 Branching) |
| PLRNUI-371 (E8-25: AppReadyGate, useAppReady, splash adapter and hydration task) | #199 | PR open (row committed pre-merge, see ADR 0020 Branching) |
| PLRNUI-452 (ownership exception for PLRNUI-328, 338, 343, 414 and 420: shared wiring files, PO decision) | #201 | PR open (row committed pre-merge, see ADR 0020 Branching) |
| PLRNUI-328 (E4-08: Spacer component with minimal wiring) | #202 | PR open (row committed pre-merge, see ADR 0020 Branching) |
| PLRNUI-452 (remediation follow-up: per-ticket exception text, remove the spent PLRNUI-328 arm) | #203 | PR open (row committed pre-merge, see ADR 0020 Branching) |
| PLRNUI-244 (E13-13: compile-checked AI example per root component) | #204 | PR open (row committed pre-merge, see ADR 0020 Branching) |
| PLRNUI-274 (E2-09: DensityProvider and useDensity) | #205 | PR open (row committed pre-merge, see ADR 0020 Branching) |
| PLRNUI-278 (E2-11: WCAG contrast util and theme contrast gate) | #206 | PR open (row committed pre-merge, see ADR 0020 Branching) |
| PLRNUI-288 (E8-12: ThemedStatusBar, useSystemBars and system UI adapters) | #207 | PR open (row committed pre-merge, see ADR 0020 Branching) |
| PLRNUI-290 (E1-10: CodeInline keeps chip styles with caller props) | #208 | PR open (row committed pre-merge, see ADR 0020 Branching) |
| PLRNUI-301 (E8-16: share adapter and useShare) | #209 | PR open (row committed pre-merge, see ADR 0020 Branching) |
| PLRNUI-315 (E14-11: TypeScript-compiler per-subpath API snapshot) | #210 | PR open (row committed pre-merge, see ADR 0020 Branching) |
| PLRNUI-356 (E8-20: Expo permission adapters) | #211 | PR open (row committed pre-merge, see ADR 0020 Branching) |
| PLRNUI-356 (follow-up: internal createUnavailablePermission, Expo Go evidence) | #213 | PR open (row committed pre-merge, see ADR 0020 Branching) |
| PLRNUI-460 (ownership extensions file for approved ticket classes) | #212 | PR open (row committed pre-merge, see ADR 0020 Branching) |
| PLRNUI-280 (E5-05: compound Field) | #217 | PR open (row committed pre-merge, see ADR 0020 Branching) |
| PLRNUI-461 (semver and migration-changelog impact of the native layer and density runtime) | #214 | PR open (row committed pre-merge, see ADR 0020 Branching) |
| PLRNUI-315 (amendment: snapshot of the generated declarations, exports and packed tarball) | #216 | PR open (row committed pre-merge, see ADR 0020 Branching) |
| PLRNUI-462 (outline colour-role contrast fix) | #215 | PR open (row committed pre-merge, see ADR 0020 Branching) |
| PLRNUI-463 (ownership extensions amendment: 462 legacy colour test, 197 snapshots and example) | #218 | PR open (row committed pre-merge, see ADR 0020 Branching) |
| PLRNUI-346 (upgrade Popover: native anchored rendering, placement, collision, a11y) | #221 | PR open (row committed pre-merge, see ADR 0020 Branching) |
| PLRNUI-297 (Add Pager and Carousel with page indicator) | #219 | PR open (row committed pre-merge, see ADR 0020 Branching) |
| PLRNUI-429 (Upgrade NavContext: active state, nested routes, adapter interface) | #223 | PR open (row committed pre-merge, see ADR 0020 Branching) |
| PLRNUI-295 (Row dead flex prop and rowGap on wrap) | #222 | PR open (row committed pre-merge, see ADR 0020 Branching) |
| PLRNUI-465 (ownership extensions amendment: pinned prop contracts for 339 and 346) | #220 | PR open (row committed pre-merge, see ADR 0020 Branching) |
| PLRNUI-466 (bundle budget re-baseline: root-all and . to 50000 B gzip) | #224 | PR open (row committed pre-merge, see ADR 0020 Branching) |
| PLRNUI-330 (Banner persistent announcement) | #226 | PR open (row committed pre-merge, see ADR 0020 Branching) |
| PLRNUI-197 (PasswordInput and Textarea to demo) | #225 | PR open (row committed pre-merge, see ADR 0020 Branching) |
| PLRNUI-229 (Touchable pressable primitive) | #227 | PR open (row committed pre-merge, see ADR 0020 Branching) |
| PLRNUI-467 (ownership extensions amendment: docs/maturity.md for 339 and 346) | #228 | PR open (row committed pre-merge, see ADR 0020 Branching) |
| PLRNUI-468 (ownership extensions amendment: root props-type export for 339 and 346) | #230 | PR open (row committed pre-merge, see ADR 0020 Branching) |
| PLRNUI-469 (ownership extensions amendment: extract-props pin, fixture and overlay example for 339 and 346) | #231 | PR open (row committed pre-merge, see ADR 0020 Branching) |
| PLRNUI-470 (ownership extensions amendment: component smoke test and public-types note for 339 and 346) | #232 | PR open (row committed pre-merge, see ADR 0020 Branching) |
| PLRNUI-148 (E16-08: API reference generated from TSDoc, scripts/docs-api.mjs) | #234 | PR open (row committed pre-merge, see ADR 0020 Branching) |
| PLRNUI-428 (Screen) | #244 | PR open (row committed pre-merge, see ADR 0020 Branching) |
| PLRNUI-307 (Local development link workflow for consumer apps) | #238 | PR open (row committed pre-merge, see ADR 0020 Branching) |
| PLRNUI-142 (E15-04: export-parity test shim vs Texo) | #241 | PR open (row committed pre-merge, see ADR 0020 Branching) |
| PLRNUI-313 (E14-10: subpath resolution matrix script) | #245 | PR open (row committed pre-merge, see ADR 0020 Branching) |
| PLRNUI-472 (ownership amendment for 428 Screen: system-ui test and RN shim) | #237 | PR open (row committed pre-merge, see ADR 0020 Branching) |
| PLRNUI-251 (Pack verification: content, size and entrypoint checks on the tarball) | #236 | PR open (row committed pre-merge, see ADR 0020 Branching) |
| PLRNUI-317 (TexoProvider composition root, ADR-R1) | #233 | PR open (row committed pre-merge, see ADR 0020 Branching) |
| PLRNUI-170 (E15-08: consumer smoke --via-shim for Node/TS and Expo 57 consumers) | #240 | PR open (row committed pre-merge, see ADR 0020 Branching) |
| PLRNUI-473 (ownership extensions amendment: package.json scripts and docs-api test for 148 and 251) | #239 | PR open (row committed pre-merge, see ADR 0020 Branching) |
| PLRNUI-474 (ownership extensions amendment: docs/maturity.md and fixtures for 329, 331, 332, 334, 340, 287, 407) | #242 | PR open (row committed pre-merge, see ADR 0020 Branching) |
| PLRNUI-475 (ownership extensions amendment: shim type-parity generator and type-tests tsconfig for 150) | #243 | PR open (row committed pre-merge, see ADR 0020 Branching) |
| PLRNUI-331 (Chip: selectable, removable, icon-capable filter/input chip) | #247 | PR open (row committed pre-merge, see ADR 0020 Branching) |
| PLRNUI-340 (Collapsible animated expand/collapse region) | #246 | PR open (row committed pre-merge, see ADR 0020 Branching) |
| PLRNUI-142 (fix: parity CLI test counts follow the snapshot) | #250 | PR open (row committed pre-merge, see ADR 0020 Branching) |
