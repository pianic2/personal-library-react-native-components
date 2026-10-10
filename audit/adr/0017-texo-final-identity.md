# ADR 0017: Texo final identity

## Status

Accepted (2026-10-10). Decided by the product owner (pianic2) in chat on 2026-10-10: "Useremo come pacchetto npm @theopificium/texo". The repository name, the security contact and the license state below were recorded earlier as H1 in `audit/texo-v1/DECISIONS.md`.

This ADR supersedes the "package name: to be defined" part of ADR 0001. Nothing in this ADR renames the package, the repository or any import. The rename happens only at the cutover (E15-14).

## Context

ADR 0001 left the npm package name open. Every cutover step (identity config, codemod, README, publish of the shim, deprecation of the legacy package) depends on it. Bare `texo` is already taken on npm; the `@theopificium` scope is controlled by the product owner.

## Decision

| Item | Value |
| --- | --- |
| npm package | `@theopificium/texo` (scoped) |
| npm scope owner | the product owner (pianic2), who also owns the legacy `@personal-library` scope |
| GitHub repository | `theopificium/texo` |
| Security contact | info@theopificium.it |
| Legacy package | `@personal-library/react-native-components`, kept as a generated shim of Texo (ADR 0013) |
| Texo 1.0.0 | a **new package line** under the new name, not a version bump of the legacy name; the legacy package is republished as a shim in lockstep with Texo |
| Repository move | the product owner transfers/renames `pianic2/personal-library-react-native-components` to `theopificium/texo` at the cutover (E15-14); GitHub redirects the old URL |
| Codemod channel | out of scope here (H8) |
| License | not decided (currently MIT); tracked in E16-09 |

## Evidence

- `npm view @theopificium/texo version` returned `E404` on 2026-10-10 (the name is unclaimed). Bare `texo` exists on npm, so the unscoped name is not an option.
- Trademark: **not verified** by the executing agent (no tool for it). The product owner owns that check before the first publish.

## Consequences

- The name is written into `config/package-identity.json` (`target`) by the cutover tickets (E15-03/E15-14), not by this ADR.
- The unblocked tickets are E15-10, E15-13, E15-14 and E15-16. E16-01 (CODEOWNERS handle) and E16-09 (license) stay open.
- Until the cutover the repository, the package name and every import keep the legacy names.
