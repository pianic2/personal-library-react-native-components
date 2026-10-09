# Checkpoint and resume protocol

Keeps a long run restartable from the repo alone (ADR 0020, `audit/adr/0020-ticket-execution-protocol.md`). The state lives in `audit/texo-v1/STATE.md`, never in a session.

## Ticket end
Update, in this order:
1. `audit/texo-v1/STATE.md`: add one row to the `Execution log` table (ticket, PR number, result). Commit it on the ticket branch BEFORE the merge; it is the only file outside `filesTouched` that the ownership check (`scripts/check-ownership.mjs`) allows.
2. Jira: the ONE evidence comment after the merge (`docs/policies/evidence-template.md`). Do not change the ticket status.

Nothing else is updated at ticket end.

## Wave end
When the last ticket of a wave is merged into `texo/v1`, update:
1. `audit/texo-v1/STATE.md`: counters and the "Recommended next work" list, so a new session reads the real position. Add the wave to the Execution log summary if it is not there.
2. `audit/texo-v1/jira-map.json`: only if tickets were created in the wave (new key per local id).
3. `audit/texo-v1/DECISIONS.md`: only if the PO answered or changed a decision during the wave.
4. Jira: optionally one progress comment on the epic (counts of merged and blocked tickets, next wave). It is not an evidence comment and changes no status.

Files 2 and 3 are outside every ticket's `filesTouched`, so the ownership check rejects them. Change them only through a ticket that owns them or an explicit PO instruction.

Checkpoint commit message, following the commit convention: `chore(PLRNUI-<n>): checkpoint wave <N>` where `<n>` is the last ticket of the wave.

## Resume
A new session reads `STATE.md` only, then continues with the skill `texo-execute`. Starter prompt:

```
Resume the Texo V1 run. Read only audit/texo-v1/STATE.md: Execution log, Numbers, Recommended next work. Do not explore the repo. Pick the next ticket with the JQL in docs/policies/jql.md, skipping tickets already in the Execution log. Execute it with the texo-execute skill. If po-approved is missing or a dependency is unmerged, stop and tell me.
```

The prompt is kept under 150 tokens (about 4 characters per token).

## Stale state
A skipped checkpoint leaves STATE.md behind the repo. When a session finds a merged PR to `texo/v1` without an Execution log row, it adds the row first and says so in its report.
