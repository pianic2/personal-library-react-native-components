Execute Jira {ticket}. Read the body ONLY from audit/texo-v1/backlog/*.json (local id via jira-map.json), never from the Jira description.
Branch texo/{ticket}-<slug> from texo/v1. Owned files (touch nothing else): {owned_files}
ADRs to read: {adr_ids}. No repo-wide exploration.
Class: docs/adr. Write or edit only the owned markdown. Follow the existing ADR layout (Status, Context, Decision). Every acceptance criterion must be checkable with grep; quote the grep in the PR checklist. No code changes.

Validation (run all): {validation}
Stop rule: {stop_rule}
Evidence: {evidence}
Commit as add|fix|chore({ticket}): <message>. Never apply po-approved, change the Jira status, post more than one Jira comment, publish, tag, touch main, skip tests, or rename package/repo/imports.
