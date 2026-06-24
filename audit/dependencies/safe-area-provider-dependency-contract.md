# PLRNUI-37 / PLRNUI-28 - Safe Area Provider Dependency Contract

## Scope

This file records the safe-area dependency contract after PLRNUI-28.

PLRNUI-37 previously documented a required `react-native-safe-area-context` peer while `ThemeProvider` owned default safe-area behavior. PLRNUI-28 supersedes that provider contract: `ThemeProvider` is now a pure theme context provider and does not implement safe-area behavior.

## Current Source Evidence

- `src/theme/ThemeProvider.tsx` renders only `ThemeContext.Provider` and `children`.
- `src/theme/ThemeAppShell.tsx` provides explicit opt-in app layout and optional scroll behavior.
- `ThemeAppShell` does not implement safe-area support.
- Current `src` must not import `react-native-safe-area-context`, `SafeAreaProvider` or `SafeAreaView`.
- Current package metadata does not declare `react-native-safe-area-context`.

## Decision

`react-native-safe-area-context` is not required by the current `ThemeProvider` contract.

PLRNUI-28 does not add safe-area support, does not add a safe-area injection prop, does not add a dependency, and does not change package metadata.

## Consumer Impact

Consumers using `ThemeProvider` no longer need a safe-area dependency for provider rendering.

Consumers that need safe-area behavior should compose it in their app shell outside this package until a future safe-area API is approved.

## Future Governance

Any future package-provided safe-area behavior must be handled in a separate ticket and must define:

- source import path;
- package metadata section;
- Expo/RN compatibility;
- managed/prebuild/bare workflow impact;
- clean consumer smoke coverage;
- breaking-change register impact if consumers must install a peer or behavior changes.

## Final Verdict

No current provider dependency.

No package metadata change in PLRNUI-28.
