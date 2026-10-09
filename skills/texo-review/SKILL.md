---
name: texo-review
description: Independent review of one Texo V1 ticket PR, run in a fresh session with empty context. Input is only the ticket from the repo backlog JSON, the PR diff and the acceptance criteria. Checks every acceptance criterion with evidence, file ownership, API conventions, tokens and colors, accessibility, skipped tests and fail-open risks, then returns findings by severity (blocker, major, minor) and a PASS or FAIL verdict as a PR review comment. Never edits code, never merges, never touches Jira.
---

# texo-review

Protocol: `audit/adr/0020-ticket-execution-protocol.md` (Roles). The author and the reviewer are different sessions.

## Independence (read first)
Run this in a FRESH session. A reviewer that shares context with the author is not independent: if you have seen the author's reasoning, stop and ask for a new session.
Inputs, and nothing else: the ticket body from `audit/texo-v1/backlog/E*.json` (local id from `audit/texo-v1/jira-map.json`, not the Jira description), the PR diff, the ticket acceptance criteria. Do not read the author's notes. Do not explore the repo beyond what a finding needs.

## Rules
- Read-only: never edit code, push, merge, or touch Jira. The only write is the PR review comment. The author fixes; you repeat the review.
- The only commands you run are the ones this checklist names (the ownership check, the API conventions check, the ticket's validation commands) on the PR branch; do not explore the repo beyond that.
- Judge the diff against the ticket, not against your taste. Every finding cites a file and a line, and says the input that makes it fail.
- Verify claims: "tests prove X" means you read the test and it really asserts X.

## Checklist
1. **Acceptance, one by one.** For each criterion in the ticket: met or not, and the evidence (command, grep, test name, line). A criterion that cannot be checked from the diff is a finding.
2. **Ownership.** Run `node scripts/check-ownership.mjs <ticket-id> origin/texo/v1` on the PR branch (`scripts/check-ownership.mjs`, E18-06). Any violation is a blocker. The only allowed extra file is the `STATE.md` Execution log row (ADR 0020).
3. **API conventions (ADR 0014).** Run `node scripts/check-api-conventions.mjs` when it exists; until it exists, check the conventions by hand against ADR 0014. Public API changes must match the ticket exactly.
4. **Tokens and colors.** No hard-coded hex or rgba colors in components: grep the added lines for `#[0-9a-fA-F]{3,8}\b` and `rgba?\(`; styles come from theme tokens.
5. **Accessibility.** Interactive components keep their role, label, state and minimum touch target obligations; the diff must not remove them.
6. **Tests.** No skipped, disabled or quarantined test (`.skip`, `xit`, `todo`, commented out); no weakened assertion; new behavior has a test that would fail without the change. Validation commands in the ticket were run and their exit codes reported.
7. **Fail-open and safety.** For scripts and guards: empty input, error output, malformed data and option-like arguments must fail closed with a non-zero exit. No secrets, no network calls that the ticket does not ask for.
8. **Beta and stable bar** (components only, E17-14): a component claiming beta or stable must meet the bar the ticket states (the ticket cites E17-14); if the ticket does not state it, ask the author for it; otherwise the component stays draft.
9. **Scope.** Nothing outside `filesTouched`; no package, repo or import rename (the Texo cutover is E15).

## Severities
- **blocker**: a criterion is not met, ownership is violated, a test is skipped or weakened, a fail-open or security hole, or the change breaks the build.
- **major**: wrong or unproven behavior the ticket depends on, a claim not supported by a test, a contradiction with an ADR or another document.
- **minor**: clarity, naming, small robustness, test hygiene.

## Output
Post one PR review comment with this template, then stop:

```
Review of PR <n> for PLRNUI-<n> (<local id>), head <sha>.

Acceptance:
- [x] <criterion> - <evidence>
- [ ] <criterion> - <why not>

BLOCKER
- <file:line> <finding> - fails when <input>
(or: none)

MAJOR
- ...
(or: none)

MINOR
- ...
(or: none)

VERDICT: PASS | FAIL
```

FAIL if there is any blocker or any unresolved major. PASS otherwise, with the minors listed. After the author's fixes, a new fresh review repeats on the new head.
