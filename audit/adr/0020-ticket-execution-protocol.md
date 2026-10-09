# ADR 0020: Jira-driven ticket execution protocol

## Status

Accepted (PO decisions 2026-10-09, P1/P3 and round 2 item 6)

## Context

No harness is built (too heavy, budget 0). Execution uses targeted prompts and skills, with Jira as the work queue. Without a written protocol every session re-derives the rules and spends tokens.

## Decision

One session executes one ticket, with minimal context, following this page. Starter prompts and skills link to this ADR.

## Selection

- Ready queue (JQL):
  `project = PLRNUI AND labels = "texo-v1" AND labels = "po-approved" AND labels = "ready" AND statusCategory != Done`
  Practical rule: pick the lowest wave among tickets with labels `po-approved` and `ready` whose Blocks-dependencies are already merged into `texo/v1`.
- If `po-approved` is missing, stop and report to the PO. Never add it.
- The ticket body is read from the repo backlog JSON (`audit/texo-v1/backlog/E*.json`, local id via `audit/texo-v1/jira-map.json`), not from the Jira description (Jira markdown alters some characters).

## Branching

- One branch per ticket: `texo/PLRNUI-<n>-<slug>`, created from `texo/v1`.
- Touch only the files in the ticket `filesTouched`.
- Commit messages: `add(PLRNUI-<n>): ...`, `fix(PLRNUI-<n>): ...` or `chore(PLRNUI-<n>): ...`.
- Open a PR to `texo/v1` with the acceptance-criteria checklist. Merge into `texo/v1` only with green CI (job `package-baseline`) and a passing independent review.
- Merging `texo/v1` into `main` belongs to the PO.
- After merge, post ONE Jira comment with evidence (commands, exit codes, files, PR link). Do not change the ticket status.

## Token economy

- Read only the files owned by the ticket and the ADR ids it names.
- No repo-wide exploration.
- Run the ticket `validation` commands; at most 3 attempts, then stop and report the cause.

## Roles

- Author session: implements, validates, commits, opens the PR.
- Reviewer session (separate, empty context, see E18-08): receives only ticket, diff and acceptance criteria; returns blocker/major/minor and a verdict. Blockers are fixed by the author and the review repeated.

## Forbidden actions

- Applying `po-approved` or changing the PO gate.
- Publishing to npm, creating tags or Releases.
- Pushing or merging `main`: `main` is never pushed or merged by a session.
- Skipping or disabling tests.
- Editing files outside `filesTouched`.
- Renaming package, repo or imports (the Texo cutover is E15).
