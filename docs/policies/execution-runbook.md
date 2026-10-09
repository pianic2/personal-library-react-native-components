# Execution runbook

Copy-paste prompts for running Texo V1 tickets, one per session. Protocol: [ADR 0020](../../audit/adr/0020-ticket-execution-protocol.md). Skills: [texo-execute](../../skills/texo-execute/SKILL.md) (author) and [texo-review](../../skills/texo-review/SKILL.md) (reviewer). Queries: [JQL set](jql.md). State and resume: [checkpoint](checkpoint.md).

## Choose the next ticket
1. Run the ready queue query of the [JQL set](jql.md) (by wave if you want one wave at a time).
2. Skip tickets that have a row in the `Execution log` of `audit/texo-v1/STATE.md` or whose PR is already merged into `texo/v1`.
3. Take the lowest wave whose dependencies are all merged. `node scripts/ticket-prompt.mjs PLRNUI-<n>` prints the full minimal prompt of a ticket if you want to see it before starting.

## Author: execute one ticket
Replace `<n>` and `<slug>`.

```
Execute PLRNUI-<n> with the texo-execute skill. Read the ticket from audit/texo-v1/backlog, not from Jira. Branch texo/PLRNUI-<n>-<slug> from texo/v1, touch only its owned files, run its validation commands (3 attempts at most), open the PR to texo/v1, then get an independent review. Merge only with green checks and a PASS. Never change a Jira status or apply po-approved. If po-approved is missing or a dependency is unmerged, stop and tell me.
```

## Reviewer: independent review
Open a NEW session; do not paste the author's notes.

```
Review PR <number> for PLRNUI-<n> with the texo-review skill, in this fresh session. You have only the ticket from audit/texo-v1/backlog, the PR diff and its acceptance criteria. Do not edit, push or merge. Post one PR review comment with BLOCKER, MAJOR and MINOR findings and a final line VERDICT: PASS or FAIL.
```

## Wave checkpoint
Give it to the author of the last ticket of a wave, before its merge (see [checkpoint](checkpoint.md)).

```
Close wave <N> with PLRNUI-<n>, the last ticket of the wave. On its branch, before the merge, add to audit/texo-v1/STATE.md its Execution log row and one Wave progress row in a single commit chore(PLRNUI-<n>): checkpoint wave <N>. Do not edit jira-map.json or DECISIONS.md: list in your report what needs them.
```

## Resume
Same text as in [checkpoint](checkpoint.md); keep the two identical.

```
Resume the Texo V1 run. Before starting, read only audit/texo-v1/STATE.md for the state: Execution log, Wave progress, Recommended next work. Pick the next ticket with the JQL in docs/policies/jql.md, skip tickets in the Execution log, and skip any whose PR is already merged into texo/v1 (backfill its log row instead). Then execute it with the texo-execute skill. Never change a Jira status. If po-approved is missing or a dependency is unmerged, stop and tell me.
```

## Pause
- Pause at a ticket boundary: let the current PR merge or stop before the merge; never leave a branch half-pushed.
- If you stop mid-ticket, push the branch and say in the report which step is next. Do not change the Jira status and do not add an Execution log row: rows exist only for merged tickets.
- Nothing else is needed: the resume prompt rebuilds the position from `STATE.md` and the merged PR list.

## Evidence
After the merge, one Jira comment with commands and exit codes, files changed, PR link and the acceptance checklist (the fields listed in ADR 0020, Branching). The evidence template of E18-07 will detail them once it is merged.
