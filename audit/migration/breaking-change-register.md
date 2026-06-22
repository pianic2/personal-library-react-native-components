# Breaking Change Register - PLRNUI-10

## Scope

This register is the source of truth for migration breaking changes from the legacy AURA / UI Experience identity and current `@aura/ui` package metadata toward the recommended project identity `personal-library-react-native-components` and package target `@personal-library/react-native-components`.

It covers rename/package/API/dependency changes identified by ADR 0001, ADR 0002, ADR 0006, ADR 0008, Risk Assessment 0008, PLRNUI-3, PLRNUI-4, PLRNUI-7, PLRNUI-8 and existing audit artifacts.

No entry in this file changes source code, package metadata, public exports or dependency configuration. Entries document decisions, migration paths and release gates that must be satisfied before a release candidate.

## Release Gate Policy

- A release candidate is blocked unless this register is current for every package rename, legacy alias, public API, deep import, dependency, native dependency and stability-contract breaking change.
- Every confirmed breaking change must have a Jira source issue, motivation, consumer impact, migration path, verification requirement and changelog note.
- Legacy aliases may remain only with an explicit deprecation window and removal target.
- `npm run typecheck`, `npm run build`, `npm pack --dry-run` and a clean Expo consumer install/import smoke test are required before release readiness can be marked ready.
- PLRNUI-8 currently keeps release readiness blocked because clean Expo consumer install fails with `ERESOLVE`: the consumer has `react@19.2.3`, while `@aura/ui@1.0.0` requires peer `react@^19.2.4`.

## Breaking Change Template

Use this template for new or updated entries:

```md
### BC-XXX - Short title

- ID:
- Status:
- Category:
- Source issue:
- Related ADR / Risk Assessment:
- Decision:
- Motivation:
- Consumer impact:
- Migration path:
- Legacy alias policy:
- Deprecation window:
- Removal target:
- Verification required:
- Release blocking:
- Notes:
```

Allowed statuses:

- `candidate`: identified by audit or ADR, not implemented.
- `confirmed`: accepted as a breaking change and ready for implementation planning.
- `implemented`: implementation exists, verification still required.
- `verified`: implementation and consumer verification are complete.
- `not applicable`: explicitly closed with evidence.

## Mapping: Issue -> Decision -> Verification

| Source issue | Decision area | Current decision | Verification required | Release gate |
| --- | --- | --- | --- | --- |
| PLRNUI-3 | Package/repo identity and legacy naming | Target project identity is `personal-library-react-native-components`; target package is `@personal-library/react-native-components`; AURA names are legacy/deprecated. | Repository grep for legacy names, package metadata audit, migration guide review. | Blocks RC until package/docs/import identity is consistent or explicitly accepted as legacy. |
| PLRNUI-4 | Public API, root exports and deep imports | 92 exports analyzed: 40 public, 32 experimental, 18 internal, 2 deprecated; root API must be governed; no current subpath exports. | Export matrix approval, root API proposal approval, deep import audit closure. | Blocks RC if root API exposes unapproved internal/experimental contract. |
| PLRNUI-5 | Stability classification | No stable components; beta/experimental/internal labeling must not imply stable support. | Component maturity matrix and docs/demo stability labels. | Blocks RC if docs/demo present unstable APIs as stable. |
| PLRNUI-7 | Peer/native dependency policy | Host runtimes and native/native-adjacent packages require explicit peer/optional peer/native gate decisions. | Dependency classification, native dependency gate checklist and PLRNUI-8 smoke scenarios. | Blocks RC if dependency policy changes are not verified in consumer. |
| PLRNUI-8 | Build/package/consumer smoke | Typecheck, build and pack pass; clean Expo consumer install fails on React peer mismatch; verdict NOT READY. | Clean Expo install, root import, TypeScript resolution, Metro/runtime smoke, duplicate React/RN check. | Blocks RC until consumer verification passes or limitations are explicitly accepted. |
| PLRNUI-9 | Docs/demo migration readiness | Docs/demo still use legacy AURA imports and repo-relative demo imports; preview web is not Expo/RN runtime proof. | Docs/demo import audit, clean consumer examples, runtime smoke beyond preview web. | Blocks RC if docs/demo conflict with public API and package identity. |
| PLRNUI-10 | Breaking change governance | This register and migration changelog must be maintained as release gates. | Register/changelog review before RC. | Blocks RC if register or changelog is stale. |
| PLRNUI-16 | Token export naming | AURA-branded token exports are deprecated legacy names and removed from the future API contract; neutral theme-oriented naming is the target. | PLRNUI-29 cleanup/breaking-change tracking and PLRNUI-53 consumer docs policy. | Blocks RC if token naming remains ambiguous or legacy names are presented as stable. |

