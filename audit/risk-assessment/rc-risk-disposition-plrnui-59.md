# PLRNUI-59 - RC Risk Disposition Record

## Scope

This record closes the PLRNUI-12 AC#1 formal gap for RC-hardening entry by
recording an explicit disposition for Risk Assessments 0001 through 0008.

This is a governance record only. It does not change runtime source, package
metadata, lockfile state, Jira state, Confluence publication state or RC
artifact state.

## Executive Disposition

Current RC state:

- **CONDITIONAL GO to enter PLRNUI-41 hardening.**
- **NO-GO to cut/publish an RC artifact until mandatory gates and residual
  publication decisions close.**

Risk dispositions below are scoped to PLRNUI-59 and repository evidence. They do
not imply that Jira was transitioned or Confluence was published.

## Disposition Table

| RA ID | Title | Severity | Prior status | PLRNUI-59 disposition | Evidence | Remaining action |
| --- | --- | --- | --- | --- | --- | --- |
| RA 0001 | Package rename and legacy alias risk | High | `Proposto` | **MITIGATED for RC-hardening entry** | `package.json` declares `@personal-library/react-native-components`; `README.md` uses the canonical package target; `audit/migration/breaking-change-register.md` BC-001 is now `verified`; PLRNUI-45/46/58 evidence records packed-artifact consumer use through the canonical root package. | Keep legacy names confined to historical/migration evidence; do not reintroduce public aliases without owner-approved deprecation policy. |
| RA 0002 | Public API and deep import risk | High | `Proposto` | **TRACKED CONDITION** | `package.json` exposes only `"."` and `"./package.json"`; `src/index.ts` is an explicit named root surface; `audit/api/internal-experimental-export-fencing-plrnui-26.md` records `cn` / `useIsMounted` root fencing and experimental root export posture; PLRNUI-46/58 use root imports only. | Human review items in `audit/api/export-matrix.md` remain open; experimental root exports must stay labeled and not be promoted silently. |
| RA 0003 | Component stability misclassification risk | High | `Proposto` | **TRACKED CONDITION** | `README.md` states no component/API is currently `stable`; `audit/api/export-matrix.md` and PLRNUI-12 review record beta/experimental/internal posture and matrix drift. | Keep `stable` at zero until promotion gates, docs, support matrix and runtime/accessibility proof exist; reconcile maturity matrix drift in PLRNUI-60 / PLRNUI-41 as needed. |
| RA 0004 | Theme token regression risk | High | `Proposto` | **MITIGATED for RC-hardening entry** | PLRNUI-12 review records light/dark and nested override evidence; `audit/migration/breaking-change-register.md` records BC-009 and BC-010 as implemented; theme persistence remains adapter-based and disabled by default. | Continue hardening component token coverage before stable promotion; do not treat optional persistence as native storage proof. |
| RA 0005 | Expo native dependency risk | High | `Proposto` | **TRACKED CONDITION / ACCEPTED RESIDUAL FOR HARDENING ENTRY ONLY** | `package.json` has no runtime `dependencies`; `audit/release/native-runtime-validation.md` states Expo web/Metro is proven but Expo Go, native device runtime, prebuild and custom dev client remain unproven; PLRNUI-58 proves Expo web/Metro export only. | Not accepted for RC artifact publication. Owner must close PLRNUI-60 / PLRNUI-41 decision by either validating native runtime paths or explicitly accepting/scheduling the residual before RC artifact cut. |
| RA 0006 | Packaging and consumer installation risk | Critical | `Proposto` | **MITIGATED** | PLRNUI-12 review records fresh PASS for `typecheck`, `test`, `build`, `package:dry-run`, `consumer:smoke` and `consumer:expo`; PLRNUI-46 verifies packed-artifact root import/type/render smoke; PLRNUI-58 verifies Expo/Metro web export. | Re-run release validation on Node >=22 before artifact cut; do not publish while package version remains `0.0.0`. |
| RA 0007 | Documentation drift risk | High | `Proposto` | **TRACKED CONDITION** | README and consumer docs/examples use canonical root imports; PLRNUI-12 review records docs remediation plus residual README/matrix drift; PLRNUI-57/49/50/52/54 evidence is reflected in release docs. | Keep repository audit docs as technical source and Confluence as publication layer; reconcile remaining README/maturity matrix drift under PLRNUI-60 / PLRNUI-41. |
| RA 0008 | Breaking change governance risk | High | `Proposto` | **TRACKED CONDITION** | `audit/migration/migration-changelog.md` is current through PLRNUI-58; PLRNUI-59 fixes the duplicate breaking-change ID and stale BC statuses; BC-008 remains the active release gate. | Do not cut/publish RC until the PLRNUI-59 report, ADR annotations, Jira comments and Confluence-ready summary are reviewed and external publication decisions are made. |

## Publication Gate

The above dispositions are enough to enter PLRNUI-41 hardening because the
runtime/package gates have current passing evidence and the remaining gaps are
tracked governance or native-runtime residuals.

They are **not** enough to publish an RC artifact. RC artifact publication stays
blocked until:

- PLRNUI-60 / PLRNUI-41 closes the native runtime residual for RA 0005.
- The real RC version is assigned before tag/publish; `0.0.0` is not a
  publishable RC version.
- Jira and Confluence linkage/publication decisions are completed by the owner.
- Release validation is re-run on a Node runtime satisfying `engines.node >=22`.

## Source-of-truth Policy

- Repository audit docs are the primary technical source of truth.
- Confluence is the publication and summary layer.
- Jira is the workflow and decision tracking layer.

No Jira transition, Confluence publication or RC artifact publication was
performed by PLRNUI-59.
