# PLRNUI-44 - Dependency Classification

## Scope

This file classifies package dependencies for the current `@personal-library/react-native-components` checkout.

PLRNUI-44 is a governance consolidation task. It does not change runtime code, public API, package metadata, lockfiles, Expo/RN baseline, Jira state or Confluence state.

## Current package state

Evidence collected from `package.json`, the root package object in `package-lock.json`, and `src/index.ts`.

| Section | Current packages | Governance classification |
| --- | --- | --- |
| `dependencies` | None | No bundled runtime dependency is currently declared. |
| `peerDependencies` | `react`, `react-native` | Host runtime dependencies owned by the consumer application. |
| `devDependencies` | `typescript` | Build/typecheck dependency only. |
| `optionalDependencies` | None | No optional package metadata is currently declared. |
| `peerDependenciesMeta` | None | No optional peer metadata is currently declared. |

Current package evidence:

- `package.json` exposes `main`, `module`, `types`, and root `exports["."]` from `dist`.
- `package.json` `files` includes `dist`, `README.md`, and `LICENSE`.
- `package.json` `engines.node` is `>=22`.
- `src/index.ts` currently exports only `PACKAGE_NAME`.
- `package-lock.json` root package repeats `typescript` as `devDependencies` and `react` / `react-native` as `peerDependencies`.

## Approved baseline

The dependency policy remains aligned to the approved baseline:

| Runtime | Baseline |
| --- | --- |
| Expo SDK | `56.0.0` |
| React Native | `0.85.x` |
| React | `19.2.3` |
| Node minimum | `22.13.x` |

`package.json` currently expresses this as:

```json
{
  "engines": {
    "node": ">=22"
  },
  "peerDependencies": {
    "react": ">=19.2.3 <20.0.0",
    "react-native": ">=0.85.0 <0.86.0"
  }
}
```

PLRNUI-44 does not change this baseline.

## Dependency ownership classes

| Class | Definition | Package metadata rule | Current examples |
| --- | --- | --- | --- |
| Runtime dependency | JS package required by published runtime code and not owned by the host app. | May be in `dependencies` only with import evidence and native-impact review. | None in current package metadata. |
| Peer dependency | Host runtime or required consumer-owned runtime contract. | Must be installed by the consuming app. | `react`, `react-native`. |
| Dev dependency | Build, typecheck, docs, preview or release tooling only. | Must stay out of consumer runtime install. | `typescript`. |
| Consumer-owned native dependency | Native/runtime-sensitive package needed only by an optional feature, adapter, app-shell concern or consumer implementation. | Must not be added to core `dependencies`; peer/optional peer status requires a separate approved package-metadata decision. | AsyncStorage and clipboard remain consumer-owned. |

## Current classification

| Package | Current section | Classification | Governance decision | Evidence |
| --- | --- | --- | --- | --- |
| `react` | `peerDependencies` | Required host peer dependency | Keep as consumer-owned host runtime peer for the approved React 19 baseline. | `package.json`; `package-lock.json` root package. |
| `react-native` | `peerDependencies` | Required host peer dependency | Keep as consumer-owned host runtime peer for RN `0.85.x`; do not bundle as runtime dependency. | `package.json`; `package-lock.json` root package; ADR 0005 / ADR 0006 policy. |
| `typescript` | `devDependencies` | Dev/build/typecheck dependency | Keep dev-only; not a runtime dependency. | `package.json` scripts and `devDependencies`; `package-lock.json` root package. |
| `react-native-safe-area-context` | Not declared | Future safe-area API governance | Not required by pure `ThemeProvider` after PLRNUI-28. Package metadata is unchanged. | `audit/dependencies/safe-area-provider-dependency-contract.md`. |
| `@react-native-async-storage/async-storage` | Not declared | Consumer-owned native dependency | Must not be imported directly by the library core or added as a required runtime dependency. Theme persistence remains adapter-based. | `audit/dependencies/theme-persistence-strategy.md`. |
| `expo-clipboard` | Not declared | Consumer-owned optional native/runtime integration | Must not be imported, bundled, added as runtime dependency, or promoted to root peer dependency of the core package. | `audit/dependencies/clipboard-dependency-strategy.md`. |
| `react-native-svg` | Not declared | Native dependency candidate only if icon/native SVG functionality is introduced | Requires the native dependency gate before any package metadata or runtime use. | `audit/dependencies/native-dependency-gate.md`. |
| `lucide-react-native` | Not declared | Native-adjacent dependency candidate only if icon functionality is introduced | Requires native-adjacent dependency review because it peers on SVG/native runtime. | `audit/dependencies/native-dependency-gate.md`. |
| `react-dom` | Not declared | Web host runtime candidate | Not part of the native core runtime package. Requires separate web support decision if promoted. | `package.json`; `audit/dependencies/peer-dependency-policy.md`. |
| `react-native-web` | Not declared | Web runtime adapter candidate | Not part of the native core runtime package. Requires separate web support decision if promoted. | `package.json`; `audit/dependencies/peer-dependency-policy.md`. |

## PLRNUI-44 decisions

1. The current core package has no `dependencies` entries and therefore no bundled native runtime dependency.
2. `react` and `react-native` are host runtime peer dependencies owned by the consumer.
3. `typescript` is a dev/build dependency only.
4. `@react-native-async-storage/async-storage` remains consumer-owned and adapter-based; it is not a core runtime dependency.
5. `expo-clipboard` remains excluded from the core runtime package and root peer dependency contract.
6. `react-native-safe-area-context` is not required by pure `ThemeProvider` after PLRNUI-28; future safe-area API work must reopen dependency governance.
7. PLRNUI-44 does not implement `ThemeStorageAdapter`; implementation remains a separate future code task.
8. PLRNUI-44 does not create a clean Expo consumer smoke test; executable consumer validation remains PLRNUI-46.

## Gate before introducing any new native dependency

Before adding any native or native-adjacent dependency to package metadata or root-reachable runtime code, the change must have:

- a Jira ticket for the dependency change;
- package name, version/range and proposed package section;
- source/API import evidence;
- classification as required peer, optional peer, consumer-owned adapter, dev-only or rejected core dependency;
- Expo Go, Expo managed workflow, prebuild/custom dev client and bare RN impact notes;
- config plugin and autolinking assessment;
- ADR decision when the dependency changes baseline, public contract, default provider behavior or package architecture;
- Risk Assessment decision when Expo/native/runtime uncertainty remains;
- breaking-change register update when consumers must install a new peer, behavior changes, or public APIs move;
- PLRNUI-46 consumer smoke coverage when install/import/runtime behavior is affected.

## Release impact

PLRNUI-44 is governance-only and does not introduce a new breaking change by itself.

Release readiness remains blocked on executable consumer validation and any future package metadata decision that introduces required or optional native peers.
