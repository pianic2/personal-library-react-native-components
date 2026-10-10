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
| PLRNUI-114 (E16-02: mkdocs repo_url, nav, strict docs build and Pages deploy workflow) | #53 | merged into texo/v1 after green CI and review PASS (row committed pre-merge, see ADR 0020 Branching) |
| PLRNUI-268 (E15-11: evaluation of texo migrate CLI subcommand vs standalone codemod) | #52 | merged into texo/v1 after green CI and review PASS (row committed pre-merge, see ADR 0020 Branching) |
| PLRNUI-270 (E15-12: migration guide to Texo with placeholder tokens, doc-token gate) | #51 | merged into texo/v1 after green CI and review PASS (row committed pre-merge, see ADR 0020 Branching) |
| PLRNUI-275 (E15-15: runbook for Texo and shim publish and npm deprecate sequence) | #50 | merged into texo/v1 after green CI and review PASS (row committed pre-merge, see ADR 0020 Branching) |
| PLRNUI-99 (E9-11: screen-reader reading-order helper getAccessibleTree and tests) | #56 | merged into texo/v1 after green CI and review PASS (row committed pre-merge, see ADR 0020 Branching) |
| PLRNUI-124 (E17-03: release-guard channels rc, latest and shim, identity-based names, unit tests) | #57 | merged into texo/v1 after green CI and review PASS (row committed pre-merge, see ADR 0020 Branching) |
| PLRNUI-139 (E16-06: getting-started and index docs in English, generated install matrix, snippet check) | #58 | merged into texo/v1 after green CI and review PASS (row committed pre-merge, see ADR 0020 Branching) |
| PLRNUI-136 (E15-03: generated legacy shim build scripts/build-shim.mjs and template) | #59 | merged into texo/v1 after green CI and review PASS (row committed pre-merge, see ADR 0020 Branching) |
| PLRNUI-254 (E17-12: local Verdaccio rehearsal of target and shim publish, install and deprecate) | #61 | merged into texo/v1 after green CI and review PASS (row committed pre-merge, see ADR 0020 Branching) |
