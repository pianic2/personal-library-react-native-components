# Checkpoint and resume protocol

Keeps a long run restartable from the repo alone (ADR 0020, `audit/adr/0020-ticket-execution-protocol.md`). The state lives in `audit/texo-v1/STATE.md`, never in a session. Sessions never push to `texo/v1` or `main` directly: every change, checkpoints included, rides on a ticket PR.

## Ticket end
Before the merge (on the ticket branch):
1. `audit/texo-v1/STATE.md`: add one row to the `Execution log` table (ticket, PR number, result). It is the only file outside `filesTouched` that the ownership check (`scripts/check-ownership.mjs`) allows. Commit it with the ticket, or as `chore(PLRNUI-<n>): state log row`.

After the merge:
2. Jira: the ONE evidence comment (`docs/policies/evidence-template.md`). Do not change the ticket status.

Nothing else is updated at ticket end (wave-level files: see Wave end).

## Wave end
The checkpoint is part of the LAST ticket of the wave: the one the PO designates, or, if none is designated, the ticket whose merge leaves no unmerged `po-approved` ticket of that wave. It goes in that ticket's branch, before its merge, in the same commit as its Execution log row (commit message `chore(PLRNUI-<n>): checkpoint wave <N>`, `<n>` being that ticket). If the last ticket is blocked, no checkpoint is written: report it. Update:
1. `audit/texo-v1/STATE.md`: the counters in "Numbers" and the "Recommended next work" list, so a new session reads the real position. This is the only wave-end file a session edits; ADR 0020 names the Execution log row as the `filesTouched` exception, and this page deliberately extends it to these two sections of the same file.

Flag to the PO in the report, do NOT edit (they are outside every ticket's `filesTouched`, and the ownership check rejects them):
2. `audit/texo-v1/jira-map.json`: needed only if tickets were created in the wave.
3. `audit/texo-v1/DECISIONS.md`: needed only if the PO answered or changed a decision during the wave.
They change only through a ticket that owns them or an explicit PO instruction.

Optionally, after the merge: one progress comment on the epic in Jira (merged and blocked counts, next wave). It is not an evidence comment and changes no status.

## Resume
A new session reads `STATE.md` only for the state, then continues with the skill `texo-execute`. Starter prompt:

```
Resume the Texo V1 run. Read only audit/texo-v1/STATE.md for the state: Execution log, Numbers, Recommended next work. Do not explore the repo. Pick the next ticket with the JQL in docs/policies/jql.md, skipping tickets already in the Execution log, and execute it with the texo-execute skill. Never change a Jira status. If po-approved is missing or a dependency is unmerged, stop and tell me.
```

Check the size (limit 150 tokens, about 4 characters per token): `awk '/^Resume the Texo/' docs/policies/checkpoint.md | wc -c`, then divide by 4.

## Stale state
A skipped checkpoint leaves `STATE.md` behind the repo. When a session finds a merged PR to `texo/v1` without an Execution log row, it adds the missing row on its own ticket branch as a separate commit `chore(PLRNUI-<current>): backfill log row PLRNUI-<missing>`, and says so in its report. If it cannot establish the facts of the missing ticket (PR number, result), it asks the PO instead of guessing.
