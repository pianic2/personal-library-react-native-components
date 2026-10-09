# ADR 0010: Peer and optional dependency policy

## Status

Accepted for the mechanism (injection, rule per package type, shim dependency): decisions D6 and D10 of `audit/texo-v1/DECISIONS.md`, from `audit/texo-v1/reviews/R1-architecture-review.md` ADR-R5.

Proposed - pending H2: the allowance for `peerDependenciesMeta` optional peers for non-Expo libraries. The owner answered "Yes" to H2 on 2026-10-09 (`DECISIONS.md`, PO decisions), but the amendment of the native-dependency gate (PLRNUI-39) and of `scripts/release-guard.mjs` has not been made yet; until it is, no optional peer is declared in `package.json`.

## Context

`scripts/release-guard.mjs` forbids runtime `dependencies`, and `package.json` declares only `react` and `react-native` as peers. The native capabilities planned in E8 (haptics, clipboard, storage, safe area, camera and similar) and the adapters of E4, E5 and E7 need third-party libraries without breaking `import "<package>"` for consumers who do not have them. This ADR also absorbs the native adapter contract decision of E8-02 (docs/adr is not used, D1).

## Decision

1. **Injection is the only core mechanism.** The core never imports a third-party native library. A capability contract is implemented by a factory that receives the module as an argument, for example `createExpoHaptics(Haptics)`, `createSvgIconSet(Svg)` or `createFlashListRenderer(FlashList)`.
2. **No `require()` in `src`.** Optional modules are never loaded with `require` or `try { require } catch`. `tests/scripts/optional-peers.test.ts` fails if `src` contains a `require(` call or a static import of an optional peer.
3. **Convenience adapters live in `./adapters/<lib>`.** An adapter module may import its library statically, only from its own subpath (`./adapters/*` in `config/exports.json`, ADR 0009). The root entry must never reach an adapter.
4. **`expo-*` modules only from `./native`.** Expo modules are used only behind `./native` and `./native/expo`, and only through injection: `createExpoCapabilities({ haptics: Haptics, ... })` takes the modules as arguments.
5. **Rule per package type:**

| Package type | Where declared | Example | Rule |
| --- | --- | --- | --- |
| Required runtime platform | `peerDependencies` | `react`, `react-native` | Version ranges follow the compatibility baseline (docs/compatibility.md). |
| Expo module | none (injected; ADR 0009 lists `expo` as a placeholder optional peer of `./native/expo`, which this ADR supersedes: no Expo module is a peer) | `expo-haptics`, `expo-clipboard`, `expo-secure-store` | Never a dependency or a peer; the consumer installs it and passes it to the factory. |
| Non-Expo native library with an adapter | `peerDependencies` plus `peerDependenciesMeta` `optional: true` (Proposed - pending H2) | `react-native-svg`, `@shopify/flash-list`, `react-native-safe-area-context`, `@react-native-community/datetimepicker` | Imported only from `./adapters/<lib>`; absent libraries never break the root import. |
| Pure JS helper | `devDependencies` only, never shipped | `typescript`, test tools | The package keeps no runtime `dependencies`. |
| Test tooling for consumers | optional peer of `./testing` only (Proposed - pending H2) | `react-test-renderer` | Never reachable from the root entry. |

6. **Root-reachability boundary.** A check (owned by E8-02) must prove that nothing reachable from `.` imports an adapter or an Expo module; `tests/scripts/optional-peers.test.ts` is the first line of defence: it imports the root with `expo-*` and the four optional libraries made unresolvable.

## Shim dependencies

The legacy shim package (ADR 0013) has exactly one dependency: the target package, with the range `^<major>.0.0` (for example `^1.0.0`), never an exact pin (D10). The shim declares no peers of its own beyond what the target requires, and no `postinstall`.

## Expo Go

Expo Go ships a fixed set of native modules. Because core code never imports a native library, an app in Expo Go can use every core component; capabilities that need a module outside Expo Go are simply not injected, and the fallback (React Native core or web) is used. Adapters for libraries that Expo Go does not include are not usable there.

## Managed

In a managed Expo workflow the consumer adds the Expo modules they want with `npx expo install` and injects them. Optional peers (once H2 is formalised) are installed the same way. No config plugin is required by this package.

## Prebuild

With `expo prebuild`, native projects are generated from the installed modules. A module that is injected or an adapter library that is installed is autolinked by the usual Expo mechanism; this package adds no native code and no plugin.

## Bare

In a bare React Native app the consumer installs and links the libraries (autolinking). The same rules apply: injection for Expo modules, optional peers for the four libraries, none at all for consumers who do not use them.

## Alternatives

- **`try { require("lib") }` inside the core.** Rejected: it breaks bundlers that resolve statically, hides the dependency, and makes the root import depend on what is installed.
- **Hard `dependencies` or required peers for every native library.** Rejected: it forces every consumer to install libraries they do not use and breaks Expo Go.
- **A separate package per adapter.** Rejected for 1.0 because the subpath `./adapters/*` gives the same isolation without more packages to release in lockstep.
- **Dynamic `import()` with a catch.** Rejected for the same reasons as `require`, and because it makes the capability set a runtime surprise.

## Consequences

- Consumers get a working root import with only `react` and `react-native` installed.
- Declaring optional peers in `package.json` and relaxing the release guard are separate changes (E14-02 and the release tickets), made only after the H2 amendment is formalised.
- The test of this ADR is part of `tests/scripts/*.test.ts`, so the PR workflow runs it.

## References

- `audit/texo-v1/DECISIONS.md` D6, D10, H2; `audit/texo-v1/reviews/R1-architecture-review.md` ADR-R5
- ADR 0009 (subpath exports), ADR 0013 (legacy shim policy), ADR 0012 (motion engine and optional peers)
