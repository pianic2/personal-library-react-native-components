# ADR 0012: Motion engine and optional peers

## Status

Accepted by orchestrator decision D11 (`audit/texo-v1/DECISIONS.md`, 2026-10-09, based on `reviews/R1-architecture-review.md` ADR-R11).

Owner sign-off (name and date): **pending**. The product owner records it here before any dependent ticket of PLRNUI-127 starts:

- Signed off by: _(name)_
- Date: _(YYYY-MM-DD)_

## Context

The library needs animation and gesture primitives (tokens for duration and easing, press feedback, presence, layout transitions). The native dependency gate (`audit/dependencies/native-dependency-gate.md`) forbids silent native dependencies, and the peer policy (`audit/dependencies/peer-dependency-policy.md`) keeps `react` and `react-native` as the only peers. `package.json` currently exposes the root entry only (`exports["."]`) and declares exactly two peers: `react` and `react-native`. No decision existed for `Animated` versus Reanimated, gesture-handler or haptics.

## Decision

1. **Core engine: React Native built-ins only, zero new dependencies.**
   - `Animated`, with `useNativeDriver: true` wherever the animated property supports it;
   - `LayoutAnimation` for layout transitions;
   - `PanResponder` for gestures.
2. **Reduced motion gates every animation.** All core animation honors the reduced-motion preference.
3. **Reanimated and gesture-handler are not core peers.** They may be used only through a `MotionEngine` adapter shipped in a separate entry point or package, and only after a future ADR approves that entry point. This ADR does not add it. The root entry stays the only export (`exports["."]` in `package.json`), so nothing in the root import graph may import either package.
4. **Haptics are an adapter, consumer-owned.** Same pattern as the clipboard decision (`audit/dependencies/clipboard-dependency-strategy.md`): the library defines the contract, the application installs and passes the implementation (for example `expo-haptics`). The core package must not declare or import a haptics package.
5. **No change to `peerDependencies`.** The peer set stays `react` and `react-native`, consistent with the peer policy.
6. **Expo Go matrix.** Core features (Animated, LayoutAnimation, PanResponder) work in Expo Go, managed, prebuild and bare. Optional packages are documented per candidate in `audit/dependencies/motion-dependency-strategy.md`.

## Consequences

- No install-time or native-config cost for consumers of the core animation features.
- Animations that depend on the UI-thread worklet model (gesture-driven continuous interactions, shared-value based effects) are out of core scope until the adapter ADR exists.
- `LayoutAnimation` needs an explicit enable call on older Android architectures; the motion helper ticket must document it.
- Dependent tickets (E3 motion tokens, provider, primitives, presence, press feedback, shimmer, layout helper) can rely on `Animated` only and must not add dependencies.
- Haptics call sites receive an adapter; a missing adapter means no haptics, never an error.

## Alternatives considered

| Alternative | Verdict | Reason |
| --- | --- | --- |
| Animated-only (chosen) | Accepted | Zero dependencies, runs everywhere including Expo Go and web, enough for the planned primitives. |
| Reanimated as optional peer | Rejected for 1.0 | Needs a Babel plugin and native module; `peerDependenciesMeta` optional peers would still shape the root install story and break the root-only export contract. Reconsider through the `MotionEngine` adapter in a separate entry point. |
| Reanimated required | Rejected | Native dependency for every consumer; breaks Expo Go version-lock assumptions and non-Expo setups; violates the native dependency gate. |

## References

- `audit/dependencies/motion-dependency-strategy.md` (per-package Expo Go / managed / prebuild / bare impact and gate register rows)
- `audit/dependencies/native-dependency-gate.md`
- `audit/dependencies/peer-dependency-policy.md`
- `audit/dependencies/clipboard-dependency-strategy.md`
- `audit/texo-v1/DECISIONS.md` D1 (ADR numbering) and D11 (motion)
