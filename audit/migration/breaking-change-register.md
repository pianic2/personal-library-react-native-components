# Breaking Change Register - PLRNUI-10

## Scope

This register is the source of truth for migration breaking changes from the legacy AURA / UI Experience identity and historical `@aura/ui` package metadata toward the recommended project identity `personal-library-react-native-components` and package target `@personal-library/react-native-components`.

It covers rename/package/API/dependency changes identified by ADR 0001, ADR 0002, ADR 0006, ADR 0008, Risk Assessment 0008, PLRNUI-3, PLRNUI-4, PLRNUI-7, PLRNUI-8 and existing audit artifacts.

No entry in this file changes source code, package metadata, public exports or dependency configuration. Entries document decisions, migration paths and release gates that must be satisfied before a release candidate.

## Release Gate Policy

- A release candidate is blocked unless this register is current for every package rename, legacy alias, public API, deep import, dependency, native dependency and stability-contract breaking change.
- Every confirmed breaking change must have a Jira source issue, motivation, consumer impact, migration path, verification requirement and changelog note.
- Legacy aliases may remain only with an explicit deprecation window and removal target.
- `npm run typecheck`, `npm run build`, `npm pack --dry-run` and a clean Expo consumer install/import smoke test are required before release readiness can be marked ready.
- PLRNUI-8 historical clean Expo consumer install failed with `ERESOLVE`: the consumer had `react@19.2.3`, while `@aura/ui@1.0.0` required peer `react@^19.2.4`. PLRNUI-42 aligns the current React peer range; release readiness still requires regenerated consumer evidence.

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
| PLRNUI-8 | Build/package/consumer smoke | Typecheck, build and pack pass; historical clean Expo consumer install failed on React peer mismatch; verdict NOT READY until consumer evidence is regenerated. | Clean Expo install, root import, TypeScript resolution, Metro/runtime smoke, duplicate React/RN check. | Blocks RC until consumer verification passes or limitations are explicitly accepted. |
| PLRNUI-9 | Docs/demo migration readiness | Docs/demo still use legacy AURA imports and repo-relative demo imports; preview web is not Expo/RN runtime proof. | Docs/demo import audit, clean consumer examples, runtime smoke beyond preview web. | Blocks RC if docs/demo conflict with public API and package identity. |
| PLRNUI-10 | Breaking change governance | This register and migration changelog must be maintained as release gates. | Register/changelog review before RC. | Blocks RC if register or changelog is stale. |
| PLRNUI-17 | Canonical naming governance | Repository/project identity is `personal-library-react-native-components`; package/import identity is `@personal-library/react-native-components`; AURA, aura, `@aura/ui`, UI Experience and ambiguous `react-native-components` identities are legacy/historical unless explicitly governed as temporary aliases. | Legacy naming map, migration changelog and breaking-change register review; no runtime/source/package metadata changes in this ticket. | Blocks RC if package/import identity changes lack owner/context, migration path or alias/deprecation policy. |
| PLRNUI-16 / PLRNUI-29 / PLRNUI-53 | Token export naming and docs policy | AURA-branded and snapshot-named public token exports are removed now; neutral theme-oriented names are the supported public token API; legacy token names are not stable public API and are forbidden in consumer examples. | Source/root export grep, token public API test, PLRNUI-53 consumer docs policy. | Blocks RC if removed token names are reintroduced as public/root aliases, shown in consumer examples, or presented as stable. |
| PLRNUI-26 | Internal and experimental export fencing | Root remains explicit named export surface; `cn` and `useIsMounted` are removed from root; `Stack` docs are reconciled; `useNavigate` is experimental. PLRNUI-29 removes legacy token compatibility names. | Root API diff, export matrix review, migration changelog entry and docs stability review. | Blocks stable release if internal helpers are exposed as stable/public or experimental exports are undocumented. |
| PLRNUI-28 | Theme provider app-shell split | `ThemeProvider` is pure; `ThemeAppShell` owns explicit layout/scroll behavior. | Node smoke tests, typecheck, build, package dry-run and migration docs. | Breaking for consumers relying on implicit provider layout or `withScroll`. |
| PLRNUI-39 | Clipboard dependency strategy | `expo-clipboard` is optional consumer-owned adapter implementation, not a core runtime dependency or root peer dependency. | Documentation review; future implementation must verify no direct core import and no package metadata dependency. | Does not introduce a breaking change while opt-in/documental. |
| PLRNUI-44 | Native dependency governance consolidation | Current package metadata has no runtime `dependencies`; `react` and `react-native` are peers; AsyncStorage and Clipboard are consumer-owned; Safe Area is not required by pure `ThemeProvider` after PLRNUI-28. | Documentation review; future native dependency changes must pass the native dependency gate and PLRNUI-46 consumer smoke. | Does not introduce a breaking change because it changes governance docs only. |
| PLRNUI-45 | Package entrypoint reconciliation | Current package metadata uses canonical package name, root-only exports, `dist/index.js`, `dist/index.d.ts`, and a minimal `files` whitelist. | Typecheck, build, pack dry-run, tarball file-list check and PLRNUI-46 consumer smoke. | Does not introduce a breaking change because no runtime/API/metadata change is made by PLRNUI-45. |
| PLRNUI-56 | Optional theme persistence | `ThemeProvider` accepts optional `ThemeStorageAdapter`, `storageKey` and `persistTheme`; persistence is disabled by default and storage backends remain consumer-owned. | Typecheck, Node tests, build, package metadata diff, AsyncStorage grep and docs/audit review. | Additive only while default behavior remains non-persistent and no storage dependency is added. |

