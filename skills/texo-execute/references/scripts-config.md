Execute Jira {ticket}. Read the body ONLY from audit/texo-v1/backlog/*.json (local id via jira-map.json), never from the Jira description.
Branch texo/{ticket}-<slug> from texo/v1. Owned files (touch nothing else): {owned_files}
ADRs to read: {adr_ids}. No repo-wide exploration.
Class: scripts/config. Keep scripts dependency-free ESM, deterministic and fail-closed (non-zero exit on any error or unexpected input). Config changes must not weaken existing checks. Run the script once on a passing and once on a failing input.

Validation (run all): {validation}
Stop rule: {stop_rule}
Evidence: {evidence}
Commit as add|fix|chore({ticket}): <message>. Never apply po-approved, change the Jira status, post more than one Jira comment, publish, tag, touch main, skip tests, or rename package/repo/imports.
