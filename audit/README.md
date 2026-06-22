# Audit

`audit/` contains governance evidence and migration evidence for PLRNUI.

This directory can include artifacts imported from previous PLRNUI work:
analysis reports, ADRs, registers, risk assessments, package checks, release
readiness notes, and migration records.

`audit/` is not runtime source, is not consumer-facing documentation, and is not
package API. It guides future ticket-driven decisions.

Legacy references inside `audit/` are allowed only as historical evidence or
governance traceability. A component, API, token, or import path is not promoted
only because it appears in an audit file.

## Structure

- `adr/`: architecture decision records.
- `api/`: public API, export, and deep-import analysis.
- `components/`: component inventory, maturity, and promotion evidence.
- `dependencies/`: dependency, native module, and peer policy evidence.
- `docs/`: documentation and example-app audit evidence.
- `migration/`: breaking-change, legacy naming, and migration registers.
- `release/`: package, install, runtime, and release readiness evidence.

Additional governance folders can exist when imported from prior PLRNUI work,
such as backlog, risk assessment, or theme evidence.

## Rules

Each audit file should cite the source PLRNUI issue when possible.

No component is promoted only because it is cited in `audit/`.

No API is stabilized only because it is cited in `audit/`.

Real migration remains governed by PLRNUI-18 and later tickets.
