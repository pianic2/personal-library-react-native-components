# Contributing

This repository is managed through PLRNUI tickets. Keep changes narrow and
traceable to the issue that authorizes them.

## Policies

- Do not migrate runtime source without audit evidence.
- Do not stabilize public API without a Jira issue.
- Do not add a legacy package alias without an explicit owner decision.
- Legacy references in audit files are allowed only as historical or governance
  evidence.
- Do not commit generated artifacts unless the ticket explicitly justifies them.
- Package, API, component, documentation, migration, and release changes must
  remain ticket-driven.

Every change must pass:

```sh
npm ci
npm run typecheck
npm run build
npm run package:dry-run
npm run release:check
```

## Audit Policy

`audit/` can preserve historical references for traceability. Audit files must
not become runtime source, must not be published as package API, and should cite
related PLRNUI issues when possible.

Mentioning a component, token, import path, or legacy package name in `audit/`
does not promote it to source code or public API.
