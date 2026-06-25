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
- Added PLRNUI-37 safe-area provider dependency contract documentation; PLRNUI-28 later supersedes the default-provider requirement by making `ThemeProvider` pure.
- Added PLRNUI-39 clipboard dependency strategy: clipboard support is optional, adapter-based and consumer-owned; `expo-clipboard` is not a core package runtime dependency or root peer dependency.
- Added PLRNUI-44 native dependency governance consolidation: current package metadata has no runtime `dependencies`, keeps `react` / `react-native` as peers, keeps `typescript` dev-only, keeps AsyncStorage and Clipboard consumer-owned, and leaves future Safe Area work under native dependency governance.
- Added PLRNUI-45 package entrypoint reconciliation: canonical package name, `main`, `module`, `types`, root `exports`, `files`, current `dist` output and root import are aligned for the current package surface.
- Added PLRNUI-21 component blocker remediation evidence for `Card`, `ProgressBar`, `CodeInline`, `Textarea` and `PasswordInput`, including smoke/render harness coverage.
- Added PLRNUI-22 navigation component public API integration for `TopBar`, `BottomBar`, `NavBar`, `Link`, `NavContext` and `SideBar`, with local component barrels, root exports, smoke coverage and `audit/components/navigation-platform-contract-plrnui-22.md`.
- Added PLRNUI-23 overlay/form modal API visibility for `Modal`, `BottomSheet`, `Tooltip`, `Popover` and `Select`, with local component barrels, root exports, smoke coverage and `audit/components/overlay-platform-contract-plrnui-23.md`.
- Added PLRNUI-24 approved root-public component props type exports, including `RadioGroupOption`, with a dedicated type-only fixture for root import verification.
- Added PLRNUI-25 component platform support matrix and docs import audit for the current checkout.
- Added PLRNUI-26 internal and experimental export fencing evidence: internal helper root exports are fenced, experimental root exports are documented, and root API docs are reconciled without adding subpath entrypoints.
- Added PLRNUI-57 minimal consumer-facing docs and examples using the approved root package import.
- Added PLRNUI-28 pure `ThemeProvider` split and explicit `ThemeAppShell` migration path.
- Added PLRNUI-56 optional `ThemeStorageAdapter` persistence for `ThemeProvider`, keeping storage adapter-based, consumer-owned and disabled by default.
- Added PLRNUI-30 Button structural component-token contract wiring for height, horizontal padding, icon size, radius, gap, border width and opacity.
- Added PLRNUI-31 Input structural component-token contract wiring for height, horizontal padding, vertical padding, icon box height and radius.
- Added PLRNUI-32 Card structural component-token contract wiring for radius, padding and shadow defaults.
- Added PLRNUI-33 theme override verification for nested colors, radius, size and Button/Input/Card component tokens.
- Added PLRNUI-29 token naming removal evidence: legacy/snapshot public token names are removed now, neutral `defaultThemeTokens`, `createThemeTokens` and `ThemeTokens` are the supported public token API, and no root deprecated aliases are provided.

### Changed

