# PLRNUI-44 - Peer Dependency Policy

## Evidence base

- `package.json` currently declares `react` and `react-native` as peer dependencies.
- `package.json` currently declares only `typescript` as a dev dependency.
- `package.json` currently declares no runtime `dependencies`.
- `package-lock.json` root package repeats the same root `devDependencies` and `peerDependencies`.
- ADR 0005 says React and React Native host dependencies should be modeled as peers, native dependencies must be controlled, and Expo-specific dependencies must be documented/isolated.
- ADR 0006 requires peer dependencies to be coherent and duplicate React/RN to be avoided before release.
- PLRNUI-37 governs `react-native-safe-area-context`.
- PLRNUI-38 governs theme persistence and AsyncStorage ownership.
- PLRNUI-39 governs clipboard and `expo-clipboard` ownership.

## Approved baseline

The package remains aligned to the approved baseline:

- Expo SDK: `56.0.0`
- React Native: `0.85.x`
- React: `19.2.3`
- Minimum Node: `22.13.x`

PLRNUI-44 does not change the baseline or widen compatibility.

## Current peer policy

```json
{
  "peerDependencies": {
    "react": ">=19.2.3 <20.0.0",
    "react-native": ">=0.85.0 <0.86.0"
  }
}
```

`react` and `react-native` are host runtimes. They are owned by the consuming app and must not be bundled by the library.

## Package section policy

| Section | Allowed content | Current state |
| --- | --- | --- |
| `dependencies` | JS-only packages required by published runtime code and not owned by the host app, after dependency gate review. | None. |
| `peerDependencies` | Host runtimes and approved required consumer-owned runtime contracts. | `react`, `react-native`. |
| `peerDependenciesMeta` | Optional peer flags only after an approved optional-peer decision. | None. |
| `optionalDependencies` | Avoid for core package native features unless separately approved. | None. |
| `devDependencies` | Build/typecheck/test/docs/preview tooling. | `typescript`. |

## React

`react` must remain a `peerDependency`.

Rationale:

- React is the host renderer runtime.
- Bundling React risks duplicate React instances.
- The approved Expo SDK baseline uses React `19.2.3`.

Current policy:

```json
{
  "peerDependencies": {
    "react": ">=19.2.3 <20.0.0"
  }
}
```

## React Native

`react-native` must remain a `peerDependency`.

Rationale:

- React Native is the host native runtime.
- Consumer applications own native runtime installation, Metro integration and platform setup.
- Bundling React Native risks duplicate/incompatible native runtime versions.

Current policy:

```json
{
  "peerDependencies": {
    "react-native": ">=0.85.0 <0.86.0"
  }
}
```

## Safe Area

`react-native-safe-area-context` remains governed by the PLRNUI-37 safe-area provider dependency contract.

Policy:

- If `ThemeProvider` keeps default safe-area behavior, Safe Area is a required peer contract.
- The consumer owns installation and Expo/RN compatibility.
- Do not place Safe Area in `dependencies`.
- Do not mark Safe Area optional while default provider behavior requires it.
- PLRNUI-44 does not modify package metadata for Safe Area and does not reopen the PLRNUI-37 decision.

## AsyncStorage

`@react-native-async-storage/async-storage` must not become a required runtime dependency of the core package.

Policy:

- Theme persistence is adapter-based and consumer-owned.
- AsyncStorage may be documented only as a consumer-provided implementation after the relevant API exists.
- The core package must not import AsyncStorage directly from root package or root-reachable theme runtime code.
- AsyncStorage must not be added to core `dependencies` by PLRNUI-44.
- `ThemeStorageAdapter` is not implemented in PLRNUI-44.

## Clipboard

`expo-clipboard` must not become a root peer dependency or runtime dependency of the core package.

Policy:

- Clipboard support is optional, adapter-based and consumer-owned.
- Expo consumers may implement a clipboard adapter using `expo-clipboard`.
- The core package must not import `expo-clipboard` directly.
- The core package must not add `expo-clipboard` to `dependencies`, `peerDependencies`, `peerDependenciesMeta`, `optionalDependencies`, or `devDependencies`.
- An official Expo adapter requires a separate future ticket and package/entrypoint decision.

## Expo modules

Expo-specific packages must be classified before introduction:

| Class | Policy | Required evidence |
| --- | --- | --- |
| Core required Expo module | Avoid unless owner explicitly makes package Expo-only. | ADR and release risk review. |
| Optional feature module | Prefer consumer-owned adapter or optional peer only after approval. | API boundary, fallback behavior, docs and consumer smoke. |
| Preview/demo-only Expo module | Dev-only and excluded from core package contract. | Proof it is not root-reachable runtime code. |

`expo-clipboard` is currently excluded from the core package under PLRNUI-39.

## Native dependency gate

Native modules must not be introduced silently as hard runtime dependencies.

Every new native or native-adjacent dependency requires:

- Jira ticket;
- package section decision;
- source/API import evidence;
- Expo Go, managed workflow, prebuild/custom dev client and bare RN impact;
- ADR decision if baseline, architecture, public API or default behavior changes;
- Risk Assessment decision for unresolved native/runtime uncertainty;
- breaking-change register update when consumers must install new peers or behavior changes;
- PLRNUI-46 consumer smoke coverage when install/import/runtime behavior is affected.

## What must not become a core runtime dependency without a new decision

| Package | Reason |
| --- | --- |
| `react` | Host runtime peer. |
| `react-native` | Host native runtime peer. |
| `react-native-safe-area-context` | Consumer-owned native peer under PLRNUI-37 when required. |
| `@react-native-async-storage/async-storage` | Consumer-owned storage adapter backend under PLRNUI-38. |
| `expo-clipboard` | Consumer-owned optional clipboard adapter backend under PLRNUI-39. |
| `react-native-svg` | Native module requiring future gate before introduction. |
| `lucide-react-native` | Native-adjacent icon package requiring future gate before introduction. |
| `react-dom` | Web host runtime, not native core runtime. |
| `react-native-web` | Web runtime adapter, not native core runtime. |

## Relationship to PLRNUI-45 and PLRNUI-46

PLRNUI-44 formalizes governance policy and current package classification.

It does not implement runtime/API behavior, adapter code, package metadata changes for new native peers, or clean Expo consumer smoke coverage. Consumer smoke validation remains PLRNUI-46. Any separate implementation work remains outside PLRNUI-44.

## Final decision

The current core package peer policy is:

- `react` required peer;
- `react-native` required peer;
- no core runtime `dependencies`;
- `typescript` dev-only;
- AsyncStorage and Clipboard consumer-owned;
- Safe Area governed by the approved PLRNUI-37 contract;
- new native dependencies blocked until the native dependency gate is satisfied.
