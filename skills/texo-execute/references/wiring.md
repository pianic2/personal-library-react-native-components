Execute Jira {ticket}. Read the body ONLY from audit/texo-v1/backlog/*.json (local id via jira-map.json), never from the Jira description.
Branch texo/{ticket}-<slug> from texo/v1. Owned files (touch nothing else): {owned_files}
ADRs to read: {adr_ids}. No repo-wide exploration.
Class: wiring. Change only the glue named in the owned files (exports, providers, adapters, app shell). Run the public API snapshot and the package checks named in validation; any API diff must match the acceptance criteria exactly.

Validation (run all): {validation}
Stop rule: {stop_rule}
Evidence: {evidence}
Commit as add|fix|chore({ticket}): <message>. Never apply po-approved, publish, tag, touch main, skip tests, or rename package/repo/imports.
