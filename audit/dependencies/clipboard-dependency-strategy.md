# Clipboard Dependency Strategy

- Jira: PLRNUI-39
- Parent initiative: PLRNUI-35 - PLRNUI Dependency & Native Runtime Governance
- Status: Accepted decision for implementation planning
- Date: 2026-06-22

## Decision

PLRNUI must not import or bundle `expo-clipboard` directly.

Clipboard support is optional, adapter-based, and owned by the consuming application. Expo consumers may implement the adapter using `expo-clipboard`, but the core package must not add `expo-clipboard` to `dependencies`, `peerDependencies`, `peerDependenciesMeta`, `optionalDependencies`, or `devDependencies`.

The core package must not import `expo-clipboard` from the root package or any root-reachable core runtime path.

## Dependency Classification

| Field | Decision |
| --- | --- |
| Dependency type | Optional native/runtime integration |
| Owner | Consumer application |
| Core package import | Forbidden |
| Root `peerDependency` | Not required |
| Root runtime dependency | Forbidden |
| Expo usage | Allowed only as a consumer-provided adapter implementation |
| Release impact | Low / medium, additive if implemented later as opt-in |
| Breaking change | No, unless existing public clipboard APIs are replaced or removed |

## Rationale

`expo-clipboard` is an Expo native module. Making it a direct runtime dependency would make a general React Native UI package carry an Expo-specific native requirement, even for consumers that do not use clipboard behavior.

Clipboard behavior is feature-specific. It should not decide the installability, native module graph, Expo SDK compatibility, or prebuild/custom-dev-client requirements of the entire package.

The governance direction established by PLRNUI-37 and PLRNUI-38 is to make native/runtime-sensitive features explicit and consumer-owned. Clipboard follows the same pattern: the library can define the contract, while the application chooses and installs the implementation.

## Expo Impact

Expo applications may use `expo-clipboard` as the adapter backend.

Example consumer-owned Expo implementation:

```ts
import * as Clipboard from 'expo-clipboard';

export const expoClipboardAdapter = {
  setString: Clipboard.setStringAsync,
  getString: Clipboard.getStringAsync,
};
```

Expo consumers remain responsible for installing an Expo SDK-compatible version:

```sh
npx expo install expo-clipboard
```

The library must document this only as an Expo consumer recipe, not as a package dependency requirement.

## Consumer Responsibilities

The consumer application owns:

- deciding whether clipboard support is needed;
- selecting the clipboard backend;
- installing `expo-clipboard`, a platform clipboard API, or another implementation;
- validating Expo Go, managed workflow, bare React Native, prebuild, and custom dev-client compatibility;
- passing the adapter to the library API when clipboard support is enabled;
- handling platform permission, API availability, and fallback behavior required by the chosen backend.

## Library Responsibilities

The library owns:

- defining a stable `ClipboardAdapter` contract if clipboard support is exposed;
- keeping clipboard behavior opt-in;
- rendering and installing without a clipboard backend;
- avoiding direct `expo-clipboard` imports in the core package;
- avoiding `expo-clipboard` in root package dependencies and root peer dependencies;
- documenting Expo Clipboard only as one consumer-side adapter recipe;
- keeping any future official Expo adapter outside the core package unless a separate ticket approves its package, entrypoint, and dependency policy.

## Future API Strategy

The proposed future contract is:

```ts
export interface ClipboardAdapter {
  setString(value: string): Promise<boolean | void>;
  getString?: () => Promise<string>;
}
```

Possible future integration shape:

```ts
export interface ClipboardFeatureOptions {
  clipboard?: ClipboardAdapter;
}
```

This document does not implement the contract and does not change public exports.

## Official Expo Adapter Policy

An official Expo adapter may be considered later only as a separate package, subpath, or adapter entrypoint with its own dependency governance.

Candidate future shape:

```txt
@personal-library/react-native-components/adapters/expo-clipboard
```

That adapter is not introduced by PLRNUI-39. It requires a future ticket if product ergonomics justify it.

## Release Impact

Impact classification: low / medium.

The decision is non-breaking while it remains governance-only or is implemented as additive opt-in API.

The decision becomes breaking only if:

- an existing public clipboard API is removed;
- an existing public clipboard API changes signature;
- default clipboard behavior stops working for existing consumers without an opt-in replacement;
- consumers must install a new native dependency to preserve current behavior.

## Acceptance Criteria Mapping

| Acceptance criterion | Coverage |
| --- | --- |
| Core does not add `expo-clipboard` as runtime dependency | Decision, Dependency Classification, Library Responsibilities |
| Core does not import `expo-clipboard` directly | Decision, Library Responsibilities, Verification Checklist |
| Clipboard support is optional and adapter-based | Decision, Future API Strategy |
| Consumer owns native/runtime implementation | Consumer Responsibilities |
| Expo consumers may use `expo-clipboard` | Expo Impact |
| Official Expo adapter is not introduced now | Official Expo Adapter Policy |
| No package metadata change in PLRNUI-39 | Decision, Release Impact |
| No breaking change declared for documentation-only decision | Release Impact |

## Non-Goals

- No runtime implementation.
- No package metadata change.
- No `expo-clipboard` dependency, peer dependency, optional dependency, or dev dependency.
- No Confluence page.
- No Jira update or transition.
- No official Expo adapter package or subpath in this task.
- No replacement or removal of existing public clipboard APIs in this task.

## Verification Checklist

- [ ] `package.json` does not declare `expo-clipboard` in `dependencies`.
- [ ] `package.json` does not declare `expo-clipboard` in `peerDependencies`.
- [ ] `package.json` does not declare `expo-clipboard` in `devDependencies`.
- [ ] Core source does not import `expo-clipboard` directly.
- [ ] Clipboard support, when implemented, is exposed through `ClipboardAdapter`.
- [ ] Expo usage is documented as a consumer-owned adapter recipe.
- [ ] Native dependency register classifies `expo-clipboard` as optional consumer-owned integration.
- [ ] Peer dependency policy states that `expo-clipboard` must not become a root peer of the core package.
- [ ] Migration changelog records PLRNUI-39 as governance/dependency strategy, not a breaking change.
- [ ] Breaking change register records no breaking change unless public clipboard APIs are replaced.

## Final Decision Summary

PLRNUI core must stay clipboard-backend agnostic.

`expo-clipboard` is a valid Expo consumer implementation of a future `ClipboardAdapter`, but it is not a runtime dependency, peer dependency, or direct import of the core package.