### PLRNUI-16 - Token export naming

Legacy token exports `auraTokens` and `getAuraTokens` are deprecated legacy names and are removed from the future API contract.

Replacement target:

- `themeTokens`
- `getThemeTokens`, if accessor semantics are required.

No compatibility aliases will be introduced for AURA-branded token names.

If these symbols existed in previous public package states, removal must be treated as intentional breaking cleanup.

## Entries

### BC-001 - Package rename `@aura/ui` -> `@personal-library/react-native-components`

- ID: BC-001
- Status: candidate
- Category: package rename
- Source issue: PLRNUI-3, PLRNUI-10
- Related ADR / Risk Assessment: ADR 0001, ADR 0006, ADR 0008, Risk Assessment 0008
- Decision: Recommended package target is `@personal-library/react-native-components`; current `package.json` still declares `@aura/ui`.
- Motivation: Package identity must align with the reusable React Native component library identity and avoid publishing the legacy AURA name as the canonical contract.
- Consumer impact: Consumers importing or installing `@aura/ui` must update install commands, import paths and package references once the rename is implemented.
- Migration path: Publish migration notes mapping `@aura/ui` to `@personal-library/react-native-components`; update consumer install docs and root imports after package metadata is changed in a dedicated ticket.
- Legacy alias policy: Optional compatibility alias may be kept only if explicitly approved; otherwise `@aura/ui` remains historical documentation only.
- Deprecation window: HUMAN REVIEW REQUIRED before implementation.
- Removal target: Before first release candidate under the new package identity, unless owner approves a documented compatibility release.
- Verification required: Package metadata audit, `npm pack --dry-run`, clean Expo consumer install of the packed artifact, root import smoke and docs import audit.
- Release blocking: Yes. RC is blocked if package identity is unresolved or register/changelog omit the rename.
- Notes: PLRNUI-8 evidence still uses `@aura/ui@1.0.0`; this is not evidence that the target package name has been applied.

### BC-002 - Legacy AURA naming deprecation/removal

- ID: BC-002
- Status: candidate
- Category: legacy naming
- Source issue: PLRNUI-3, PLRNUI-9, PLRNUI-10
- Related ADR / Risk Assessment: ADR 0001, ADR 0008, Risk Assessment 0008
- Decision: AURA and UI Experience are historical/deprecated names; new governance artifacts should use `personal-library-react-native-components` for repo/project identity and `@personal-library/react-native-components` for package target.
- Motivation: Legacy naming in docs, imports and token names creates ambiguity about the supported package identity and API contract.
- Consumer impact: Consumers using `auraTokens` or `getAuraTokens` must migrate to neutral token names with no AURA token compatibility alias. Consumers using `from "AURA"` or `@aura/ui` need updated imports or a separately approved package/import alias path.
- Migration path: Maintain `audit/migration/legacy-naming-map.md`; update docs/demo in a dedicated task; publish removal notes in changelog.
- Legacy alias policy: AURA token aliases are not allowed by PLRNUI-16. Any package/import legacy alias must be explicitly marked deprecated and mapped to replacement import paths.
- Deprecation window: HUMAN REVIEW REQUIRED; no silent removal.
- Removal target: Before stable release unless a compatibility window is approved.
- Verification required: Repository grep for `@aura/ui`, `from "AURA"`, `from 'AURA'`, `auraTokens`, `getAuraTokens` and docs/demo import review.
- Release blocking: Yes. RC is blocked if legacy public aliases remain without deprecation/removal policy.
- Notes: Existing grep shows `package.json` still declares `@aura/ui` and docs still contain many `from "AURA"` snippets.

### BC-003 - Root public API governance

