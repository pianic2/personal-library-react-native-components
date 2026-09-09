# PLRNUI-59 - RC Risk Disposition Record

## Scope

This record closes the PLRNUI-12 AC#1 formal gap for RC-hardening entry by
recording an explicit disposition for Risk Assessments 0001 through 0008.

This is a governance record only. It does not by itself authorize an npm
publication, Git tag or GitHub Release.

## Executive Disposition

Current RC state after PLRNUI-62:

- **RA 0005 / G9 is closed for the selected `0.1.0-rc.1` support boundary by explicit owner acceptance.**
- **RC publication itself remains blocked by the remaining publication-preparation gates owned by PLRNUI-63 / PLRNUI-61.**

Risk dispositions below are scoped to repository evidence and the first RC.
They do not silently broaden the native support claim.

## Disposition Table

| RA ID | Title | Severity | Prior status | Current disposition | Evidence | Remaining action |
| --- | --- | --- | --- | --- | --- | --- |
| RA 0001 | Package rename and legacy alias risk | High | `Proposto` | **MITIGATED for RC-hardening entry** | `package.json` declares `@personal-library/react-native-components`; `README.md` uses the canonical package target; `audit/migration/breaking-change-register.md` BC-001 is now `verified`; PLRNUI-45/46/58 evidence records packed-artifact consumer use through the canonical root package. | Keep legacy names confined to historical/migration evidence; do not reintroduce public aliases without owner-approved deprecation policy. |
| RA 0002 | Public API and deep import risk | High | `Proposto` | **TRACKED CONDITION** | `package.json` exposes only `"."` and `"./package.json"`; `src/index.ts` is an explicit named root surface; `audit/api/internal-experimental-export-fencing-plrnui-26.md` records `cn` / `useIsMounted` root fencing and experimental root export posture; PLRNUI-46/58 use root imports only. | Human review items in `audit/api/export-matrix.md` remain open; experimental root exports must stay labeled and not be promoted silently. |
| RA 0003 | Component stability misclassification risk | High | `Proposto` | **TRACKED CONDITION** | `README.md` states no component/API is currently `stable`; `audit/api/export-matrix.md` and PLRNUI-12 review record beta/experimental/internal posture and matrix drift. | Keep `stable` at zero until promotion gates, docs, support matrix and runtime/accessibility proof exist; reconcile maturity matrix drift as needed. |
| RA 0004 | Theme token regression risk | High | `Proposto` | **MITIGATED for RC-hardening entry** | PLRNUI-12 review records light/dark and nested override evidence; `audit/migration/breaking-change-register.md` records BC-009 and BC-010 as implemented; theme persistence remains adapter-based and disabled by default. | Continue hardening component token coverage before stable promotion; do not treat optional persistence as native storage proof. |
| RA 0005 | Expo native dependency risk | High | `Proposto` | **OWNER-ACCEPTED RESIDUAL FOR `0.1.0-rc.1` / PUBLICATION BLOCKER CLOSED FOR SELECTED SUPPORT BOUNDARY** | PLRNUI-64 establishes Expo `57.0.21`, React `19.2.3`, RN `0.86.3` compatibility; PLRNUI-62 records a real-device Expo Go Android PASS, a stateful Input/Button/theme probe, clean packed/Expo consumer preflight, and explicit owner residual acceptance for unvalidated native Android/iOS paths. The package still has no runtime `dependencies` or package-owned native modules. | Do not describe native Android/iOS as validated PASS. Reopen RA 0005 if the RC support boundary is broadened, package-owned native dependencies are added, or prebuild/custom-dev-client support is claimed. |
| RA 0006 | Packaging and consumer installation risk | Critical | `Proposto` | **MITIGATED** | PLRNUI-62 final evidence reruns Node-supported `npm ci`, typecheck, 74-test suite, build, package inspection, packed consumer smoke and Expo SDK 57 consumer preflight. | PLRNUI-63 must assign the real RC version and rerun publication gates on the final versioned artifact; `0.0.0` remains non-publishable. |
| RA 0007 | Documentation drift risk | High | `Proposto` | **TRACKED CONDITION** | README and consumer docs/examples use canonical root imports; PLRNUI-12 review records docs remediation plus residual README/matrix drift; PLRNUI-57/49/50/52/54 evidence is reflected in release docs. | Keep repository audit docs as technical source and Confluence as publication layer; reconcile remaining release wording in PLRNUI-63. |
| RA 0008 | Breaking change governance risk | High | `Proposto` | **TRACKED CONDITION** | `audit/migration/migration-changelog.md` is current through PLRNUI-58; PLRNUI-59 fixes the duplicate breaking-change ID and stale BC statuses; BC-008 remains the active release gate. | Do not publish until PLRNUI-63 completes final release/version/authentication/provenance governance and PLRNUI-61 grants publication authorization. |

## PLRNUI-62 Native Support Boundary

For proposed first RC `0.1.0-rc.1`:

- **Expo Go Android on Expo SDK 57 / RN 0.86.3: PASS / maintainer approved.**
- **Native Android outside the Expo Go proof path: OWNER-ACCEPTED RESIDUAL, not validated PASS.**
- **Native iOS: OWNER-ACCEPTED RESIDUAL, not validated PASS.**
- **Prebuild: N/A to the selected first-RC claim; no package-owned native module requires it.**
- **Custom dev client: N/A to the selected first-RC claim.**
- **EAS build: N/A to the current publication plan.**

The residual acceptance is intentionally narrow. Any future claim that expands
those lanes requires new runtime evidence and a reopened RA 0005 disposition.

## Publication Gate

PLRNUI-62 closes the native-runtime publication blocker represented by RA 0005
for the support boundary above. This closure does **not** authorize publication.

RC artifact publication remains blocked until at least:

- PLRNUI-63 assigns and validates the real RC version; `0.0.0` is not a
  publishable RC version.
- PLRNUI-63 closes CI, npm ownership/authentication, publish metadata, dist-tag,
  provenance and final artifact governance.
- PLRNUI-61 reviews the consolidated evidence and explicitly grants the final
  publication authorization.

## Source-of-truth Policy

- Repository audit docs are the primary technical source of truth.
- Confluence is the publication and summary layer.
- Jira is the workflow and decision tracking layer.

PLRNUI-62 does not perform an npm publish, RC tag or GitHub Release.