### PLRNUI-16 / PLRNUI-29 - Token export naming

Legacy token exports `auraTokens` and `getAuraTokens`, plus the snapshot-named public type `TokensSnapshot`, are removed from the public/root API now by PLRNUI-29.

Replacement names:

- `defaultThemeTokens`
- `createThemeTokens`
- `ThemeTokens`

No compatibility aliases will be introduced for AURA-branded or snapshot-named public token names.

If these symbols existed in previous public package states, removal is an intentional breaking cleanup.

PLRNUI-53 closes the consumer-facing documentation policy: `auraTokens` and `getAuraTokens` are legacy/deprecated, not stable public API, not allowed in consumer examples, and not reintroduced as aliases.

## Entries

### BC-001 - Package rename `@aura/ui` -> `@personal-library/react-native-components`

- ID: BC-001
- Status: verified
- Category: package rename
- Source issue: PLRNUI-3, PLRNUI-10
- Related ADR / Risk Assessment: ADR 0001, ADR 0006, ADR 0008, Risk Assessment 0008
- Decision: Current `package.json` declares `@personal-library/react-native-components`; `@aura/ui` remains historical audit and PLRNUI-8 package-artifact evidence only. PLRNUI-17 confirms the canonical package/import identity as `@personal-library/react-native-components`.
- Motivation: Package identity must align with the reusable React Native component library identity and avoid publishing the legacy AURA name as the canonical contract.
- Consumer impact: Consumers importing or installing `@aura/ui` must update install commands, import paths and package references once the rename is implemented.
- Migration path: Map historical `@aura/ui`, `AURA` import placeholders, UI Experience references and ambiguous package identity prose to `@personal-library/react-native-components` for package/import usage and `personal-library-react-native-components` for repository/project identity. Consumer-facing cleanup belongs to explicit implementation/docs tickets.
- Legacy alias policy: `@aura/ui` is historical only unless an owner explicitly approves and documents a temporary migration alias with reason, scope, deprecation window and removal target.
- Deprecation window: HUMAN REVIEW REQUIRED before implementation.
- Removal target: Before first release candidate under the new package identity, unless owner approves a documented compatibility release.
- Verification required: Package metadata audit, `npm pack --dry-run`, clean Expo consumer install of the packed artifact, root import smoke and docs import audit.
- Release blocking: Yes. RC is blocked if package identity is unresolved or register/changelog omit the rename.
- Notes: PLRNUI-8 evidence still uses `@aura/ui@1.0.0`; this is historical artifact evidence. PLRNUI-45 verifies current package metadata uses `@personal-library/react-native-components`. PLRNUI-46 and PLRNUI-58 verify packed-artifact consumer use through the package root, and README/docs/examples use the canonical root import. PLRNUI-17 is a governance documentation update only and does not change package metadata or runtime source.

### BC-002 - Legacy AURA naming deprecation/removal

