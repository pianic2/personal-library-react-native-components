# Migration Changelog - PLRNUI-10

This changelog tracks migration governance from AURA / UI Experience and current `@aura/ui` package metadata toward:

- repo/project identity: `personal-library-react-native-components`
- recommended package target: `@personal-library/react-native-components`

It is governance evidence only. It does not imply that package metadata, source imports, public exports, build configuration or real docs have already been changed.

## Unreleased

### Added

- Added PLRNUI-10 migration governance structure for release candidate review.
- Added explicit release gate: release candidate is blocked unless `audit/migration/breaking-change-register.md` and this changelog are updated.
- Added issue mapping for PLRNUI-3, PLRNUI-4, PLRNUI-5, PLRNUI-7, PLRNUI-8, PLRNUI-9 and PLRNUI-10.
- Added register coverage for package rename, legacy AURA naming, root API governance, deep import restriction, peer dependency compatibility, native dependency gate and stability-contract labeling.
- Added explicit reference to the recommended package target `@personal-library/react-native-components`.
- Added explicit reference to the recommended repo/project identity `personal-library-react-native-components`.
- Added clean Expo consumer install as mandatory verification before release readiness.

### Changed

- Clarified that current migration state remains governance/proposed until implementation tickets update source, package metadata, docs and build configuration.
- Clarified that AURA / UI Experience are historical or deprecated names, while `personal-library-react-native-components` is the recommended project identity.
- Clarified that `@aura/ui` is current package metadata and `@personal-library/react-native-components` is the recommended target package, not yet proven as applied.
- Clarified that root public API governance is based on PLRNUI-4 export analysis: 92 exports analyzed, with 40 public, 32 experimental, 18 internal and 2 deprecated.
- Clarified that no current subpath exports are implemented and any future subpath policy must be verified through package metadata and consumer smoke tests.
- Clarified that docs/demo imports using legacy `from "AURA"` or repo-relative `../../index` paths are not proof of valid consumer API.

### Deprecated

- Deprecated AURA / UI Experience as canonical project or package identity for new technical artifacts.
- Deprecated legacy public naming such as `@aura/ui`, `from "AURA"`, `auraTokens` and `getAuraTokens` unless retained under an explicit alias policy.
- Deprecated unsupported consumer guidance based on deep imports, repo-relative imports or internal source/build paths.
- Deprecated treating beta, experimental or internal API as stable without promotion evidence.

### Removed

- No source code, package metadata, public exports, dependency declarations, build config or real docs were removed in PLRNUI-10.
- No legacy alias was removed by this governance update.

### Blockers

- PLRNUI-8 verdict remains **NOT READY**.
- Clean Expo consumer install fails with `ERESOLVE` because the consumer uses `react@19.2.3`, while `@aura/ui@1.0.0` requires peer `react@^19.2.4`.
- Root import, TypeScript consumer import, Metro resolution and native runtime smoke could not proceed after the PLRNUI-8 install failure.
- `react-native` remains a package dependency in current metadata, creating unresolved duplicate React Native risk.
- Native/native-adjacent dependency policy remains unimplemented in package metadata.
- Docs/demo still contain legacy AURA imports and repo-relative imports according to PLRNUI-9 context and existing audits.
- Release candidate is blocked if the breaking change register is stale.

### Verification

Required before release readiness can become ready:

- `npm run typecheck`
- `npm run build`
- `npm pack --dry-run`
- Clean Expo TypeScript consumer app install of the packed artifact without `--force` or `--legacy-peer-deps`
- Root import from `@personal-library/react-native-components`
- TypeScript declaration resolution in the clean consumer
- Metro startup or equivalent consumer resolver verification
- Duplicate React/RN check in the consumer dependency tree
- Native dependency gate review for Expo Go, managed workflow, prebuild/custom dev client and bare RN impact
- Export matrix/root API approval and docs/demo import audit
- Pre-RC review confirming this changelog and `breaking-change-register.md` are current

PLRNUI-8 evidence already shows:

- `npm run typecheck`: passed
- `npm run build`: passed
- `npm pack --dry-run`: passed
- Clean Expo consumer install: failed with `ERESOLVE`
- Overall verdict: NOT READY

### Issue Mapping

| Issue | Area | Migration note | Verification / gate |
| --- | --- | --- | --- |
| PLRNUI-3 | Package/repo identity | Migrate from AURA / `@aura/ui` toward `personal-library-react-native-components` and `@personal-library/react-native-components`. | Legacy naming grep, package metadata audit, migration map update. |
| PLRNUI-4 | Public API | 92 exports analyzed; root API must be governed and no current subpath exports are implemented. | Export matrix approval, deep import audit, root API proposal. |
| PLRNUI-5 | Stability | Current API must not imply stable support; 0 stable context remains a release communication risk. | Component maturity matrix and docs/demo stability labels. |
| PLRNUI-7 | Dependencies | Peer dependency and native dependency gates are defined as governance requirements. | Peer policy review, native gate checklist, PLRNUI-8 smoke coverage. |
| PLRNUI-8 | Release smoke | Build/typecheck/pack pass; clean Expo install fails on React peer mismatch. | Clean Expo install/import/runtime smoke must pass before RC readiness. |
| PLRNUI-9 | Docs/demo | Docs/demo still use legacy naming/imports and preview web is not real Expo/RN runtime proof. | Docs/demo import cleanup and consumer-facing examples using public API. |
| PLRNUI-10 | Governance | Register and changelog updated as release gates. | Pre-RC register/changelog review required. |

### Release Readiness Notes

- Current release readiness remains **NOT READY** because PLRNUI-8 consumer validation is blocked by React peer mismatch.
- A release candidate must not proceed until this changelog and `audit/migration/breaking-change-register.md` reflect all known breaking changes.
- The recommended package target is `@personal-library/react-native-components`, but current repository evidence still includes `@aura/ui` metadata and legacy docs imports.
- Clean Expo consumer install is mandatory release evidence, not optional follow-up.
- Preview web validation is not sufficient proof for Expo/RN consumer runtime readiness.

## Historical Context

### PLRNUI-4 - Public API export matrix

- Produced API export matrix.
- Proposed root API contract.
- Proposed subpath exports.
- Audited deep imports.
- Listed public props/types candidates.
- Registered potential breaking changes.
- Human review required for ambiguous API classifications.

### Initial migration state

- ADR 0001: `react-native-components` as canonical project name; AURA / UI Experience as historical/deprecated naming.
- ADR 0002: public API through controlled entrypoints; deep imports are not guaranteed.
- ADR 0006: build/package/release require typecheck, build, pack, consumer install and import verification.
- ADR 0008: every breaking change requires motivation, consumer impact, migration path, Jira ticket, changelog note and verification.
- Risk Assessment 0008: release candidate must be blocked when breaking changes or consumer verification are not tracked.
