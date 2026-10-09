Execute Jira {ticket}. Read the body ONLY from audit/texo-v1/backlog/*.json (local id via jira-map.json), never from the Jira description.
Branch texo/{ticket}-<slug> from texo/v1. Owned files (touch nothing else): {owned_files}
ADRs to read: {adr_ids}. No repo-wide exploration.
Class: component. Follow the theme/tokens rules and the maturity bar; no hex/rgba colors, no new public export unless owned. Add or extend the component test and the example entry only if they are owned files. Verify accessibility props named in the acceptance criteria.

Validation (run all): {validation}
Stop rule: {stop_rule}
Evidence: {evidence}
Commit as add|fix|chore({ticket}): <message>. Never apply po-approved, change the Jira status, post more than one Jira comment, publish, tag, touch main, skip tests, or rename package/repo/imports.
