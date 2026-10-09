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
