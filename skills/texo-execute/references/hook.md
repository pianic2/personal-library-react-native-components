Execute Jira {ticket}. Read the body ONLY from audit/texo-v1/backlog/*.json (local id via jira-map.json), never from the Jira description.
Branch texo/{ticket}-<slug> from texo/v1. Owned files (touch nothing else): {owned_files}
ADRs to read: {adr_ids}. No repo-wide exploration.
Class: hook. Export the hook and its types from the owned files only. Cover mount, update, unmount and cleanup in the owned test. No side effects at import time; no new runtime dependency.

Validation (run all): {validation}
Stop rule: {stop_rule}
Evidence: {evidence}
Commit as add|fix|chore({ticket}): <message>. Never apply po-approved, publish, tag, touch main, skip tests, or rename package/repo/imports.