- ID: BC-003
- Status: candidate
- Category: public API / root exports
- Source issue: PLRNUI-4, PLRNUI-5, PLRNUI-10
- Related ADR / Risk Assessment: ADR 0002, ADR 0006, ADR 0008, Risk Assessment 0008
- Decision: Root API must be intentional and reduced to approved public/beta symbols; internal, experimental and deprecated exports must not be treated as stable root contract.
- Motivation: Current broad barrel exports make internal or experimental modules appear public, which turns normal refactors into consumer breaking changes.
- Consumer impact: Consumers importing internal/experimental symbols from root may need to move to documented public APIs, explicit experimental paths or remove usage.
- Migration path: Approve export matrix, publish root API proposal, document any removed/moved root exports and provide explicit experimental or legacy paths only if approved.
- Legacy alias policy: Existing root-reachable deprecated symbols such as `auraTokens` and `getAuraTokens` require replacement notes; PLRNUI-16 rejects AURA token compatibility aliases.
- Deprecation window: HUMAN REVIEW REQUIRED per export group.
- Removal target: Before stable public API release; beta/experimental exports may remain only with clear labels.
- Verification required: Recount export matrix, review root API proposal, verify docs/demo imports use only approved entrypoints, typecheck consumer imports.
- Release blocking: Yes. RC is blocked if root API governance is stale or unapproved.
- Notes: PLRNUI-4 analyzed 92 exports: 40 public, 32 experimental, 18 internal and 2 deprecated.

### BC-004 - Deep import restriction

- ID: BC-004
- Status: candidate
- Category: import path / entrypoint governance
- Source issue: PLRNUI-4, PLRNUI-9, PLRNUI-10
- Related ADR / Risk Assessment: ADR 0002, ADR 0006, ADR 0008, Risk Assessment 0008
- Decision: Consumers must use package root or approved subpath exports; direct source/build/internal imports are unsupported.
- Motivation: Deep imports bypass controlled entrypoints and make internal file layout part of the consumer contract.
- Consumer impact: Consumers or examples using repo-relative imports, `src/*`, `dist/*`, `theme/types` or demo internals may break when exports are locked down.
- Migration path: Replace demo/docs consumer examples with `@personal-library/react-native-components` or approved subpaths after package identity is implemented; keep preview-only imports documented as non-consumer examples if retained.
- Legacy alias policy: No legacy deep import aliases should be promised without owner approval.
- Deprecation window: HUMAN REVIEW REQUIRED if any external consumer currently relies on deep imports.
- Removal target: Before release candidate for unsupported direct source/build/internal imports.
- Verification required: Deep import audit over docs/demo/preview/consumer apps, package `exports` validation, clean Expo import smoke.
- Release blocking: Yes. RC is blocked if docs/demo present unsupported deep imports as consumer guidance.
- Notes: PLRNUI-4 found 10 concrete deep import findings and a grouped docs legacy import finding.

### BC-005 - Peer dependency compatibility policy

- ID: BC-005
- Status: candidate
- Category: dependency policy / peer compatibility
- Source issue: PLRNUI-7, PLRNUI-8, PLRNUI-10
- Related ADR / Risk Assessment: ADR 0006, ADR 0008, Risk Assessment 0008
- Decision: React and React Native host runtimes must be compatible with the selected Expo/RN baseline and verified in a clean consumer; current React peer range blocks PLRNUI-8.
- Motivation: A reusable RN library must not force duplicate or incompatible React/RN runtimes into consumer apps.
- Consumer impact: Consumers may be unable to install the package under strict npm resolution or may get duplicate React/RN if dependency sections are wrong.
- Migration path: Align peer ranges to the chosen Expo/RN baseline in a package-metadata ticket; document required peers and rerun clean consumer install/import smoke.
- Legacy alias policy: Not applicable to package aliases; legacy package compatibility depends on BC-001.
- Deprecation window: Not applicable.
- Removal target: Before release candidate.
- Verification required: Clean Expo app install without `--force` or `--legacy-peer-deps`, root import, TypeScript resolution, Metro startup and `npm ls react react-native` duplicate check.
- Release blocking: Yes. PLRNUI-8 verdict is NOT READY until this passes.
- Notes: PLRNUI-8 failed because Expo consumer had `react@19.2.3`, while `@aura/ui@1.0.0` required peer `react@^19.2.4`.

### BC-006 - Native dependency gate

