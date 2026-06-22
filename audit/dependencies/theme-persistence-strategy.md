# Theme Persistence Strategy

- Issue: PLRNUI-38
- Area: Dependency & Native Runtime Governance
- Status: Accepted decision for implementation planning
- Date: 2026-06-22

## 1. Scope

This document defines the architecture decision for theme persistence in `@personal-library/react-native-components`.

The scope is limited to release and dependency governance for theme storage. It does not implement code, change package metadata, add dependencies, update public exports, or create a new ADR in another audit folder.

This decision covers:

- whether the UI library should import `@react-native-async-storage/async-storage` directly;
- where storage backend ownership belongs;
- the proposed `ThemeStorageAdapter` contract;
- default non-persistent behavior;
- hydration behavior when persistence is enabled;
- release impact for package consumability.

## 2. Context

PLRNUI-38 belongs to PLRNUI-35, which governs dependency and native runtime decisions for the package.

The declared evidence for this decision is:

- `audit/dependencies/native-dependency-register.md`;
- `audit/dependencies/dependency-classification.md`.

Those documents classify `@react-native-async-storage/async-storage` as a React Native native storage module with consumer install, Expo compatibility, managed workflow, and prebuild/dev-client implications. Theme persistence is useful for application UX, but the storage backend is native-runtime-sensitive and must remain owned by the consumer application.

## 3. Problem

Persisting theme mode requires a storage backend. In React Native and Expo applications, `@react-native-async-storage/async-storage` is a common backend, but it is not a pure JavaScript UI dependency.

If the UI library imports AsyncStorage directly, the package creates an implicit native runtime requirement for all consumers, including consumers that do not need theme persistence. That would make package installation and native compatibility depend on an optional feature.

The library must support theme persistence without turning AsyncStorage into a mandatory runtime dependency.

## 4. Decision

The accepted direction is:

```txt
UI library -> defines ThemeStorageAdapter contract
Consumer app -> provides AsyncStorage / MMKV / SecureStore / custom adapter / no storage
```

The rejected direction is:

```txt
UI library -> imports AsyncStorage directly
```

`@personal-library/react-native-components` must not add `@react-native-async-storage/async-storage` as a required runtime dependency.

Theme persistence must be optional and adapter-based. The UI library must remain storage-agnostic and native-runtime-light. The consumer application must own the concrete storage backend choice.

AsyncStorage is allowed only as an optional implementation supplied by the consumer. It must not be imported directly by the root package or by core theme runtime code.

## 5. Proposed Contract

The following TypeScript contract is the proposed implementation direction. This document does not implement it.

```ts
export type ThemeMode = 'light' | 'dark' | 'system';

export interface ThemeStorageAdapter {
  getItem(key: string): Promise<string | null>;
  setItem(key: string, value: string): Promise<void>;
  removeItem?(key: string): Promise<void>;
}

export interface ThemeProviderProps {
  initialMode?: ThemeMode;
  storage?: ThemeStorageAdapter;
  storageKey?: string;
  persistTheme?: boolean;
}
```

Consumer-owned AsyncStorage recipe:

```tsx
import AsyncStorage from '@react-native-async-storage/async-storage';
import { ThemeProvider } from '@personal-library/react-native-components';

export function App() {
  return (
    <ThemeProvider
      initialMode="system"
      persistTheme
      storage={AsyncStorage}
      storageKey="personal-library.theme"
    >
      {/* app */}
    </ThemeProvider>
  );
}
```

## 6. Library Responsibilities

The library is responsible for:

- exposing a stable `ThemeStorageAdapter` contract;
- keeping `ThemeProvider` functional when no storage adapter is provided;
- avoiding direct imports from `@react-native-async-storage/async-storage` in the root package and core theme runtime;
- providing deterministic fallback behavior when persistence is disabled;
- handling asynchronous hydration safely;
- validating persisted values before applying them;
- ignoring invalid persisted values;
- documenting AsyncStorage only as an optional consumer recipe.

The library must not:

- require AsyncStorage to render;
- store sensitive data through theme persistence APIs;
- assume a specific storage backend;
- block installation or package consumability for an optional feature;
- introduce native dependencies without governance approval.

## 7. Consumer Responsibilities

The consumer application is responsible for:

- choosing the storage backend;
- installing and configuring the selected package;
- passing the adapter to `ThemeProvider`;
- validating Expo, React Native, and native runtime compatibility;
- accepting asynchronous hydration behavior when persistence is enabled;
- deciding whether theme persistence is required;
- avoiding sensitive data in theme storage.

For AsyncStorage in Expo, the consumer installs:

```sh
npx expo install @react-native-async-storage/async-storage
```

Outside Expo, the consumer installs:

```sh
npm install @react-native-async-storage/async-storage
```

## 8. Default Behavior

The default behavior must remain non-persistent.

When no storage adapter is passed:

- `ThemeProvider` functions normally;
- theme mode can be controlled in memory;
- no persistence is attempted;
- no mandatory warning is emitted;
- a development-only warning is allowed when `persistTheme=true` and `storage` is missing.