- ID: BC-002
- Status: candidate
- Category: legacy naming
- Source issue: PLRNUI-3, PLRNUI-9, PLRNUI-10, PLRNUI-17
- Related ADR / Risk Assessment: ADR 0001, ADR 0008, Risk Assessment 0008
- Decision: AURA, aura, `@aura/ui`, UI Experience and ambiguous `react-native-components` identity references are historical/deprecated names. New governance artifacts should use `personal-library-react-native-components` for repo/project identity and `@personal-library/react-native-components` for package/import identity.
- Motivation: Legacy naming in docs, imports and token names creates ambiguity about the supported package identity and API contract.
- Consumer impact: Consumers using `from "AURA"`, `aura` package examples, `@aura/ui`, UI Experience package prose or ambiguous package identity wording must update imports and documentation references to `@personal-library/react-native-components` and repository/project references to `personal-library-react-native-components`. Consumers using `auraTokens` or `getAuraTokens` must migrate to neutral token names with no AURA token compatibility alias.
- Migration path: Maintain `audit/migration/legacy-naming-map.md`; update docs/demo/repository wording in dedicated implementation tickets; publish removal notes in changelog.
- Legacy alias policy: AURA token aliases are not allowed by PLRNUI-16. Any package/import legacy alias must be explicitly marked deprecated and mapped to replacement import paths with owner/context and removal/containment policy. Without that approval, legacy aliases are historical only.
- Deprecation window: HUMAN REVIEW REQUIRED; no silent removal.
- Removal target: Before stable release unless a compatibility window is approved.
- Verification required: Repository grep for `AURA`, `aura`, `@aura/ui`, `UI Experience`, ambiguous `react-native-components`, `auraTokens`, `getAuraTokens` and docs/demo import review.
- Release blocking: Yes. RC is blocked if legacy public aliases remain without deprecation/removal policy.
- Notes: Current `package.json` no longer declares `@aura/ui`; remaining `@aura/ui` and `AURA` references are historical audit/smoke evidence or docs/demo migration findings. PLRNUI-17 records governance policy only and does not implement naming cleanup, source changes, generated file edits or Jira workflow transitions.

### BC-007 - Token naming aggressive removal

- ID: BC-007
- Status: implemented
- Category: public token API
- Source issue: PLRNUI-29
- Related ADR / Risk Assessment: ADR 0002, ADR 0004, ADR 0008, PLRNUI-16
- Decision: Remove `auraTokens`, `getAuraTokens` and `TokensSnapshot` from the public/root token API now. Expose `defaultThemeTokens`, `createThemeTokens` and `ThemeTokens` instead.
- Motivation: The package is in API-hardening phase; keeping temporary snapshot or legacy AURA names would increase migration debt before stabilization.
- Consumer impact: Consumers importing removed token names must update imports and type annotations to neutral names.
- Migration path: `auraTokens` -> `defaultThemeTokens`; `getAuraTokens(mode)` -> `createThemeTokens(mode)`; `TokensSnapshot` -> `ThemeTokens`.
- Legacy alias policy: No root-level deprecated aliases are provided.
- Deprecation window: None; removal milestone is now, PLRNUI-29.
- Removal target: Implemented by PLRNUI-29.
- Verification required: `npm run typecheck`, `npm run test`, `npm run build`, `git diff --check`, source grep for removed public token names.
- Release blocking: Yes. RC is blocked if removed token names are publicly exported again.
- Notes: PLRNUI-53 confirms `auraTokens` and `getAuraTokens` are legacy/deprecated, not stable public API, forbidden in consumer examples, and not reintroduced as aliases.

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
- Legacy alias policy: Existing root-reachable deprecated token symbols such as `auraTokens` and `getAuraTokens` are removed by PLRNUI-29 with replacement notes; PLRNUI-16 rejects AURA token compatibility aliases.
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
- Status: verified
- Category: dependency policy / peer compatibility
- Source issue: PLRNUI-7, PLRNUI-8, PLRNUI-10
- Related ADR / Risk Assessment: ADR 0006, ADR 0008, Risk Assessment 0008
- Decision: React and React Native host runtimes must be compatible with the selected Expo/RN baseline and verified in a clean consumer. PLRNUI-42 and PLRNUI-43 align the current peer ranges, and PLRNUI-46 / PLRNUI-58 verify the packed artifact in generated external consumers.
- Motivation: A reusable RN library must not force duplicate or incompatible React/RN runtimes into consumer apps.
- Consumer impact: Consumers may be unable to install the package under strict npm resolution or may get duplicate React/RN if dependency sections are wrong.
- Migration path: Align peer ranges to the chosen Expo/RN baseline in a package-metadata ticket; document required peers and rerun clean consumer install/import smoke.
- Legacy alias policy: Not applicable to package aliases; legacy package compatibility depends on BC-001.
- Deprecation window: Not applicable.
- Removal target: Before release candidate.
- Verification required: Clean Expo app install without `--force` or `--legacy-peer-deps`, root import, TypeScript resolution, Metro startup and `npm ls react react-native` duplicate check.
- Release blocking: Yes. RC is blocked if peer ranges or consumer verification regress.
- Notes: PLRNUI-8 failed because Expo consumer had `react@19.2.3`, while `@aura/ui@1.0.0` required peer `react@^19.2.4`. PLRNUI-42 aligns the React peer range to `>=19.2.3 <20.0.0` using the latest stable Expo SDK baseline: Expo SDK `56.0.0`, React Native `0.85`, React `19.2.3`, and Node minimum `22.13.x`. PLRNUI-43 confirms the React Native peer range as `>=0.85.0 <0.86.0`. PLRNUI-46 verifies packed-artifact install, root import, consumer TypeScript and render smoke with `react-native@0.85.3`; PLRNUI-58 verifies Expo/Metro web export from the packed artifact. Native device runtime remains separate under BC-006 / RA 0005.

