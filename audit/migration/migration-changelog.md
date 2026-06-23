# Migration Changelog - PLRNUI-10

This changelog tracks migration governance from AURA / UI Experience and historical `@aura/ui` package metadata toward:

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
- Added PLRNUI-37 safe-area provider dependency contract documentation: `ThemeProvider` consumers must install `react-native-safe-area-context` as a required peer while safe-area behavior remains enabled by default.
- Added PLRNUI-39 clipboard dependency strategy: clipboard support is optional, adapter-based and consumer-owned; `expo-clipboard` is not a core package runtime dependency or root peer dependency.
- Added PLRNUI-44 native dependency governance consolidation: current package metadata has no runtime `dependencies`, keeps `react` / `react-native` as peers, keeps `typescript` dev-only, keeps AsyncStorage and Clipboard consumer-owned, and leaves Safe Area under the approved PLRNUI-37 contract.
- Added PLRNUI-45 package entrypoint reconciliation: canonical package name, `main`, `module`, `types`, root `exports`, `files`, current `dist` output and root import are aligned for the current package surface.
- Added PLRNUI-21 component blocker remediation evidence for `Card`, `ProgressBar`, `CodeInline`, `Textarea` and `PasswordInput`, including smoke/render harness coverage.
- Added PLRNUI-22 navigation component public API integration for `TopBar`, `BottomBar`, `NavBar`, `Link`, `NavContext` and `SideBar`, with local component barrels, root exports, smoke coverage and `audit/components/navigation-platform-contract-plrnui-22.md`.

### Changed

- Clarified that current migration state remains governance/proposed for broader API/docs work, while current package metadata is canonical and aligned to `dist`.
- PLRNUI-42 aligned `peerDependencies.react` to `>=19.2.3 <20.0.0` using the latest stable Expo SDK baseline: Expo SDK `56.0.0`, React Native `0.85`, React `19.2.3`, and Node minimum `22.13.x`.
- PLRNUI-43 confirmed `peerDependencies.react-native` as `>=0.85.0 <0.86.0`, aligned to the approved Expo SDK `56.0.0` / React Native `0.85.x` baseline.
- Clarified that AURA / UI Experience are historical or deprecated names, while `personal-library-react-native-components` is the recommended project identity.
- Clarified that `@personal-library/react-native-components` is current package metadata; `@aura/ui` remains historical audit/consumer-smoke evidence and must not be reintroduced as a legacy alias.
- Clarified that root public API governance is based on PLRNUI-4 export analysis: 92 exports analyzed, with 40 public, 32 experimental, 18 internal and 2 deprecated.
- Clarified that no current subpath exports are implemented and any future subpath policy must be verified through package metadata and consumer smoke tests.
- Clarified that docs/demo imports using legacy `from "AURA"` or repo-relative `../../index` paths are not proof of valid consumer API.
- Clarified that `react-native-safe-area-context` is not optional under the current `ThemeProvider` contract and must be validated against the selected Expo/RN baseline.
- Clarified that PLRNUI-39 is a governance/dependency decision only and does not declare a breaking change while clipboard remains opt-in and package metadata is unchanged.
- Clarified that PLRNUI-44 does not implement `ThemeStorageAdapter`, does not add native dependencies, does not change the approved Expo/RN baseline, and does not create the PLRNUI-46 Expo consumer smoke test.
- Clarified that PLRNUI-45 does not add subpath exports, does not broaden the public API, and does not create the PLRNUI-46 Expo consumer smoke test.
- Clarified that PLRNUI-21 moves the five remediated components at most to `beta`; `stable` remains blocked by ADR 0003/0007 stable gates.
- Clarified that PLRNUI-22 intentionally broadens the root API for the approved navigation components without adding package subpath exports, dependencies, drawer/gesture behavior, overflow menus or router-specific integrations.

### PLRNUI-16 - Token export naming decision

Defined canonical token export naming policy.

AURA-branded token names are deprecated legacy names and are removed from the future API contract.

Replacement target:

- `themeTokens`
- `getThemeTokens`, only if accessor semantics are required.

No AURA compatibility aliases will be introduced.

Implementation cleanup and breaking-change tracking are deferred to PLRNUI-29.
Consumer-facing documentation policy is deferred to PLRNUI-53.

### Deprecated

- Deprecated AURA / UI Experience as canonical project or package identity for new technical artifacts.
- Deprecated legacy package/import naming such as `@aura/ui` and `from "AURA"` unless retained under an explicit alias policy.
- Deprecated AURA token names `auraTokens` and `getAuraTokens` with no compatibility aliases.
- Deprecated unsupported consumer guidance based on deep imports, repo-relative imports or internal source/build paths.
- Deprecated treating beta, experimental or internal API as stable without promotion evidence.

### Removed

- No source code, package metadata, public exports, dependency declarations, build config or real docs were removed in PLRNUI-10.
- No legacy alias was removed by this governance update.

### Blockers

- PLRNUI-8 verdict remains **NOT READY**.
- Historical PLRNUI-8 clean Expo consumer install failed with `ERESOLVE` because the consumer used `react@19.2.3`, while `@aura/ui@1.0.0` required peer `react@^19.2.4`; PLRNUI-42 updates current package metadata to accept React `19.2.3`.
- Root import, TypeScript consumer import, Metro resolution and native runtime smoke could not proceed after the PLRNUI-8 install failure.
- React Native peer package metadata is aligned by PLRNUI-43; clean consumer duplicate React/RN proof remains deferred to PLRNUI-46.
- Native/native-adjacent dependency policy is consolidated by PLRNUI-44 for the current package state; any future native dependency introduction remains blocked by the native dependency gate and PLRNUI-46 consumer validation.
- Package entrypoint metadata is aligned by PLRNUI-45; clean consumer resolver/import proof remains deferred to PLRNUI-46.
- PLRNUI-21 component blockers are remediated for the five targeted components, but stable promotion remains blocked by docs/platform/support and consumer evidence requirements.
- PLRNUI-22 navigation blockers are remediated for the targeted components, but stable promotion remains blocked by docs/platform/support, accessibility and consumer evidence requirements.
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
| PLRNUI-7 | Dependencies | Peer dependency and native dependency gates are defined as governance requirements; PLRNUI-44 consolidates the current package state. | Peer policy review, native gate checklist, PLRNUI-46 smoke coverage. |
| PLRNUI-8 | Release smoke | Build/typecheck/pack pass; historical clean Expo install failed on React peer mismatch; PLRNUI-42 aligns current React peer metadata. | Clean Expo install/import/runtime smoke must pass before RC readiness. |
| PLRNUI-9 | Docs/demo | Docs/demo still use legacy naming/imports and preview web is not real Expo/RN runtime proof. | Docs/demo import cleanup and consumer-facing examples using public API. |
| PLRNUI-10 | Governance | Register and changelog updated as release gates. | Pre-RC register/changelog review required. |

### Release Readiness Notes

- Current release readiness remains **NOT READY** because clean Expo consumer validation must be regenerated after PLRNUI-42 and other release gates remain open.
- A release candidate must not proceed until this changelog and `audit/migration/breaking-change-register.md` reflect all known breaking changes.
- The current package target is `@personal-library/react-native-components`; current repository evidence still includes historical `@aura/ui` audit/smoke references and legacy docs imports.
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
