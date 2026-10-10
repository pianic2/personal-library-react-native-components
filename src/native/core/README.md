# Native capability layer (core)

Contract for device capabilities (clipboard, haptics, share, storage, biometric, network) that the library exposes
without a native dependency. This folder is the contract only; concrete adapters live in their own tickets. It is
**not** exported from the root entry: it is reached through the `./native` subpath (and Expo factories through
`./native/expo`) once the export contract wires them (ADR 0009, ticket E8-02).

## Model

- `CapabilityMap` maps a capability id to its api type. It is **closed in 1.0**: do not extend it by module
  augmentation; a new capability is a minor release of this package. Naming: ids are lowercase camelCase nouns, api
  types are `<Id>Api`.
- `CapabilityAdapter<T>` is `{ id, status, api }` with `status` `available`, `unavailable` or `noop`.
- `useCapability(id)` returns the adapter and `useCapabilityStatus(id)` its status.

## Resolution order (never throws)

1. an adapter given to the nearest `CapabilityProvider` that has it (inner providers override outer ones per id);
2. the default in the nearest `createCapabilityRegistry()` passed to a provider;
3. the React Native core fallback (`haptics` through `Vibration`, `share` through `Share`, when the host has them);
4. a `noop` adapter whose api does nothing.

With no provider mounted and no optional package installed, `useCapability` returns a `noop` (or RN-core) adapter.

## Injection (no `require`)

`defineExpoAdapter(id, create)` returns a factory. The app imports the optional module and passes it in:

```ts
import * as ExpoClipboard from "expo-clipboard"; // in the app, not in this package
const clipboard = defineExpoAdapter<"clipboard", { getStringAsync(): Promise<string>; setStringAsync(v: string): Promise<unknown> }>(
  "clipboard",
  (m) => ({ getString: () => m.getStringAsync(), setString: async (v) => void (await m.setStringAsync(v)) })
);
<CapabilityProvider adapters={{ clipboard: clipboard(ExpoClipboard) }}>…</CapabilityProvider>
```

Called without the module it returns an `unavailable` adapter with a noop api.

## Rules

- Files here import only `react` and `react-native`; no `expo-*`, no other native package, no `require`.
- Tests use mock adapters only.
