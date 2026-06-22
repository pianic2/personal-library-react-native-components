# PLRNUI-37 - Safe Area Provider Dependency Contract

## Scope

This decision documents the dependency contract for `react-native-safe-area-context` as part of the public/runtime behavior of `ThemeProvider`.

It does not change runtime code, exports, package metadata, lockfiles, build configuration or test configuration. It records the approved Method A decision: `ThemeProvider` keeps integrated safe-area behavior, and `react-native-safe-area-context` is part of the runtime contract for consumers that use `ThemeProvider`.

## Evidence

- ThemeProvider import/usage: existing audit evidence records `theme/ThemeProvider.tsx` importing and rendering `SafeAreaProvider` and `SafeAreaView`; `audit/theme/theme-provider-responsibility.md` states that `ThemeProvider` renders safe-area wrappers by default and that `withSafeArea` can disable the wrapper.
- Current checkout verification: `grep -R "react-native-safe-area-context" -n . --exclude-dir=node_modules --exclude-dir=dist --exclude-dir=.git` finds audit/release/dependency references only; `find . ... -name ThemeProvider.tsx` and `git ls-tree -r --name-only HEAD` do not show a current `ThemeProvider.tsx` source file in this checkout. The contract below is therefore based on the approved PLRNUI-37 architecture decision and existing audit evidence, not a runtime code change in this task.
- Default behavior: `audit/theme/theme-provider-responsibility.md` documents current default `withSafeArea = true`; `audit/dependencies/native-dependency-register.md` also records `ThemeProvider` as root exported with default `withSafeArea = true`.
- Root/public export: `audit/api/export-matrix.md` classifies `ThemeProvider` as root exported from `theme/ThemeProvider.tsx`, provider, public/beta. `audit/theme/theme-provider-responsibility.md` also marks `ThemeProvider` as root exported through `index.ts` -> `theme/index.ts`. In the current checkout, `src/index.ts` only exports `PACKAGE_NAME`; this is a current-tree mismatch against prior audit evidence and does not change the PLRNUI-37 dependency contract decision.
- Native dependency register: `audit/dependencies/native-dependency-register.md` lists `react-native-safe-area-context` as an RN native safe-area module used by the `ThemeProvider` default wrapper, with consumer risk because the default provider behavior makes the native dependency effectively required.
- Peer dependency policy: `audit/dependencies/peer-dependency-policy.md` says `react-native-safe-area-context` is a peer if `ThemeProvider` keeps default safe-area behavior and optional only if safe-area becomes opt-in or isolated from the core provider.
- Migration/breaking-change notes: `audit/migration/breaking-change-register.md` tracks native dependency requirements under BC-006. This PLRNUI-37 decision specializes that candidate breaking-change note for consumers that use `ThemeProvider`.

## Decision

`react-native-safe-area-context` remains a required peer dependency while `ThemeProvider` keeps safe-area behavior enabled by default.

## Rationale

`ThemeProvider` currently owns safe-area behavior as an integrated app-shell responsibility according to the existing theme responsibility audit. Safe-area handling protects layouts from device notches, status bars, home indicators and gesture bars; when that behavior is enabled by default, the safe-area provider is not an incidental implementation detail for consumers using `ThemeProvider`.

Because `ThemeProvider` is documented by the audit set as part of the public/root API, the dependency needed by its default render path must be explicit. Marking `react-native-safe-area-context` optional while leaving the provider behavior unchanged would describe an inaccurate contract: consumers could omit a package that the default provider path still requires.

Bundling `react-native-safe-area-context` in `dependencies` is also the wrong ownership model for a React Native library. It increases the chance of duplicate or incompatible native runtime versions and hides native setup from the app that owns the Expo/RN runtime. A required peer dependency is the correct compromise: the consumer owns installation and native compatibility, while the library states the runtime contract clearly.

## Consumer Impact

Consumers that use `ThemeProvider` must install `react-native-safe-area-context` explicitly.

Expo consumers must choose a `react-native-safe-area-context` version compatible with the selected Expo SDK. Bare React Native consumers own autolinking and any native setup required by their app environment.

The library must not hide this dependency as an internal bundled dependency while `ThemeProvider` keeps default safe-area behavior. Clean consumer smoke must validate install, root import, `ThemeProvider` import and a render path with safe-area behavior enabled.

## Package Metadata Policy

`react-native-safe-area-context` must be declared in `peerDependencies` for the current `ThemeProvider` contract.

It must not be placed in `dependencies` because the consumer app owns the React Native native runtime and native module compatibility.

It must not be marked optional in `peerDependenciesMeta` while `ThemeProvider` keeps safe-area behavior enabled by default.

The final version/range remains a package-metadata decision that must be validated against the selected Expo SDK and React Native baseline through clean consumer smoke.

## ADR Requirement

No new ADR is required because PLRNUI-37 confirms the current provider contract.

A future ADR is required only if:

- safe-area behavior becomes opt-in;
- `ThemeProvider` is split from `SafeAreaProvider` behavior;
- adapter or fallback behavior is introduced;
- provider responsibility changes.

## Release / Migration Notes

This is a consumer-facing dependency contract note.

Consumers must explicitly install the required peer dependency `react-native-safe-area-context` when they use `ThemeProvider`. Release notes must mention the required peer and the need to choose an Expo/RN-compatible version.

If package metadata moves this package from bundled dependency to peer dependency, migration notes must call out the explicit install requirement and the clean consumer smoke requirement.

## Final Verdict

Required peer dependency.

Not optional.

No runtime change in this task.
