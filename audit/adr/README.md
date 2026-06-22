# ADRs

Architecture Decision Records capture explicit technical decisions for PLRNUI.

## Naming

Use zero-padded numeric prefixes and short kebab-case titles:

```text
0001-short-title.md
0002-short-title.md
```

## Status

Allowed statuses:

- Proposed
- Accepted
- Superseded
- Deprecated

## Template

```md
# Title

Status: Proposed

## Context

## Decision

## Consequences

## Related Jira issues
```

No architectural decision is implicit without a related ADR or Jira issue.

Imported or copied ADRs must preserve traceability. ADRs with legacy references
are allowed when they describe historical decisions, migration context, or
legacy cleanup policy.