- ID: BC-006
- Status: candidate
- Category: native dependency / runtime compatibility
- Source issue: PLRNUI-7, PLRNUI-8, PLRNUI-10
- Related ADR / Risk Assessment: ADR 0006, ADR 0008, Risk Assessment 0008
- Decision: Native or native-adjacent dependencies require Jira tracking, policy classification, Expo Go/managed/prebuild notes and PLRNUI-8 smoke coverage before release. PLRNUI-37 confirms `react-native-safe-area-context` as a required peer while `ThemeProvider` keeps safe-area behavior enabled by default.
- Motivation: Hard native dependencies can change install/runtime requirements for Expo and React Native consumers.
- Consumer impact: Consumers may need to install peers, use prebuild/custom dev client, accept Expo Go limitations or avoid optional APIs. Consumers using `ThemeProvider` must explicitly install `react-native-safe-area-context` as a peer dependency.
- Migration path: Classify each native dependency as required peer, optional peer, dev-only or isolated feature; update docs and smoke tests after package metadata changes. For `ThemeProvider`, document `react-native-safe-area-context` as a required peer and validate install/import/render in a clean consumer.
- Legacy alias policy: Not applicable.
- Deprecation window: HUMAN REVIEW REQUIRED if public APIs lose native-backed behavior.
- Removal target: Before release candidate for uncontrolled hard native dependencies.
- Verification required: Native dependency gate checklist, clean Expo install, Expo Go/managed/prebuild assessment and runtime smoke for root import plus affected APIs, including `ThemeProvider` render with safe-area behavior enabled.
- Release blocking: Yes. RC is blocked if native dependency requirements are not classified and tested.
- Notes: Current gate-tracked packages include React Native, Safe Area, AsyncStorage, Expo Clipboard, React Native SVG and Lucide RN. PLRNUI-37 is a contract decision only; no runtime or package metadata change is made by this register update.

### BC-007 - Stability contract: 0 stable, beta/experimental/internal labeling

- ID: BC-007
- Status: candidate
- Category: stability contract / documentation
- Source issue: PLRNUI-5, PLRNUI-9, PLRNUI-10
- Related ADR / Risk Assessment: ADR 0002, ADR 0008, Risk Assessment 0008
- Decision: Current component API must not be represented as stable; available classifications include beta, experimental, internal and deprecated until promotion criteria are met.
- Motivation: Stability labels define consumer expectations and semantic-versioning obligations.
- Consumer impact: Consumers using beta/experimental/internal APIs must expect migration work, changed props, moved exports or removals before stable release.
- Migration path: Publish stability labels in docs/demo and changelog; keep internal APIs out of consumer docs; require promotion criteria before marking anything stable.
- Legacy alias policy: Deprecated symbols must retain explicit replacement/removal notes if kept public.
- Deprecation window: HUMAN REVIEW REQUIRED for deprecated and internal APIs that remain root-reachable.
- Removal target: Before stable release for internal APIs exposed as public by accident; experimental APIs may remain only under explicit labels.
- Verification required: Component maturity matrix, export matrix alignment, docs/demo stability audit and root API review.
- Release blocking: Yes. RC is blocked if docs/demo communicate false stability.
- Notes: PLRNUI-5 context reports 0 stable, 23 beta, 12 experimental and 6 internal; PLRNUI-4 reports root export statuses separately.

### BC-008 - Release candidate blocked unless register and changelog are updated

- ID: BC-008
- Status: confirmed
- Category: release governance
- Source issue: PLRNUI-10
- Related ADR / Risk Assessment: ADR 0008, Risk Assessment 0008
- Decision: A release candidate cannot proceed when this register or `audit/migration/migration-changelog.md` is stale.
- Motivation: Governance drift makes breaking changes, migration paths and verification status impossible to audit.
- Consumer impact: Consumers receive clearer release notes and migration steps; release may be delayed until governance evidence is current.
- Migration path: Update this register and changelog in every task that changes package identity, public API, dependencies, native requirements, docs migration or release readiness.
- Legacy alias policy: Alias changes must always update both files with deprecation window and removal target.
- Deprecation window: N/A for the governance gate itself.
- Removal target: N/A; gate remains active through migration.
- Verification required: Pre-RC review of register, changelog, export matrix, dependency policy and release readiness report.
- Release blocking: Yes. This is itself a required release gate.
- Notes: This entry implements the PLRNUI-10 rule that RC is blocked without an updated register.