- Clarified that current migration state remains governance/proposed for broader API/docs work, while current package metadata is canonical and aligned to `dist`.
- PLRNUI-42 aligned `peerDependencies.react` to `>=19.2.3 <20.0.0` using the latest stable Expo SDK baseline: Expo SDK `56.0.0`, React Native `0.85`, React `19.2.3`, and Node minimum `22.13.x`.
- PLRNUI-43 confirmed `peerDependencies.react-native` as `>=0.85.0 <0.86.0`, aligned to the approved Expo SDK `56.0.0` / React Native `0.85.x` baseline.
- Clarified that AURA / UI Experience are historical or deprecated names, while `personal-library-react-native-components` is the recommended project identity.
- Clarified that `@personal-library/react-native-components` is current package metadata; `@aura/ui` remains historical audit/consumer-smoke evidence and must not be reintroduced as a legacy alias.
- Clarified that root public API governance is based on PLRNUI-4 export analysis: 92 exports analyzed, with 40 public, 32 experimental, 18 internal and 2 deprecated.
- Clarified that no current subpath exports are implemented and any future subpath policy must be verified through package metadata and consumer smoke tests.
- Clarified that docs/demo imports using legacy `from "AURA"` or repo-relative `../../index` paths are not proof of valid consumer API.
- Clarified that `react-native-safe-area-context` is not required by the pure `ThemeProvider` contract after PLRNUI-28; future package-provided safe-area APIs must be validated against the selected Expo/RN baseline.
- Clarified that PLRNUI-39 is a governance/dependency decision only and does not declare a breaking change while clipboard remains opt-in and package metadata is unchanged.
- Clarified that PLRNUI-44 does not implement `ThemeStorageAdapter`, does not add native dependencies, does not change the approved Expo/RN baseline, and does not create the PLRNUI-46 Expo consumer smoke test.
- Clarified that PLRNUI-45 does not add subpath exports, does not broaden the public API, and does not create the PLRNUI-46 Expo consumer smoke test.
- Clarified that PLRNUI-21 moves the five remediated components at most to `beta`; `stable` remains blocked by ADR 0003/0007 stable gates.
- Clarified that PLRNUI-22 intentionally broadens the root API for the approved navigation components without adding package subpath exports, dependencies, drawer/gesture behavior, overflow menus or router-specific integrations.
- Clarified that PLRNUI-23 broadens root API visibility for experimental overlay/form modal components without adding package subpath exports, runtime dependencies, native dependencies, or stable promotion.
- Clarified that PLRNUI-24 is additive type-surface work only: it preserves runtime behavior, does not add package subpath exports, and keeps experimental/internal props types out of the root API.
- Clarified that PLRNUI-25 updates documentation/audit evidence and README import examples only; it does not change package metadata, runtime component logic, dependencies, subpath exports or stable classifications.
- Clarified that PLRNUI-26 removes `cn` and `useIsMounted` from the root API as internal helpers, keeps `Stack` root-exported as a public-candidate layout primitive, and reclassifies `useNavigate` as an experimental navigation hook. PLRNUI-29 later removes legacy token compatibility names.
- Clarified that PLRNUI-57 adds documentation and example files only; it does not add dependencies, package exports, runtime logic, package subpaths or stable promotions.
- Clarified that PLRNUI-28 removes `withScroll` and implicit layout rendering from `ThemeProvider`; consumers that need app layout should compose `ThemeProvider` with `ThemeAppShell`.
- Clarified that PLRNUI-56 intentionally defers `"system"` mode persistence because the current runtime `ThemeMode` remains `"light" | "dark"`; persisted `"system"` values are ignored as invalid.
- Clarified that PLRNUI-30 does not add Button background, text, border, loading, typography, shadow, elevation, animation or width component tokens; Button colors continue to use semantic color tokens.
- Clarified that PLRNUI-31 removes the decorative Input label marker instead of tokenizing it, eliminates the former Input magic offsets, and preserves semantic color behavior.
- Clarified that PLRNUI-32 removes the former Card `radius = 14` default, maps Card defaults to approved theme/component tokens and preserves explicit Card prop overrides without stable promotion.
- Clarified that PLRNUI-33 preserves the existing `themeOverrides?: Partial<Theme>` public API while hardening nested merge behavior; invalid scalar leaf casts remain unsupported because runtime schema validation is not introduced.
- Clarified that PLRNUI-29 is an aggressive removal: `auraTokens`, `getAuraTokens` and `TokensSnapshot` are removed from root and token barrels now, with migration to `defaultThemeTokens`, `createThemeTokens` and `ThemeTokens`. PLRNUI-53 remains responsible for consumer-facing docs/policy.
- Clarified that PLRNUI-53 closes the consumer-facing docs/demo policy for `auraTokens` and `getAuraTokens`: they are legacy/deprecated, not stable public API, not allowed in README/docs/examples/demo as recommended consumer API, and not reintroduced as aliases.

### PLRNUI-53 - Legacy token API docs policy

`auraTokens` and `getAuraTokens` remain historical governance terms only. They are legacy/deprecated token API names, not stable public API, and not valid consumer-facing examples.

README, docs, examples and demo/public sample code must not recommend or use those names. Historical audit/migration/governance references are allowed only when clearly marked legacy, deprecated, removed or not stable.

PLRNUI-16 owns the API/export naming decision. PLRNUI-29 owns the technical aggressive removal. PLRNUI-53 owns the consumer-facing docs/demo policy.

### PLRNUI-29 - Token naming removal

The public token API now exposes only neutral token names:

- `defaultThemeTokens`
- `createThemeTokens`
- `ThemeTokens`

Removed public/root token names:

- `auraTokens`
- `getAuraTokens`
- `TokensSnapshot`

No root-level deprecated aliases are provided. This is an intentional breaking change during API hardening. Consumers must migrate token imports to the neutral names. PLRNUI-53 owns consumer-facing docs and policy follow-up.

### PLRNUI-33 - Theme override verification

`createTheme` now deep-merges nested plain-object override branches while preserving sibling tokens and required base theme structure.

Verified nested override areas:

- `colors`
- `radius`
- `size.height`
- `components.button`
- `components.input`
- `components.card`

