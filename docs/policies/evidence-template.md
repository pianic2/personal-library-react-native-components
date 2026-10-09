# Evidence template and Jira evidence comment procedure

Used by ticket sessions (ADR 0020, `audit/adr/0020-ticket-execution-protocol.md`) to report a finished ticket. The evidence goes in ONE Jira comment, posted after the PR is merged into `texo/v1`.

## Rules
- The guard: never skip, disable or quarantine a test to get green, and never weaken an assertion or edit a test to match a bug. A red test is reported with its output, never hidden.
- One comment per ticket, written from facts you ran or read in this session; do not describe what you did not run.
- Status transitions: ADR 0020 says sessions never change a Jira status, and ADR 0020 wins over this page. `ALLOWED_TRANSITIONS` below is the parameter for a future PO decision: a non-empty value is valid only together with a matching amendment of ADR 0020. It is a list of transition names and never contains `Approvato`; `po-approved` is never applied by a session.

`ALLOWED_TRANSITIONS`: none (the PO has not allowed sessions to move tickets).

## Template

```
Evidence PLRNUI-<n> (<local id>), PR <link> merged into texo/v1 (<merge sha>).

Files changed: <one path per line, or a diff summary>. Outside filesTouched: the `STATE.md` Execution log row (the exception allowed by ADR 0020) and, only for the ticket that closes a wave, the `Wave progress` row and the "Recommended next work" list of `STATE.md` (`docs/policies/checkpoint.md`), plus any file the PO added to the ticket in writing (name that written approval, for example the Jira comment or PR comment, in the evidence).

Commands (exit code):
- <command> <exit code> (<short result: n pass, n fail>)
- <manual check, for example "inspection"> n/a (no exit code): <what was inspected and the result>
- CI on the PR head <head sha> (not the merge sha), one line per required check listed in `docs/policies/branching.md` (currently `package-baseline`, `fast-checks`, `commit-and-ownership`): <check name> <green|red>

Test output: <the validation commands' summary lines>

Acceptance criteria:
- [x] <criterion text> - <how it was checked: command, grep, test name>
- [ ] <unmet criterion> - <reason it is unmet>

Ticket evidence entries (EVERY entry of the ticket's `evidence` array as its own line, verbatim):
- <entry text>: <path, link or pasted output that satisfies it, or "see Files changed" / "see Test output" when a dedicated field above already holds it>

Independent review: <verdict, number of rounds, blockers/majors fixed>. Changes after the last review: <none|list each change>. Any change after a PASS needs a new independent review of the new head (`skills/texo-review/SKILL.md`), and the Independent review field then reports the verdict on that head. If a change was merged without the new review, say so under "Not verified" below: the merge is then outside the protocol, and the PO decides whether to accept it.
Not verified, known limits and deviations: <list, or none>.
```

## Field reference
| Field | Source |
|---|---|
| PR link, merge sha | the merged PR |
| Files changed | `git diff --name-only <base>...<head sha>` taken BEFORE the merge (or the file list of the PR), same list the ownership check uses; after the merge `<base>` and `HEAD` can both be the merge commit and the diff is empty |
| Commands and exit codes | the ticket `validation` commands, exactly as run; a manual validation entry (for example "inspection") has no exit code: write `n/a` and what was checked |
| Test output | summary lines of the test runs |
| Acceptance criteria | the ticket `acceptance` array, one line each |
| Ticket evidence entries | the ticket `evidence` array: each entry MUST appear as its own line, verbatim. This is the contract that covers every kind of entry used in the backlog (92 distinct texts when this page was written); entries already held by Files changed or Test output point to them instead of repeating |
| Independent review | the reviewer session verdict (ADR 0020, Roles) |

## Procedure
1. Merge the PR into `texo/v1` only with green checks and a passing review (ADR 0020, Branching).
2. Fill the template from the ticket JSON in `audit/texo-v1/backlog/`, not from the Jira description.
3. Post it as one Jira comment on the ticket.
4. Leave the status unchanged unless `ALLOWED_TRANSITIONS` lists a transition AND ADR 0020 has been amended to allow it (see Rules).
5. If the merge cannot happen (red check, failed review, open blocker), post no evidence comment: report the blocker on the PR and to the PO, and stop.