### BC-006 - Native dependency gate

- ID: BC-006
- Status: implemented
- Category: native dependency / runtime compatibility
- Source issue: PLRNUI-7, PLRNUI-8, PLRNUI-10
- Related ADR / Risk Assessment: ADR 0006, ADR 0008, Risk Assessment 0008
- Decision: Native or native-adjacent dependencies require Jira tracking, policy classification, Expo Go/managed/prebuild notes and PLRNUI-46 smoke coverage before release. PLRNUI-28 makes `ThemeProvider` pure and removes the default safe-area requirement. PLRNUI-38 confirms AsyncStorage must remain consumer-owned and adapter-based. PLRNUI-39 confirms `expo-clipboard` must remain consumer-owned and adapter-based, not a core dependency or root peer. PLRNUI-44 confirms the current package metadata has no runtime `dependencies`.
- Motivation: Hard native dependencies can change install/runtime requirements for Expo and React Native consumers.
- Consumer impact: Consumers may need to install peers, use prebuild/custom dev client, accept Expo Go limitations or avoid optional APIs. Consumers using pure `ThemeProvider` after PLRNUI-28 do not need a safe-area dependency for provider rendering. Consumers using future clipboard support must provide and validate their own `ClipboardAdapter`; Expo consumers may implement it with `expo-clipboard`.
- Migration path: Classify each native dependency as required peer, optional consumer-owned adapter, dev-only or isolated feature; update docs and smoke tests after package metadata changes. For theme layout, use `ThemeAppShell` instead of provider-owned safe-area or scroll wrappers. For theme persistence, keep AsyncStorage as a consumer adapter backend. For clipboard, document `ClipboardAdapter` as opt-in if implemented and keep `expo-clipboard` outside the core package metadata.
- Legacy alias policy: Not applicable.
- Deprecation window: HUMAN REVIEW REQUIRED if public APIs lose native-backed behavior.
- Removal target: Before release candidate for uncontrolled hard native dependencies.
- Verification required: Native dependency gate checklist, clean Expo install, Expo Go/managed/prebuild assessment and runtime smoke for root import plus affected APIs. Future safe-area APIs require their own install/render smoke if package metadata exposes that contract.
- Release blocking: Yes. RC artifact publication is blocked if native dependency requirements are not classified and tested, or if the native-runtime residual is not explicitly accepted/scheduled.
- Notes: Current gate-tracked packages include React Native, Safe Area, AsyncStorage, Expo Clipboard, React Native SVG and Lucide RN. PLRNUI-37, PLRNUI-38, PLRNUI-39 and PLRNUI-44 are governance/contract decisions only; no runtime or package metadata change is made by these register updates. PLRNUI-44 confirms current package metadata has no runtime `dependencies`, and PLRNUI-58 proves Expo web/Metro bundling. Expo Go, native device runtime, prebuild and custom dev client behavior remain unproven and are tracked as a PLRNUI-60 / PLRNUI-41 residual.

### BC-011 - Stability contract: 0 stable, beta/experimental/internal labeling

- ID: BC-011
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

### BC-009 - ThemeProvider app-shell split