`undefined` override values do not erase base values. Invalid object branch replacements forced past TypeScript, such as `colors: null` or `components.button: []`, are safely ignored for required object branches.

Public `ThemeProvider` props, `createTheme` signature, root package exports, package metadata and component props are unchanged. PLRNUI-33 does not add runtime schema validation and does not promote the theme override API to `stable`.

### PLRNUI-30 - Button component token contract

`Button` now reads approved structural values from `theme.components.button`:

- `height.sm/md/lg`
- `paddingX.sm/md/lg`
- `iconSize.sm/md/lg`
- `radius`
- `gap`
- `borderWidth`
- `opacity.disabled`
- `opacity.pressed`

Public Button props, root package exports, variant behavior and semantic color behavior are unchanged. The existing `size="xs"` prop remains supported through the primitive height scale and existing fallback values because PLRNUI-30 only approved `sm/md/lg` component-token sizes.

### PLRNUI-31 - Input component token contract

`Input` now reads approved structural values from `theme.components.input`:

- `height.xs/sm/md/lg`
- `paddingX.xs/sm/md/lg`
- `paddingY.xs/sm/md/lg`
- `iconBoxHeight.xs/sm/md/lg`
- `radius`

The former decorative label marker was removed. The former `-2` and `-2.5` sizing offsets were eliminated. Public Input props, root package exports, package metadata and semantic color behavior are unchanged.

### PLRNUI-32 - Card component token contract

`Card` now reads approved structural defaults from `theme.components.card`:

- `radius`
- `padding`
- `shadow`

Default theme values map to approved base tokens: `radius.lg`, `space.md` and `shadows.sm`. Explicit Card props still override component-token defaults. Public Card props, root package exports, package metadata and semantic color behavior are unchanged. Card remains `beta`; PLRNUI-32 does not promote it to `stable`.

### PLRNUI-56 - Optional ThemeStorageAdapter persistence

`ThemeProvider` now supports opt-in persistence through a consumer-provided adapter:

```tsx
<ThemeProvider persistTheme storage={themeStorage} storageKey="app.theme">
  ...
</ThemeProvider>
```

Default behavior remains non-persistent. Consumers that do not pass `persistTheme` and `storage` continue to get in-memory theme mode only.

PLRNUI-56 does not add package dependencies, does not import a storage backend, does not add an official async-storage adapter subpath, and does not modify `ThemeAppShell` or safe-area behavior.

Persisted values are limited to `light` and `dark`. The `"system"` mode proposed in `audit/dependencies/theme-persistence-strategy.md` remains deferred until runtime theme-mode support is added.

### PLRNUI-28 - ThemeProvider app-shell split

Before:

```tsx
<ThemeProvider withScroll={false}>...</ThemeProvider>
```

After pure provider:

```tsx
<ThemeProvider>...</ThemeProvider>
```

After app shell:

```tsx
<ThemeProvider>
  <ThemeAppShell scroll>
    ...
  </ThemeAppShell>
</ThemeProvider>
```

`ThemeAppShell` defaults `scroll` to `false`. PLRNUI-28 does not add safe-area support, does not import `react-native-safe-area-context`, does not add AsyncStorage and does not change package metadata.

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
- Deprecated AURA token names `auraTokens` and `getAuraTokens` with no compatibility aliases; PLRNUI-53 confirms they are not stable public API and must not appear in consumer examples.
- Deprecated unsupported consumer guidance based on deep imports, repo-relative imports or internal source/build paths.
- Deprecated treating beta, experimental or internal API as stable without promotion evidence.
- Deprecated consuming internal helpers such as `cn` and `useIsMounted` from the package root; PLRNUI-26 removes them from root and keeps them non-consumer-facing.

### Removed

- PLRNUI-26 removes `cn` and `useIsMounted` from root exports as pre-stable internal helper fencing.
- No package metadata, dependency declarations, build config or package subpath entrypoints were removed in PLRNUI-26.
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
- PLRNUI-23 overlay/form modal contracts are documented and smoke-rendered, but stable promotion remains blocked by platform runtime, focus, keyboard and accessibility evidence.
- PLRNUI-24 completes the approved root-public component props type export set for this checkout, but release readiness still requires clean consumer TypeScript declaration resolution under PLRNUI-46.
- PLRNUI-26 reduces root API risk by fencing internal helper exports and documenting experimental exports, but release readiness remains blocked by clean consumer and stable-gate evidence.
- Historical PLRNUI-9 audit records still contain legacy AURA imports and repo-relative demo import findings. PLRNUI-25 confirms that current `docs/`, `examples/`, `demo/` and `preview-web/` paths are absent in this checkout, adds a canonical README root import example, and preserves historical audit references as migration notes.
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
