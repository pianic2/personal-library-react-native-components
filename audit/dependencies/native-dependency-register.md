# PLRNUI-44 - Native Dependency Register

## Scope

This register covers native or potentially native dependencies for the current core package.

Evidence sources:

- `package.json`
- `package-lock.json`
- `src/index.ts`
- `audit/dependencies/safe-area-provider-dependency-contract.md`
- `audit/dependencies/theme-persistence-strategy.md`
- `audit/dependencies/clipboard-dependency-strategy.md`
- `audit/dependencies/native-dependency-gate.md`
- `audit/dependencies/peer-dependency-policy.md`

PLRNUI-44 is documentation/governance only. It does not add dependencies, change package metadata, change runtime code, implement adapters, or run/create consumer smoke tests.

## Current native dependency state

| Package | Current package section | Native/runtime status | Governance owner | PLRNUI-44 decision |
| --- | --- | --- | --- | --- |
| `react-native` | `peerDependencies` | Host native runtime | Consumer application | Required host peer aligned to RN `0.85.x`; must not be bundled. |
| `react-native-safe-area-context` | Not declared | RN native safe-area module | Future safe-area API governance | Not required by pure `ThemeProvider` after PLRNUI-28; no metadata change. |
| `@react-native-async-storage/async-storage` | Not declared | RN native storage module | Consumer application | Consumer-owned adapter backend only; not core runtime. |
| `expo-clipboard` | Not declared | Expo native/runtime module | Consumer application | Excluded from core runtime and root peer dependency; optional adapter backend only. |
| `react-native-svg` | Not declared | RN native SVG module | Not approved for core metadata in this task | Future native dependency gate required before introduction. |
| `lucide-react-native` | Not declared | JS icon wrapper with native SVG peer | Not approved for core metadata in this task | Future native-adjacent gate required before introduction. |

`package.json` currently has no `dependencies` section. The root package in `package-lock.json` has only:

- `devDependencies`: `typescript`
- `peerDependencies`: `react`, `react-native`

`src/index.ts` currently exports `PACKAGE_NAME` plus governed root APIs. There is no current source import evidence for AsyncStorage, Clipboard, Safe Area, SVG, or Lucide in the published source tree.

## Native dependency detail

### `react-native`

- Current declaration: `peerDependencies`.
- Current range: `>=0.85.0 <0.86.0`.
- Baseline: Expo SDK `56.0.0`, React Native `0.85.x`.
- Ownership: consumer app.
- Policy: keep as peer; never bundle React Native in `dependencies`.
- Validation: clean consumer install/import/runtime proof remains PLRNUI-46.

### `react-native-safe-area-context`

- Current declaration: not declared in `package.json`.
- Contract decision: PLRNUI-28 supersedes the prior default-provider contract by making `ThemeProvider` pure and keeping safe-area support out of this ticket.
- Ownership: consumer app owns installation, autolinking/setup and Expo/RN compatibility.
- PLRNUI-44 decision: no package metadata change for Safe Area.
- Future metadata change: must pass package/consumer validation and separate safe-area governance.

### `@react-native-async-storage/async-storage`

- Current declaration: not declared in `package.json`.
- Strategy decision: PLRNUI-38 says theme persistence must be optional and adapter-based.
- Ownership: consumer app owns AsyncStorage, MMKV, SecureStore, custom storage, or no storage.
- Core package rule: no direct import from root package or root-reachable core theme runtime; no required runtime dependency.
- PLRNUI-44 decision: AsyncStorage remains consumer-owned. `ThemeStorageAdapter` is not implemented in this task.

### `expo-clipboard`

- Current declaration: not declared in `package.json`.
- Strategy decision: PLRNUI-39 says clipboard support is optional, adapter-based and consumer-owned.
- Ownership: consumer app owns `expo-clipboard` if it chooses the Expo implementation.
- Core package rule: do not import, bundle, add to `dependencies`, add to `peerDependencies`, add to `peerDependenciesMeta`, add to `optionalDependencies`, or add to `devDependencies`.
- PLRNUI-44 decision: Clipboard remains excluded from the core runtime package and root peer dependency contract.

### `react-native-svg` and `lucide-react-native`

- Current declaration: not declared in `package.json`.
- Current source import evidence: none in `src/index.ts`.
- Policy: not approved as core runtime dependencies by PLRNUI-44.
- Future use requires native dependency gate review, Expo SDK compatibility assessment and PLRNUI-46 consumer smoke coverage if package install/import/runtime behavior is affected.

## Consumer-owned native dependency policy

A native dependency is consumer-owned when the core package can define a contract or recipe without owning the native module installation.

Consumer-owned dependencies:

- must not be added to core `dependencies`;
- must not be imported from the package root or root-reachable default runtime path;
- may be documented as consumer recipes only after the relevant adapter/API exists;
- require a separate ticket before an official adapter package, subpath or export is introduced;
- require Expo/RN compatibility validation in the consumer app that chooses the dependency.

AsyncStorage and Clipboard are consumer-owned under this policy.

## Expo/RN workflow summary

| Package | Expo Go | Managed workflow | Prebuild/custom dev client | Bare RN |
| --- | --- | --- | --- | --- |
| `react-native` | Must match Expo SDK `56.0.0` bundled RN `0.85.x`. | Consumer owns Expo/RN pair. | Consumer owns generated native project. | Consumer owns RN install. |
| `react-native-safe-area-context` | Must be validated for selected Expo SDK if/when a future API or metadata requires it. | Consumer installs SDK-compatible version if they choose or an API requires it. | Consumer owns native setup if needed. | Consumer owns autolinking/setup. |
| AsyncStorage | Consumer validates when choosing AsyncStorage adapter. | Consumer installs SDK-compatible version. | Consumer-owned if Expo Go does not support the selected module/version. | Consumer owns autolinking/setup. |
| Clipboard | Consumer validates when choosing Expo Clipboard adapter. | Consumer installs SDK-compatible `expo-clipboard`. | Consumer-owned if Expo Go does not support the selected module/version. | Expo Clipboard is not a general bare-RN core requirement. |
| SVG/Lucide RN | Not approved in current core metadata. | Requires future gate. | Requires future gate. | Requires future gate. |

## Required gate for new native dependencies

Before introducing any new native or native-adjacent dependency, the project must document:

- Jira ticket;
- proposed package section;
- source/API import path;
- native/autolinking/config plugin status;
- Expo Go compatibility;
- Expo managed workflow compatibility;
- prebuild/custom dev client requirement;
- bare RN impact;
- JS-only or adapter-based alternatives;
- ADR requirement decision;
- Risk Assessment requirement decision;
- breaking-change register impact;
- PLRNUI-46 smoke scenario.

## Final verdict

The current core package has no bundled native runtime dependency.

AsyncStorage and Clipboard remain consumer-owned. Safe Area is not required by pure `ThemeProvider` after PLRNUI-28 and remains future API governance. PLRNUI-44 does not add dependencies and does not duplicate PLRNUI-45 or PLRNUI-46.