- ID: BC-009
- Status: implemented
- Category: public API / provider behavior
- Source issue: PLRNUI-28
- Related ADR / Risk Assessment: ADR 0004, Risk Assessment 0004
- Decision: `ThemeProvider` renders only `ThemeContext.Provider` and children. `ThemeAppShell` is the explicit opt-in themed layout wrapper; `scroll` defaults to `false`.
- Motivation: ADR 0004 says safe-area, scroll container and app layout wrappers should be optional or separate from pure theme context.
- Consumer impact: Consumers relying on implicit provider layout, default scroll behavior or the `withScroll` prop must update composition.
- Migration path: Use `<ThemeProvider>...</ThemeProvider>` for pure context. Use `<ThemeProvider><ThemeAppShell scroll>...</ThemeAppShell></ThemeProvider>` when themed layout or scrolling is required.
- Legacy alias policy: No legacy alias. `withScroll` is removed from the provider contract before stable release.
- Deprecation window: No compatibility window for pre-stable beta provider behavior.
- Removal target: Implemented by PLRNUI-28.
- Verification required: `npm run typecheck`, `npm run test`, `npm run build`, `npm run package:dry-run`, root export review and grep for removed provider prop.
- Release blocking: Yes. RC is blocked if migration docs or export matrix omit the provider split.
- Notes: PLRNUI-28 does not implement safe-area support, does not import `react-native-safe-area-context`, does not add AsyncStorage and does not change `package.json` or `package-lock.json`.

### BC-010 - Optional ThemeStorageAdapter persistence

- ID: BC-010
- Status: implemented
- Category: public API / dependency boundary
- Source issue: PLRNUI-56
- Related ADR / Risk Assessment: ADR 0004, ADR 0006, Risk Assessment 0004, Risk Assessment 0005
- Decision: `ThemeProvider` supports optional theme persistence through a consumer-provided `ThemeStorageAdapter`. Persistence is enabled only when `persistTheme=true` and `storage` is provided.
- Motivation: Consumers may want theme mode persistence without making the library own a native storage backend.
- Consumer impact: Existing consumers are unaffected. Consumers that opt in must provide and validate their own storage backend.
- Migration path: Keep `<ThemeProvider>` unchanged for non-persistent behavior. Add `persistTheme`, `storage` and optionally `storageKey` only when persistence is desired.
- Legacy alias policy: Not applicable.
- Deprecation window: Not applicable.
- Removal target: Not applicable.
- Verification required: `npm run typecheck`, `npm run test`, `npm run build`, package metadata diff, AsyncStorage grep and public API docs review.
- Release blocking: No for existing consumers while default behavior remains non-persistent. Yes if package metadata adds a required storage dependency or default rendering begins requiring storage.
- Notes: Runtime `ThemeMode` remains `light | dark`; persisted `system` is intentionally treated as invalid and ignored until system mode is implemented in a future ticket.

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

### PLRNUI-26 - Internal and experimental export fencing

- ID: PLRNUI-26
- Status: implemented
- Category: public API / root export fencing
- Source issue: PLRNUI-26
- Related ADR / Risk Assessment: ADR 0002, ADR 0003, ADR 0008, Risk Assessment 0003, Risk Assessment 0008
- Decision: Keep the root API as an explicit named export surface without adding `/experimental` or `/internal` entrypoints. Remove `useIsMounted` and `cn` from root because they are internal helpers. Keep `Stack` root-exported and reconcile docs as a public-candidate layout primitive. Keep `useNavigate` root-exported as an experimental navigation hook. PLRNUI-29 removes legacy token compatibility names from root.
- Motivation: Internal helper exports make implementation details look consumer-facing, while undocumented experimental exports can be mistaken for stable API.
- Consumer impact: Pre-stable consumers must stop importing `useIsMounted` or `cn` from the package root. Consumers may continue using documented pre-stable/experimental exports with migration risk. No stable consumer breaking change is recorded because the package is still pre-stable.
- Migration path: Use documented public or experimental root APIs only. Do not consume internal helpers from root. Migrate removed token names through the PLRNUI-29 mapping. Track any future experimental export move/removal in this register and changelog.
- Legacy alias policy: Legacy token compatibility names are removed by PLRNUI-29; no new AURA compatibility aliases should be introduced.
- Deprecation window: HUMAN REVIEW REQUIRED for any experimental root export removals.
- Removal target: `useIsMounted` and `cn` removed from root by PLRNUI-26. Legacy token names removed from root by PLRNUI-29. Future removal or movement of experimental exports requires a separate approved task.
- Verification required: `npm test`, `npm run typecheck`, root API diff review and audit documentation review.
- Release blocking: Yes. Stable release is blocked if internal helpers are root-exposed as stable/public or experimental APIs are undocumented.
- Notes: PLRNUI-26 does not change package metadata, package subpaths, dependency declarations or stable classifications.
