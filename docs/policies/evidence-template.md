# Evidence template and Jira evidence comment procedure

Used by ticket sessions (ADR 0020, `audit/adr/0020-ticket-execution-protocol.md`) to report a finished ticket. The evidence goes in ONE Jira comment, posted after the PR is merged into `texo/v1`.

## Rules
- Never skip, disable or quarantine a test to get green. A red test is reported with its output, never hidden.
- One comment per ticket, written from facts you ran or read in this session; do not describe what you did not run.
- Status transitions: only the ones the PO policy allows, set in `ALLOWED_TRANSITIONS` below (default: none). Never `Approvato`, never `po-approved`.
- Say what was NOT verified or not reviewed (for example changes made after the last independent review).

`ALLOWED_TRANSITIONS`: none (the PO has not allowed sessions to move tickets; change this line only on a PO decision).

## Template

```
Evidence PLRNUI-<n> (<local id>), PR <link> merged into texo/v1 (<merge sha>).

Files changed: <one path per line, or a diff summary>. Outside filesTouched (only if ADR 0020 allows): <STATE.md row>.

Commands (exit code):
- <command> <exit code> (<short result: n pass, n fail>)
- CI package-baseline: <green|red> on <commit sha>

Test output: <the validation commands' summary lines>

Acceptance criteria:
- [x|  ] <criterion text> - <how it was checked: command, grep, test name>

Ticket evidence entries (one line per entry of the ticket's `evidence` array, verbatim):
- <entry text>: <path, link or pasted output that satisfies it>

Independent review: <verdict, number of rounds, blockers/majors fixed>. Changes after the last review: <none|list>.
Known limits / deviations: <list, or none>.
```

## Field reference
| Field | Source |
|---|---|
| PR link, merge sha | the merged PR |
| Files changed | `git diff --name-only <base>...HEAD`, same list the ownership check uses |
| Commands and exit codes | the ticket `validation` commands, exactly as run |
| Test output | summary lines of the test runs |
| Acceptance criteria | the ticket `acceptance` array, one line each |
| Ticket evidence entries | the ticket `evidence` array, verbatim: this covers every kind of entry used in the backlog (diff summary, file list, test output, generated artifact path, snapshot or story description, catalog entry path, and so on) |
| Independent review | the reviewer session verdict (ADR 0020, Roles) |

## Procedure
1. Merge the PR into `texo/v1` only with green checks and a passing review (ADR 0020, Branching).
2. Fill the template from the ticket JSON in `audit/texo-v1/backlog/`, not from the Jira description.
3. Post it as one Jira comment on the ticket.
4. Apply a status transition only if `ALLOWED_TRANSITIONS` lists it; otherwise leave the status unchanged.
