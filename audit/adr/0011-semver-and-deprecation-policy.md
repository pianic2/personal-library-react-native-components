# ADR 0011: Semver, API stability and deprecation policy

## Status

Proposed. The policy below applies the decisions already recorded in `audit/texo-v1/DECISIONS.md` (D1 numbering, D14 deprecations, H4 deprecation windows: aliases stay through 1.x and the legacy shim sunset is 12 months, H6 launch as 1.0.0). It becomes Accepted when the product owner confirms it. Open: the calendar start of the 12-month shim sunset and the exact removal dates are set by the release plan (E17), not by this ADR.

## Context

ADR 0002 says a stable export follows semantic versioning and defines when an export is public; ADR 0003 classifies components (`stable`, `beta`, `experimental`, `internal`, `deprecated`); ADR 0008 lists what counts as a breaking change but leaves the version policy, the deprecation window and the 1.0.0 criteria open. `docs/migration.md` still says no component is stable.

## Decision

The consumer-facing text lives in three pages; this ADR is the decision record:

- `docs/policies/versioning.md`: what the public API is, what is breaking, version bumps, examples.
- `docs/policies/stability.md`: stability labels, the mapping from the maturity ladder, the exemptions for `beta` and `experimental`.
- `docs/policies/deprecation.md`: how an API is deprecated and removed.

Summary of the rules:

1. **Public API** is what is reachable through the documented entry points (the root entry and the subpaths listed in the export contract), the props and prop types of exported components, the theme contract and public tokens, and documented accessibility behavior. Anything else is internal and may change in any release (ADR 0002).
2. **Breaking** changes (major for `stable`): removing or renaming an export or subpath, narrowing a prop type or making a prop required, renaming or removing a token or changing its type, changing an accessibility role or state that assistive technology announces, tightening a peer range, raising the minimum Node, Expo or React Native floor.
3. **Versions** follow semver for the `stable` set: patch for compatible fixes, minor for compatible additions (including deprecations), major for breaking changes.
4. **Exemptions**: `beta` may change in a minor release with a release note and a migration note; `experimental` may change or disappear in any release; `internal` has no guarantee.
5. **Maturity ladder mapping** (see ADR 0003 for the labels): `prototype` maps to `experimental`; `demo` maps to `experimental`, or to `beta` once the component is publicly exported and documented (a deliberate refinement of the plain mapping, consistent with ADR 0003); `stable` and `production-ready` are semver-covered. `beta` is the label for a publicly exported component that passed the demo bar and is not yet promoted.
6. **Deprecation**: mark with a JSDoc `@deprecated` tag, no runtime warning, document it, keep it for at least one minor release and at least 6 months, and remove it only in a major release. Deprecated aliases stay through 1.x (H4); the legacy shim follows ADR 0013 (12-month sunset window).
7. **1.0.0 criteria**: the stable set is non-empty and listed; the public API snapshots are committed and checked (`npm run api:snapshot:check`); the support matrix is verified: `npm run docs:compat:check` passes, and `docs/compatibility.md` (generated from `config/compatibility.json`, which requires evidence for every entry and at least one `supported` entry) lists the Expo 57 / React Native 0.86 baseline of H4 as `supported`. Which versions beyond that baseline 1.0.0 supports remains an owner decision.

## Consequences

- Consumers know which parts are covered by semver and how long a deprecated API survives.
- Releases need a changelog/release note for every breaking, deprecation and `beta` change.
- A component cannot be called stable without the stable gate in `docs/platform-support.md`; the stable set is still empty today, so the 1.0.0 criteria are not met yet.
- The 6-month window is a minimum; a shorter removal needs a new ADR.

## Alternatives considered

| Alternative | Verdict | Reason |
| --- | --- | --- |
| Semver for every export | Rejected | Would freeze `beta` and `experimental` surfaces that are still being designed. |
| Runtime deprecation warnings | Rejected | The shim and ADR 0013 decided "no runtime noise"; JSDoc and docs are enough. |
| Remove deprecated APIs in a minor | Rejected | Removal is breaking by definition. |
| No fixed deprecation window | Rejected | Consumers cannot plan migrations. |

## References

- [ADR 0002: Public API Export Policy](0002-public-api-export-policy.md)
- [ADR 0003: Component Stability Classification](0003-component-stability-classification.md)
- [ADR 0008: Migration Governance and Breaking Change Policy](0008-migration-governance-and-breaking-change-policy.md)
- [ADR 0013: Legacy shim policy](0013-legacy-shim-policy.md)
- `audit/texo-v1/DECISIONS.md` D1, D14, H4, H6