Recommended behavior matrix:

| Configuration | Status | Behavior |
| --- | --- | --- |
| `persistTheme=false` and no `storage` | Valid | In-memory theme state only. |
| `persistTheme=true` and `storage` provided | Valid | Theme state is hydrated and persisted through the adapter. |
| `persistTheme=true` and no `storage` | Valid no-op | Persistence is skipped; development warning is allowed. |

## 9. Hydration Policy

Hydration is asynchronous when a storage backend exists.

The recommended policy is:

1. Render using `initialMode`.
2. Read the persisted value asynchronously.
3. Validate the persisted value.
4. Apply the persisted value only when valid.
5. Ignore storage errors and invalid values without crashing.

Valid persisted values are:

- `light`;
- `dark`;
- `system`.

Any other value must be ignored.

## 10. Release Impact

Impact classification: low / medium.

The decision is additive when implemented as an optional API. It is not breaking when:

- `ThemeProvider` continues to function without persistence;
- AsyncStorage is not imported directly;
- no mandatory native dependency is added;
- default theme behavior remains stable;
- persistence is opt-in.

The decision becomes breaking if:

- AsyncStorage becomes a required dependency;
- the root package imports AsyncStorage;
- theme rendering requires async storage;
- existing theme behavior changes without opt-in;
- consumers must update native configuration only to preserve current behavior.

## 11. Dependency Classification

`@react-native-async-storage/async-storage` must be classified as:

- optional consumer dependency.

It must not be classified as:

- runtime dependency;
- required peer dependency;
- hard native dependency.

The package may document AsyncStorage as one supported consumer-side adapter recipe.

## 12. Security and Privacy Notes

Theme persistence must not be used for sensitive data.

The theme storage contract is intended only for non-sensitive UI preferences such as `light`, `dark`, and `system`. Consumers that require secure preference storage must provide a backend appropriate for their threat model and platform constraints.

The library must validate stored values before applying them and must ignore invalid data without exposing crashes to the app runtime.

## 13. Alternatives Considered

### Option A — No persistence support

This option keeps the library fully storage-free and avoids all storage governance risk.

Decision: rejected.

Reason: theme persistence is a valid consumer need, and the library can support it without owning the native storage backend.

### Option B — Mandatory AsyncStorage dependency

This option imports `@react-native-async-storage/async-storage` directly from the UI library and makes it part of runtime installation.

Decision: rejected.

Reason: it turns an optional theme preference feature into a native runtime requirement. It increases package consumability risk, creates Expo/RN compatibility obligations for all consumers, and conflicts with native dependency governance.

### Option C — Optional storage adapter

This option defines a storage adapter contract and lets consumers provide AsyncStorage, MMKV, SecureStore, a custom adapter, or no storage.

Decision: accepted.

Reason: it keeps the UI library storage-agnostic, supports persistence as opt-in behavior, and preserves consumer ownership of native runtime dependencies.

### Option D — Official AsyncStorage adapter subpath

This option would provide a future official adapter such as:

```txt
@personal-library/react-native-components/adapters/async-storage
```

Decision: candidate future ticket only.

Reason: a subpath adapter could improve ergonomics, but it would require separate dependency, export, packaging, and native governance review. PLRNUI-38 does not approve or implement it.

## 14. Final Decision

Theme persistence must be optional and adapter-based.

`@personal-library/react-native-components` must define the storage contract and default to non-persistent theme behavior. Consumer applications must own the concrete storage backend.

`@react-native-async-storage/async-storage` must not be added as a required runtime dependency and must not be imported directly by the library root package or core theme runtime. It is permitted only as an optional consumer-provided implementation.

## 15. Acceptance Criteria Mapping

| Acceptance criterion | Coverage |
| --- | --- |
| Strategy defined | Sections 4, 5, 8, 9, and 14 define optional adapter-based theme persistence. |
| Consumer responsibilities defined | Section 7 defines backend selection, install/configuration, adapter ownership, runtime compatibility, and data responsibility. |
| Release impact evaluated | Section 10 classifies impact and identifies non-breaking and breaking conditions. |

## 16. Follow-up Tasks

- Implement `ThemeStorageAdapter` as an optional contract in a separate code ticket.
- Update theme provider documentation with AsyncStorage as an optional recipe after the API is implemented.
- Add tests for default non-persistent behavior, valid hydration, invalid persisted values, and storage error handling in the implementation ticket.
- Evaluate an official `adapters/async-storage` subpath in a separate future ticket if consumer ergonomics require it.
- Keep dependency/package changes outside PLRNUI-38 unless separately approved.

## 17. Decision Summary

PLRNUI-38 decides that theme persistence must not make AsyncStorage a mandatory dependency.

The UI library owns the stable adapter contract and safe default behavior. The consumer application owns AsyncStorage, MMKV, SecureStore, custom storage, or the decision to use no persistence.

This preserves package consumability, keeps native runtime dependencies under governance, and supports theme persistence as an additive opt-in capability.
