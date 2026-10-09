---
name: texo-execute
description: Execute exactly one approved Texo V1 Jira ticket (PLRNUI-n) with minimal context, following ADR 0020. Use when asked to "execute PLRNUI-n" or to work the next ticket from the ready queue. Reads the ticket body from the repo backlog JSON, creates the branch texo/PLRNUI-n-slug from texo/v1, touches only the owned files, runs the ticket validation, opens a PR to texo/v1 and posts one evidence comment on Jira. Never changes ticket status or applies po-approved.
---

# texo-execute

Protocol: `audit/adr/0020-ticket-execution-protocol.md` (read it once; do not re-derive it).

## Steps
1. **Gate.** Queue: JQL set in `docs/policies/jql.md` (ready queue, by wave, blocked), rules in ADR 0020 (Selection), skipping tickets already in the `STATE.md` Execution log. On Jira check the labels `po-approved` and `ready`. If `po-approved` is missing, stop and tell the PO. Never add it.
2. **Read the ticket** from `audit/texo-v1/backlog/E*.json` (local id from `audit/texo-v1/jira-map.json`). Do NOT use the Jira description: its markdown alters some characters.
3. **Dependencies.** Every id in `dependencies` must already be merged into `texo/v1` (check `STATE.md` Execution log or the PR list). Otherwise stop and report.
4. **Branch** `texo/PLRNUI-<n>-<slug>` from `texo/v1`. Touch only `filesTouched` (exception: your row in the `STATE.md` Execution log).
5. **Pick the template**: map the ticket labels with `references/class-map.json` and fill `references/<class>.md` (placeholders `{ticket}`, `{owned_files}`, `{adr_ids}`, `{validation}`, `{stop_rule}`, `{evidence}`). Use the first label (in ticket order) that maps; if none maps, stop and ask the PO instead of guessing.
6. **Implement, then run every `validation` command.** At most 3 attempts; then stop and report the cause. Never skip or disable a test.
7. **Commit** `add|fix|chore(PLRNUI-<n>): ...`, push, open a PR to `texo/v1` with the acceptance-criteria checklist.
8. **Independent review**: a separate session with empty context receives only ticket, diff and acceptance criteria (skill `texo-review` when available) and returns blocker/major/minor and a verdict. Fix blockers and repeat.
9. **Before merging**, commit your `STATE.md` Execution log row on the ticket branch (ADR 0020 Branching). **Merge** into `texo/v1` only when every configured check is green and the review passed. Then post ONE Jira comment with evidence (commands, exit codes, files, PR link) using `docs/policies/evidence-template.md`.

## Never
Apply `po-approved`, transition a ticket to Approvato or change its Jira status in any way, publish to npm, create tags or Releases, push or merge `main`, skip tests, edit files outside `filesTouched`, rename package/repo/imports.

## Check
`node skills/texo-execute/scripts/check-skill.mjs` verifies frontmatter, template size and placeholders, and label coverage.
